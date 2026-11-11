import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

const MENSAJE_SESION = 'Tu sesión expiró. Inicia sesión de nuevo.';

export async function autenticar(req, res, next) {
  const encabezado = req.headers.authorization ?? '';
  const [esquema, token] = encabezado.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'Token no proporcionado.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(payload.sub);

    if (!usuario) {
      return res.status(401).json({ mensaje: MENSAJE_SESION });
    }

    req.usuario = usuario;
    return next();
  } catch (error) {
    return res.status(401).json({ mensaje: MENSAJE_SESION });
  }
}

export function autorizarRoles(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ mensaje: MENSAJE_SESION });
    }

    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para esta acción.' });
    }

    return next();
  };
}

export const soloAdmin = autorizarRoles('admin');

export async function autenticarOpcional(req, res, next) {
  const encabezado = req.headers.authorization ?? '';
  const [esquema, token] = encabezado.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(payload.sub);
    if (usuario) req.usuario = usuario;
  } catch (error) {
    // La sesión opcional no bloquea la petición pública.
  }

  return next();
}
