import Intercambio from '../models/Intercambio.js';
import Item from '../models/Item.js';
import Usuario from '../models/Usuario.js';

export async function obtenerEstadisticas(req, res) {
  const [usuarios, publicaciones, intercambios, calificacion] = await Promise.all([
    Usuario.countDocuments(),
    Item.countDocuments({ activo: true }),
    Intercambio.countDocuments(),
    Usuario.aggregate([
      { $match: { 'stats.calificacion': { $gt: 0 } } },
      { $group: { _id: null, promedio: { $avg: '$stats.calificacion' } } },
    ]),
  ]);

  res.status(200).json({
    usuarios,
    publicaciones,
    intercambios,
    calificacionPromedio: Number((calificacion[0]?.promedio ?? 0).toFixed(1)),
    timestamp: new Date().toISOString(),
  });
}
