import { Router } from 'express';
import {
  actualizarEstadoIntercambio,
  crearIntercambio,
  listarIntercambios,
} from '../controllers/intercambios.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar);

router.get('/', listarIntercambios);
router.post('/', crearIntercambio);
router.patch('/:id/estado', actualizarEstadoIntercambio);

export default router;
