import Intercambio from '../models/Intercambio.js';
import Item from '../models/Item.js';
import Notificacion from '../models/Notificacion.js';
import Usuario from '../models/Usuario.js';
import {
  esIdValido,
  serializarIntercambio,
} from '../utils/serializers.js';

const CAMPOS_USUARIO = 'nombre username avatar verificado ubicacion stats';

const TRANSICIONES = {
  aceptado: ['pendiente'],
  rechazado: ['pendiente'],
  cancelado: ['pendiente', 'aceptado'],
  completado: ['aceptado'],
};

function populado(consulta) {
  return consulta
    .populate({ path: 'articulo', populate: { path: 'usuario', select: CAMPOS_USUARIO } })
    .populate({ path: 'articuloOfrecido', populate: { path: 'usuario', select: CAMPOS_USUARIO } })
    .populate('solicitante', CAMPOS_USUARIO)
    .populate('propietario', CAMPOS_USUARIO);
}

export async function crearIntercambio(req, res) {
  const { articuloId, articuloOfrecidoId, mensaje = '' } = req.body ?? {};

  if (!esIdValido(articuloId)) {
    return res.status(400).json({ mensaje: 'Selecciona un artículo válido.' });
  }

  const articulo = await Item.findOne({ _id: articuloId, activo: true });

  if (!articulo) {
    return res.status(404).json({ mensaje: 'Artículo no encontrado.' });
  }

  if (String(articulo.usuario) === String(req.usuario._id)) {
    return res.status(400).json({ mensaje: 'No puedes proponer un trueque por tu propio artículo.' });
  }

  let articuloOfrecido = null;

  if (articuloOfrecidoId) {
    if (!esIdValido(articuloOfrecidoId)) {
      return res.status(400).json({ mensaje: 'El artículo ofrecido no es válido.' });
    }

    articuloOfrecido = await Item.findOne({
      _id: articuloOfrecidoId,
      activo: true,
      usuario: req.usuario._id,
    });

    if (!articuloOfrecido) {
      return res.status(400).json({
        mensaje: 'El artículo ofrecido debe ser tuyo y estar activo.',
      });
    }
  }

  if (typeof mensaje !== 'string' || mensaje.length > 500) {
    return res.status(400).json({ mensaje: 'El mensaje no puede superar los 500 caracteres.' });
  }

  const pendiente = await Intercambio.findOne({
    articulo: articulo._id,
    solicitante: req.usuario._id,
    estado: 'pendiente',
  });

  if (pendiente) {
    return res.status(409).json({ mensaje: 'Ya tienes una propuesta pendiente para este artículo.' });
  }

  const intercambio = await Intercambio.create({
    articulo: articulo._id,
    articuloOfrecido: articuloOfrecido?._id ?? null,
    solicitante: req.usuario._id,
    propietario: articulo.usuario,
    mensaje: mensaje.trim(),
  });

  await Notificacion.create({
    usuario: articulo.usuario,
    tipo: 'intercambio',
    mensaje: `${req.usuario.nombre} quiere intercambiar por "${articulo.titulo}".`,
    enlace: '/perfil/intercambios',
  });

  const completo = await populado(Intercambio.findById(intercambio._id));

  return res.status(201).json({ intercambio: serializarIntercambio(completo) });
}

export async function listarIntercambios(req, res) {
  const usuarioId = req.usuario._id;

  const intercambios = await populado(
    Intercambio.find({
      $or: [{ solicitante: usuarioId }, { propietario: usuarioId }],
    }).sort({ createdAt: -1 })
  );

  return res.status(200).json({
    intercambios: intercambios.map(serializarIntercambio),
  });
}

export async function actualizarEstadoIntercambio(req, res) {
  const { id } = req.params;
  const { estado } = req.body ?? {};

  if (!esIdValido(id)) {
    return res.status(400).json({ mensaje: 'El identificador del intercambio no es válido.' });
  }

  if (!Object.prototype.hasOwnProperty.call(TRANSICIONES, estado)) {
    return res.status(400).json({
      mensaje: 'El estado debe ser aceptado, rechazado, cancelado o completado.',
    });
  }

  const intercambio = await Intercambio.findById(id);

  if (!intercambio) {
    return res.status(404).json({ mensaje: 'Intercambio no encontrado.' });
  }

  const esSolicitante = String(intercambio.solicitante) === String(req.usuario._id);
  const esPropietario = String(intercambio.propietario) === String(req.usuario._id);

  if (!esSolicitante && !esPropietario) {
    return res.status(403).json({ mensaje: 'No participas en este intercambio.' });
  }

  if (!TRANSICIONES[estado].includes(intercambio.estado)) {
    return res.status(400).json({
      mensaje: `No se puede pasar de "${intercambio.estado}" a "${estado}".`,
    });
  }

  if ((estado === 'aceptado' || estado === 'rechazado') && !esPropietario) {
    return res.status(403).json({
      mensaje: 'Solo el propietario del artículo puede aceptar o rechazar la propuesta.',
    });
  }

  intercambio.estado = estado;
  await intercambio.save();

  if (estado === 'completado') {
    await Promise.all([
      Usuario.updateOne({ _id: intercambio.solicitante }, { $inc: { 'stats.intercambios': 1 } }),
      Usuario.updateOne({ _id: intercambio.propietario }, { $inc: { 'stats.intercambios': 1 } }),
    ]);
  }

  const destinatario = esSolicitante ? intercambio.propietario : intercambio.solicitante;
  const etiquetas = {
    aceptado: 'aceptó',
    rechazado: 'rechazó',
    cancelado: 'canceló',
    completado: 'completó',
  };

  await Notificacion.create({
    usuario: destinatario,
    tipo: 'intercambio',
    mensaje: `${req.usuario.nombre} ${etiquetas[estado]} un intercambio.`,
    enlace: '/perfil/intercambios',
  });

  const completo = await populado(Intercambio.findById(intercambio._id));

  return res.status(200).json({ intercambio: serializarIntercambio(completo) });
}
