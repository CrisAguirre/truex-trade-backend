import { Router } from 'express';
import {
  actualizarItem,
  alternarFavorito,
  crearItem,
  eliminarItem,
  itemsDeUsuario,
  listarFavoritos,
  listarItems,
  obtenerItem,
} from '../controllers/items.controller.js';
import { autenticar, autenticarOpcional } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', autenticarOpcional, listarItems);
router.get('/favoritos', autenticar, listarFavoritos);
router.get('/user/:userId', autenticarOpcional, itemsDeUsuario);
router.get('/:id', autenticarOpcional, obtenerItem);
router.post('/', autenticar, crearItem);
router.put('/:id', autenticar, actualizarItem);
router.delete('/:id', autenticar, eliminarItem);
router.post('/:id/favorite', autenticar, alternarFavorito);

export default router;
