import { CATEGORIAS } from '../utils/constants.js';

export function listarCategorias(req, res) {
  res.status(200).json({ categorias: CATEGORIAS });
}
