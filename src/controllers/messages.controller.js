import Mensaje from '../models/Mensaje.js';
import Notificacion from '../models/Notificacion.js';
import Usuario from '../models/Usuario.js';
import {
  esIdValido,
  serializarMensaje,
  serializarUsuarioPublico,
} from '../utils/serializers.js';

const CAMPOS_USUARIO = 'nombre username avatar verificado ubicacion stats';

export async function listarConversaciones(req, res) {
  const usuarioId = req.usuario._id;

  const mensajes = await Mensaje.find({
    $or: [{ emisor: usuarioId }, { receptor: usuarioId }],
  })
    .sort({ createdAt: -1 })
    .populate('emisor', CAMPOS_USUARIO)
    .populate('receptor', CAMPOS_USUARIO)
    .limit(300);

  const conversaciones = new Map();

  for (const mensaje of mensajes) {
    const soyEmisor = String(mensaje.emisor?._id) === String(usuarioId);
    const otro = soyEmisor ? mensaje.receptor : mensaje.emisor;

    if (!otro) continue;

    const clave = String(otro._id);

    if (!conversaciones.has(clave)) {
      conversaciones.set(clave, {
        usuario: serializarUsuarioPublico(otro),
        ultimoMensaje: {
          contenido: mensaje.contenido,
          emisor: soyEmisor ? 'yo' : 'otro',
          leido: Boolean(mensaje.leido),
          createdAt: mensaje.createdAt,
        },
        noLeidos: 0,
      });
    }

    if (!soyEmisor && !mensaje.leido) {
      conversaciones.get(clave).noLeidos += 1;
    }
  }

  return res.status(200).json({
    conversaciones: Array.from(conversaciones.values()),
  });
}

export async function listarMensajesCon(req, res) {
  const { usuarioId } = req.params;
  const miId = req.usuario._id;

  if (!esIdValido(usuarioId)) {
    return res.status(400).json({ mensaje: 'El identificador del usuario no es válido.' });
  }

  if (String(usuarioId) === String(miId)) {
    return res.status(400).json({ mensaje: 'No puedes abrir una conversación contigo mismo.' });
  }

  const otro = await Usuario.findById(usuarioId).select(CAMPOS_USUARIO);

  if (!otro) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  }

  await Mensaje.updateMany(
    { emisor: usuarioId, receptor: miId, leido: false },
    { $set: { leido: true } }
  );

  const mensajes = await Mensaje.find({
    $or: [
      { emisor: miId, receptor: usuarioId },
      { emisor: usuarioId, receptor: miId },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(300);

  return res.status(200).json({
    usuario: serializarUsuarioPublico(otro),
    mensajes: mensajes.map(serializarMensaje),
  });
}

export async function enviarMensaje(req, res) {
  const { usuarioId } = req.params;
  const miId = req.usuario._id;

  if (!esIdValido(usuarioId)) {
    return res.status(400).json({ mensaje: 'El identificador del usuario no es válido.' });
  }

  if (String(usuarioId) === String(miId)) {
    return res.status(400).json({ mensaje: 'No puedes enviarte mensajes a ti mismo.' });
  }

  const contenido = typeof req.body?.contenido === 'string' ? req.body.contenido.trim() : '';

  if (!contenido) {
    return res.status(400).json({ mensaje: 'Escribe un mensaje antes de enviarlo.' });
  }

  if (contenido.length > 1000) {
    return res.status(400).json({ mensaje: 'El mensaje no puede superar los 1000 caracteres.' });
  }

  const receptor = await Usuario.findById(usuarioId).select('_id nombre');

  if (!receptor) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  }

  if (req.body.articuloRelacionado && !esIdValido(req.body.articuloRelacionado)) {
    return res.status(400).json({ mensaje: 'El artículo relacionado no es válido.' });
  }

  const mensaje = await Mensaje.create({
    emisor: miId,
    receptor: usuarioId,
    contenido,
    articuloRelacionado: req.body.articuloRelacionado || null,
  });

  await Notificacion.create({
    usuario: usuarioId,
    tipo: 'mensaje',
    mensaje: `${req.usuario.nombre} te envió un mensaje.`,
    enlace: '/mensajes',
  });

  return res.status(201).json({ mensaje: serializarMensaje(mensaje) });
}
