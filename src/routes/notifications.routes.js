import { Router } from 'express';
import {
  eliminarNotificacion,
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from '../controllers/notifications.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar);

router.get('/', listarNotificaciones);
router.patch('/leer-todas', marcarTodasLeidas);
router.patch('/:id/leer', marcarNotificacionLeida);
router.delete('/:id', eliminarNotificacion);

export default router;
