export const CATEGORIAS = [
  { id: 'tecnologia', nombre: 'Tecnología', icono: '📱' },
  { id: 'videojuegos', nombre: 'Videojuegos', icono: '🎮' },
  { id: 'ropa', nombre: 'Ropa y Calzado', icono: '👕' },
  { id: 'deportes', nombre: 'Deportes', icono: '⚽' },
  { id: 'hogar', nombre: 'Hogar', icono: '🏠' },
  { id: 'vehiculos', nombre: 'Vehículos', icono: '🚗' },
  { id: 'libros', nombre: 'Libros', icono: '📚' },
  { id: 'instrumentos', nombre: 'Instrumentos', icono: '🎸' },
  { id: 'juguetes', nombre: 'Juguetes', icono: '🧸' },
  { id: 'coleccionables', nombre: 'Coleccionables', icono: '🪆' },
  { id: 'musica', nombre: 'Música', icono: '🎵' },
  { id: 'moda', nombre: 'Moda', icono: '👗' },
  { id: 'otros', nombre: 'Otros', icono: '⋯' },
];

export const NOMBRES_CATEGORIAS = CATEGORIAS.map((categoria) => categoria.nombre);

export const ESTADOS_ITEM = ['Nuevo', 'Excelente estado', 'Buen estado', 'Con detalles'];

export const TIPOS_ITEM = ['trueque', 'venta', 'ambos'];

export const ROLES = ['usuario', 'admin'];

export const ESTADOS_INTERCAMBIO = [
  'pendiente',
  'aceptado',
  'rechazado',
  'cancelado',
  'completado',
];
