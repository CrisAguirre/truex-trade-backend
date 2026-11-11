import Intercambio from '../models/Intercambio.js';
import Item from '../models/Item.js';
import Mensaje from '../models/Mensaje.js';
import Notificacion from '../models/Notificacion.js';
import Usuario from '../models/Usuario.js';
import { ROLES } from '../utils/constants.js';
import {
  escaparRegex,
  esIdValido,
  paginacion,
  serializarUsuarioAdmin,
} from '../utils/serializers.js';

function construirFiltros(query = {}) {
  const filtros = {};

  if (query.buscar) {
    const patron = new RegExp(escaparRegex(query.buscar.trim()), 'i');
    filtros.$or = [{ nombre: patron }, { username: patron }, { email: patron }];
  }

  if (query.rol && ROLES.includes(query.rol)) {
    filtros.rol = query.rol;
  }

  return filtros;
}

export async function listarUsuarios(req, res) {
  const { pagina, limite, saltar } = paginacion(req.query, {
    limitePorDefecto: 20,
    limiteMaximo: 100,
  });
  const filtros = construirFiltros(req.query);

  const [usuarios, total] = await Promise.all([
    Usuario.find(filtros).sort({ createdAt: -1 }).skip(saltar).limit(limite),
    Usuario.countDocuments(filtros),
  ]);

  return res.status(200).json({
    usuarios: usuarios.map(serializarUsuarioAdmin),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / limite)),
  });
}

export async function cambiarRol(req, res) {
  const { id } = req.params;
  const { rol } = req.body ?? {};

  if (!esIdValido(id)) {
    return res.status(400).json({ mensaje: 'El identificador del usuario no es válido.' });
  }

  if (!ROLES.includes(rol)) {
    return res.status(400).json({ mensaje: 'El rol debe ser usuario o admin.' });
  }

  if (String(id) === String(req.usuario._id)) {
    return res.status(400).json({ mensaje: 'No puedes cambiar tu propio rol.' });
  }

  const usuario = await Usuario.findById(id);

  if (!usuario) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  }

  if (usuario.rol === rol) {
    return res.status(200).json({
      mensaje: 'El usuario ya tiene ese rol.',
      usuario: serializarUsuarioAdmin(usuario),
    });
  }

  if (usuario.rol === 'admin' && rol === 'usuario') {
    const administradores = await Usuario.countDocuments({ rol: 'admin' });
    if (administradores <= 1) {
      return res.status(400).json({ mensaje: 'Debe existir al menos un administrador.' });
    }
  }

  usuario.rol = rol;
  await usuario.save();

  return res.status(200).json({
    mensaje: `Rol actualizado a ${rol}.`,
    usuario: serializarUsuarioAdmin(usuario),
  });
}

export async function eliminarUsuario(req, res) {
  const { id } = req.params;

  if (!esIdValido(id)) {
    return res.status(400).json({ mensaje: 'El identificador del usuario no es válido.' });
  }

  if (String(id) === String(req.usuario._id)) {
    return res.status(400).json({ mensaje: 'No puedes eliminar tu propia cuenta desde el panel.' });
  }

  const usuario = await Usuario.findById(id);

  if (!usuario) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  }

  if (usuario.rol === 'admin') {
    const administradores = await Usuario.countDocuments({ rol: 'admin' });
    if (administradores <= 1) {
      return res.status(400).json({ mensaje: 'Debe existir al menos un administrador.' });
    }
  }

  await Promise.all([
    Item.updateMany({ usuario: usuario._id }, { $set: { activo: false } }),
    Mensaje.deleteMany({ $or: [{ emisor: usuario._id }, { receptor: usuario._id }] }),
    Notificacion.deleteMany({ usuario: usuario._id }),
    Intercambio.deleteMany({
      $or: [{ solicitante: usuario._id }, { propietario: usuario._id }],
    }),
  ]);

  await Usuario.deleteOne({ _id: usuario._id });

  return res.status(200).json({ mensaje: 'Usuario eliminado.', id: String(usuario._id) });
}

export async function estadisticasAdmin(req, res) {
  const haceSieteDias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    usuarios,
    administradores,
    verificados,
    nuevos,
    publicaciones,
    intercambios,
    pendientes,
    mensajes,
    noLeidas,
  ] = await Promise.all([
    Usuario.countDocuments(),
    Usuario.countDocuments({ rol: 'admin' }),
    Usuario.countDocuments({ verificado: true }),
    Usuario.countDocuments({ createdAt: { $gte: haceSieteDias } }),
    Item.countDocuments({ activo: true }),
    Intercambio.countDocuments(),
    Intercambio.countDocuments({ estado: 'pendiente' }),
    Mensaje.countDocuments(),
    Notificacion.countDocuments({ leida: false }),
  ]);

  return res.status(200).json({
    usuarios,
    administradores,
    verificados,
    nuevosUltimaSemana: nuevos,
    publicaciones,
    intercambios,
    intercambiosPendientes: pendientes,
    mensajes,
    notificacionesNoLeidas: noLeidas,
    timestamp: new Date().toISOString(),
  });
}
