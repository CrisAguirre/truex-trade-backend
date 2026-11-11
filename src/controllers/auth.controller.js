import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,20}$/;

const MENSAJE_SESION = 'Tu sesión expiró. Inicia sesión de nuevo.';

function validarRegistro({ nombre, username, email, password, ubicacion }) {
  const errores = {};

  if (!nombre || nombre.trim().length < 2 || nombre.trim().length > 60) {
    errores.nombre = 'Escribe tu nombre (2 a 60 caracteres).';
  }

  if (!username || !USERNAME_REGEX.test(username.trim())) {
    errores.username = 'Usa de 3 a 20 caracteres: letras, números, punto o guion bajo.';
  }

  if (!email || !CORREO_REGEX.test(email.trim())) {
    errores.correo = 'Ingresa un correo válido.';
  }

  if (!ubicacion || ubicacion.trim().length < 2) {
    errores.ubicacion = 'Indica tu ciudad o región.';
  }

  if (!password || password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    errores.clave = 'Mínimo 8 caracteres con al menos una letra y un número.';
  }

  return errores;
}

function crearToken(usuario) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    const error = new Error('JWT_SECRET no está configurado en el servidor.');
    error.status = 500;
    throw error;
  }

  return jwt.sign({ sub: usuario._id.toString() }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function respuestaSesion(usuario) {
  return {
    token: crearToken(usuario),
    user: usuario.toPublico(),
  };
}

export async function registrar(req, res) {
  const { nombre = '', username = '', email = '', password = '', ubicacion = '' } = req.body ?? {};

  const errores = validarRegistro({ nombre, username, email, password, ubicacion });

  if (Object.keys(errores).length > 0) {
    return res.status(400).json({
      mensaje: 'Revisa los datos del formulario.',
      errores,
    });
  }

  const correo = email.trim().toLowerCase();
  const usuarioNormalizado = username.trim().toLowerCase();

  const existente = await Usuario.findOne({
    $or: [{ email: correo }, { username: usuarioNormalizado }],
  }).select('email username');

  if (existente) {
    const esCorreo = existente.email === correo;
    return res.status(409).json({
      mensaje: esCorreo
        ? 'Ya existe una cuenta con este correo.'
        : 'Ese nombre de usuario ya está en uso.',
      errores: esCorreo
        ? { correo: 'Ya existe una cuenta con este correo.' }
        : { username: 'Ese nombre de usuario ya está en uso.' },
    });
  }

  try {
    const usuario = await Usuario.create({
      nombre: nombre.trim(),
      username: usuarioNormalizado,
      email: correo,
      password,
      ubicacion: ubicacion.trim(),
    });

    return res.status(201).json(respuestaSesion(usuario));
  } catch (error) {
    if (error.code === 11000) {
      const campo = Object.keys(error.keyValue ?? {})[0];
      const esCorreo = campo === 'email';
      return res.status(409).json({
        mensaje: esCorreo
          ? 'Ya existe una cuenta con este correo.'
          : 'Ese nombre de usuario ya está en uso.',
      });
    }

    throw error;
  }
}

export async function login(req, res) {
  const { email = '', password = '' } = req.body ?? {};

  if (!email.trim() || !password) {
    return res.status(400).json({
      mensaje: 'Ingresa tu correo y tu contraseña.',
      errores: {
        correo: email.trim() ? undefined : 'Ingresa un correo válido.',
        clave: password ? undefined : 'Ingresa tu contraseña.',
      },
    });
  }

  const usuario = await Usuario.findOne({ email: email.trim().toLowerCase() }).select('+password');

  if (!usuario) {
    return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
  }

  const claveValida = await usuario.compararClave(password);

  if (!claveValida) {
    return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
  }

  return res.status(200).json(respuestaSesion(usuario));
}

export async function perfil(req, res) {
  if (!req.usuario) {
    return res.status(401).json({ mensaje: MENSAJE_SESION });
  }

  return res.status(200).json({ user: req.usuario.toPublico() });
}
