import Notificacion from '../models/Notificacion.js';
import {
  esIdValido,
  serializarNotificacion,
} from '../utils/serializers.js';

export async function listarNotificaciones(req, res) {
  const usuarioId = req.usuario._id;

  const [notificaciones, noLeidas] = await Promise.all([
    Notificacion.find({ usuario: usuarioId }).sort({ createdAt: -1 }).limit(50),
    Notificacion.countDocuments({ usuario: usuarioId, leida: false }),
  ]);

  return res.status(200).json({
    notificaciones: notificaciones.map(serializarNotificacion),
    noLeidas,
  });
}

export async function marcarNotificacionLeida(req, res) {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ mensaje: 'El identificador de la notificación no es válido.' });
  }

  const notificacion = await Notificacion.findOneAndUpdate(
    { _id: req.params.id, usuario: req.usuario._id },
    { $set: { leida: true } },
    { new: true }
  );

  if (!notificacion) {
    return res.status(404).json({ mensaje: 'Notificación no encontrada.' });
  }

  return res.status(200).json({ notificacion: serializarNotificacion(notificacion) });
}

export async function marcarTodasLeidas(req, res) {
  const resultado = await Notificacion.updateMany(
    { usuario: req.usuario._id, leida: false },
    { $set: { leida: true } }
  );

  return res.status(200).json({
    mensaje: 'Notificaciones marcadas como leídas.',
    actualizadas: resultado.modifiedCount ?? 0,
  });
}

export async function eliminarNotificacion(req, res) {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ mensaje: 'El identificador de la notificación no es válido.' });
  }

  const notificacion = await Notificacion.findOneAndDelete({
    _id: req.params.id,
    usuario: req.usuario._id,
  });

  if (!notificacion) {
    return res.status(404).json({ mensaje: 'Notificación no encontrada.' });
  }

  return res.status(200).json({ mensaje: 'Notificación eliminada.' });
}
