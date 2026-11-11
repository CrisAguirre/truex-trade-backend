import Item from '../models/Item.js';
import Usuario from '../models/Usuario.js';
import {
  esIdValido,
  serializarUsuarioPublico,
} from '../utils/serializers.js';

const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,20}$/;

export async function obtenerUsuarioPublico(req, res) {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ mensaje: 'El identificador del usuario no es válido.' });
  }

  const usuario = await Usuario.findById(req.params.id);

  if (!usuario) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  }

  const publicaciones = await Item.countDocuments({ usuario: usuario._id, activo: true });
  const perfil = serializarUsuarioPublico(usuario);
  perfil.stats.publicaciones = publicaciones;

  return res.status(200).json({ usuario: perfil });
}

export async function actualizarPerfil(req, res) {
  const { nombre, username, ubicacion, avatar } = req.body ?? {};
  const errores = {};

  if (nombre !== undefined) {
    const limpio = String(nombre).trim();
    if (limpio.length < 2 || limpio.length > 60) {
      errores.nombre = 'Escribe tu nombre (2 a 60 caracteres).';
    }
  }

  if (username !== undefined) {
    const limpio = String(username).trim();
    if (!USERNAME_REGEX.test(limpio)) {
      errores.username = 'Usa de 3 a 20 caracteres: letras, números, punto o guion bajo.';
    }
  }

  if (ubicacion !== undefined) {
    const limpio = String(ubicacion).trim();
    if (limpio.length < 2 || limpio.length > 80) {
      errores.ubicacion = 'Indica tu ciudad o región.';
    }
  }

  if (avatar !== undefined && typeof avatar !== 'string') {
    errores.avatar = 'El avatar debe ser una URL o una imagen válida.';
  }

  if (Object.keys(errores).length > 0) {
    return res.status(400).json({ mensaje: 'Revisa los datos del perfil.', errores });
  }

  const usuario = await Usuario.findById(req.usuario._id);

  if (!usuario) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  }

  if (nombre !== undefined) usuario.nombre = String(nombre).trim();

  if (username !== undefined) {
    const usernameNormalizado = String(username).trim().toLowerCase();
    if (usernameNormalizado !== usuario.username) {
      const existente = await Usuario.findOne({
        username: usernameNormalizado,
        _id: { $ne: usuario._id },
      }).select('_id');

      if (existente) {
        return res.status(409).json({
          mensaje: 'Ese nombre de usuario ya está en uso.',
          errores: { username: 'Ese nombre de usuario ya está en uso.' },
        });
      }

      usuario.username = usernameNormalizado;
    }
  }

  if (ubicacion !== undefined) usuario.ubicacion = String(ubicacion).trim();
  if (avatar !== undefined) usuario.avatar = avatar;

  await usuario.save();

  return res.status(200).json({ user: usuario.toPublico() });
}
