import mongoose from 'mongoose';

export function esIdValido(id) {
  return mongoose.isValidObjectId(id);
}

export function escaparRegex(texto = '') {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function aNumero(valor, porDefecto) {
  const numero = Number.parseInt(valor, 10);
  return Number.isFinite(numero) ? numero : porDefecto;
}

export function paginacion(query, { limitePorDefecto = 12, limiteMaximo = 50 } = {}) {
  const pagina = Math.max(1, aNumero(query.pagina, 1));
  const limite = Math.min(limiteMaximo, Math.max(1, aNumero(query.limite, limitePorDefecto)));
  return { pagina, limite, saltar: (pagina - 1) * limite };
}

export function serializarUsuarioPublico(usuario) {
  if (!usuario) return null;

  return {
    id: String(usuario._id ?? usuario.id ?? ''),
    nombre: usuario.nombre ?? '',
    username: usuario.username ?? '',
    avatar: usuario.avatar ?? '',
    verificado: Boolean(usuario.verificado),
    ubicacion: usuario.ubicacion ?? '',
    rol: usuario.rol ?? 'usuario',
    stats: {
      publicaciones: usuario.stats?.publicaciones ?? 0,
      intercambios: usuario.stats?.intercambios ?? 0,
      calificacion: usuario.stats?.calificacion ?? 0,
    },
    createdAt: usuario.createdAt ?? null,
  };
}

export function serializarUsuarioAdmin(usuario) {
  const base = serializarUsuarioPublico(usuario);
  if (!base) return null;
  return {
    ...base,
    email: usuario.email ?? '',
    updatedAt: usuario.updatedAt ?? null,
  };
}

function idDe(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') return valor;
  return String(valor._id ?? valor.id ?? '');
}

export function serializarItem(item, usuarioId = null) {
  if (!item) return null;

  const favoritos = Array.isArray(item.favoritos) ? item.favoritos : [];
  const usuario = item.usuario;

  const usuarioPublico =
    usuario && (usuario.nombre || usuario.username)
      ? {
          id: idDe(usuario),
          nombre: usuario.nombre ?? '',
          username: usuario.username ?? '',
          avatar: usuario.avatar ?? '',
          verificado: Boolean(usuario.verificado),
        }
      : { id: idDe(usuario), nombre: '', username: '', avatar: '', verificado: false };

  const esFavorito = Boolean(
    usuarioId &&
      favoritos.some((favoritoId) => String(favoritoId) === String(usuarioId))
  );

  return {
    id: String(item._id ?? item.id ?? ''),
    titulo: item.titulo ?? '',
    descripcion: item.descripcion ?? '',
    categoria: item.categoria ?? '',
    estado: item.estado ?? '',
    tipo: item.tipo ?? 'trueque',
    imagenes: Array.isArray(item.imagenes) ? item.imagenes : [],
    ubicacion: item.ubicacion ?? '',
    usuario: usuarioPublico,
    favoritos: favoritos.length,
    esFavorito,
    activo: item.activo !== false,
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
  };
}

export function serializarIntercambio(intercambio) {
  if (!intercambio) return null;

  return {
    id: String(intercambio._id),
    estado: intercambio.estado,
    mensaje: intercambio.mensaje ?? '',
    articulo: serializarItem(intercambio.articulo),
    articuloOfrecido: intercambio.articuloOfrecido
      ? serializarItem(intercambio.articuloOfrecido)
      : null,
    solicitante: serializarUsuarioPublico(intercambio.solicitante),
    propietario: serializarUsuarioPublico(intercambio.propietario),
    createdAt: intercambio.createdAt,
    updatedAt: intercambio.updatedAt,
  };
}

export function serializarMensaje(mensaje) {
  if (!mensaje) return null;

  return {
    id: String(mensaje._id),
    emisor: idDe(mensaje.emisor),
    receptor: idDe(mensaje.receptor),
    contenido: mensaje.contenido,
    articuloRelacionado: idDe(mensaje.articuloRelacionado),
    leido: Boolean(mensaje.leido),
    createdAt: mensaje.createdAt,
  };
}

export function serializarNotificacion(notificacion) {
  if (!notificacion) return null;

  return {
    id: String(notificacion._id),
    tipo: notificacion.tipo,
    mensaje: notificacion.mensaje,
    enlace: notificacion.enlace ?? '',
    leida: Boolean(notificacion.leida),
    createdAt: notificacion.createdAt,
  };
}
