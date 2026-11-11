import Item from '../models/Item.js';
import { ESTADOS_ITEM, TIPOS_ITEM } from '../utils/constants.js';
import {
  escaparRegex,
  esIdValido,
  paginacion,
  serializarItem,
} from '../utils/serializers.js';

const CAMPOS_USUARIO = 'nombre username avatar verificado';

function normalizarImagenes(imagenes) {
  if (imagenes === undefined) return undefined;
  if (imagenes === null || imagenes === '') return [];
  if (typeof imagenes === 'string') return [imagenes];
  if (!Array.isArray(imagenes)) return null;
  return imagenes.filter((imagen) => typeof imagen === 'string' && imagen.trim() !== '');
}

function validarItem(datos = {}, { parcial = false } = {}) {
  const errores = {};
  const tiene = (campo) => datos[campo] !== undefined;

  const titulo = typeof datos.titulo === 'string' ? datos.titulo.trim() : '';
  if (!parcial || tiene('titulo')) {
    if (titulo.length < 3 || titulo.length > 80) {
      errores.titulo = 'El título debe tener entre 3 y 80 caracteres.';
    }
  }

  const descripcion = typeof datos.descripcion === 'string' ? datos.descripcion.trim() : '';
  if (!parcial || tiene('descripcion')) {
    if (descripcion.length < 10 || descripcion.length > 600) {
      errores.descripcion = 'La descripción debe tener entre 10 y 600 caracteres.';
    }
  }

  const categoria = typeof datos.categoria === 'string' ? datos.categoria.trim() : '';
  if (!parcial || tiene('categoria')) {
    if (categoria.length < 2 || categoria.length > 40) {
      errores.categoria = 'Selecciona una categoría válida.';
    }
  }

  if (!parcial || tiene('estado')) {
    if (datos.estado && !ESTADOS_ITEM.includes(datos.estado)) {
      errores.estado = 'Selecciona un estado válido para el artículo.';
    }
  }

  if (!parcial || tiene('tipo')) {
    if (datos.tipo && !TIPOS_ITEM.includes(datos.tipo)) {
      errores.tipo = 'El tipo debe ser trueque, venta o ambos.';
    }
  }

  const ubicacion = typeof datos.ubicacion === 'string' ? datos.ubicacion.trim() : '';
  if (!parcial || tiene('ubicacion')) {
    if (ubicacion.length < 2 || ubicacion.length > 80) {
      errores.ubicacion = 'Indica tu ciudad o región.';
    }
  }

  if (tiene('imagenes')) {
    const imagenes = normalizarImagenes(datos.imagenes);
    if (imagenes === null) {
      errores.imagenes = 'Las imágenes deben enviarse como una lista de textos.';
    } else if (imagenes.length > 4) {
      errores.imagenes = 'Puedes subir hasta 4 imágenes.';
    }
  }

  return errores;
}

function construirFiltros(query = {}) {
  const filtros = { activo: true };

  if (query.buscar) {
    const patron = new RegExp(escaparRegex(query.buscar.trim()), 'i');
    filtros.$or = [{ titulo: patron }, { descripcion: patron }];
  }

  if (query.categoria) {
    filtros.categoria = new RegExp(`^${escaparRegex(query.categoria.trim())}$`, 'i');
  }

  if (query.tipo) {
    filtros.tipo = query.tipo;
  }

  if (query.ubicacion) {
    filtros.ubicacion = new RegExp(escaparRegex(query.ubicacion.trim()), 'i');
  }

  if (query.usuario && esIdValido(query.usuario)) {
    filtros.usuario = query.usuario;
  }

  return filtros;
}

async function itemPopulado(id) {
  return Item.findById(id).populate('usuario', CAMPOS_USUARIO);
}

export async function listarItems(req, res) {
  const { pagina, limite, saltar } = paginacion(req.query);
  const filtros = construirFiltros(req.query);
  const orden = req.query.orden === 'antiguos' ? 1 : -1;

  const [items, total] = await Promise.all([
    Item.find(filtros)
      .sort({ createdAt: orden })
      .skip(saltar)
      .limit(limite)
      .populate('usuario', CAMPOS_USUARIO),
    Item.countDocuments(filtros),
  ]);

  res.status(200).json({
    items: items.map((item) => serializarItem(item, req.usuario?._id)),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / limite)),
  });
}

export async function obtenerItem(req, res) {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ mensaje: 'El identificador del artículo no es válido.' });
  }

  const item = await itemPopulado(req.params.id);

  if (!item || !item.activo) {
    return res.status(404).json({ mensaje: 'Artículo no encontrado.' });
  }

  return res.status(200).json({ item: serializarItem(item, req.usuario?._id) });
}

export async function crearItem(req, res) {
  const errores = validarItem(req.body ?? {});

  if (Object.keys(errores).length > 0) {
    return res.status(400).json({
      mensaje: 'Revisa los datos del artículo.',
      errores,
    });
  }

  const imagenes = normalizarImagenes(req.body.imagenes) ?? [];

  const item = await Item.create({
    titulo: req.body.titulo.trim(),
    descripcion: req.body.descripcion.trim(),
    categoria: req.body.categoria.trim(),
    estado: req.body.estado || 'Buen estado',
    tipo: req.body.tipo || 'trueque',
    imagenes,
    ubicacion: req.body.ubicacion.trim(),
    usuario: req.usuario._id,
  });

  await item.populate('usuario', CAMPOS_USUARIO);

  return res.status(201).json({ item: serializarItem(item, req.usuario._id) });
}

export async function actualizarItem(req, res) {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ mensaje: 'El identificador del artículo no es válido.' });
  }

  const datos = req.body ?? {};
  const item = await Item.findOne({ _id: req.params.id, activo: true });

  if (!item) {
    return res.status(404).json({ mensaje: 'Artículo no encontrado.' });
  }

  const esPropietario = String(item.usuario) === String(req.usuario._id);
  if (!esPropietario && req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'No puedes editar este artículo.' });
  }

  const errores = validarItem(datos, { parcial: true });

  if (Object.keys(errores).length > 0) {
    return res.status(400).json({
      mensaje: 'Revisa los datos del artículo.',
      errores,
    });
  }

  const campos = ['titulo', 'descripcion', 'categoria', 'estado', 'tipo', 'ubicacion'];
  campos.forEach((campo) => {
    if (datos[campo] !== undefined) {
      item[campo] = typeof datos[campo] === 'string' ? datos[campo].trim() : datos[campo];
    }
  });

  if (datos.imagenes !== undefined) {
    item.imagenes = normalizarImagenes(datos.imagenes) ?? [];
  }

  await item.save();
  await item.populate('usuario', CAMPOS_USUARIO);

  return res.status(200).json({ item: serializarItem(item, req.usuario._id) });
}

export async function eliminarItem(req, res) {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ mensaje: 'El identificador del artículo no es válido.' });
  }

  const item = await Item.findOne({ _id: req.params.id, activo: true });

  if (!item) {
    return res.status(404).json({ mensaje: 'Artículo no encontrado.' });
  }

  const esPropietario = String(item.usuario) === String(req.usuario._id);
  if (!esPropietario && req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'No puedes eliminar este artículo.' });
  }

  item.activo = false;
  await item.save();

  return res.status(200).json({ mensaje: 'Artículo eliminado.', id: String(item._id) });
}

export async function itemsDeUsuario(req, res) {
  const { userId } = req.params;

  if (!esIdValido(userId)) {
    return res.status(400).json({ mensaje: 'El identificador del usuario no es válido.' });
  }

  const items = await Item.find({ usuario: userId, activo: true })
    .sort({ createdAt: -1 })
    .populate('usuario', CAMPOS_USUARIO);

  return res.status(200).json({
    items: items.map((item) => serializarItem(item, req.usuario?._id)),
    total: items.length,
  });
}

export async function alternarFavorito(req, res) {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ mensaje: 'El identificador del artículo no es válido.' });
  }

  const item = await Item.findOne({ _id: req.params.id, activo: true });

  if (!item) {
    return res.status(404).json({ mensaje: 'Artículo no encontrado.' });
  }

  const usuarioId = req.usuario._id;
  const yaEsFavorito = item.favoritos.some(
    (favoritoId) => String(favoritoId) === String(usuarioId)
  );

  if (yaEsFavorito) {
    item.favoritos.pull(usuarioId);
  } else {
    item.favoritos.addToSet(usuarioId);
  }

  await item.save();

  return res.status(200).json({
    favorito: !yaEsFavorito,
    favoritos: item.favoritos.length,
    mensaje: yaEsFavorito
      ? 'Artículo quitado de favoritos.'
      : 'Artículo agregado a favoritos.',
  });
}

export async function listarFavoritos(req, res) {
  const { pagina, limite, saltar } = paginacion(req.query, { limitePorDefecto: 12 });

  const filtros = { favoritos: req.usuario._id, activo: true };

  const [items, total] = await Promise.all([
    Item.find(filtros)
      .sort({ createdAt: -1 })
      .skip(saltar)
      .limit(limite)
      .populate('usuario', CAMPOS_USUARIO),
    Item.countDocuments(filtros),
  ]);

  return res.status(200).json({
    items: items.map((item) => serializarItem(item, req.usuario._id)),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / limite)),
  });
}
