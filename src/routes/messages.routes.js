import { Router } from 'express';
import {
  enviarMensaje,
  listarConversaciones,
  listarMensajesCon,
} from '../controllers/messages.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar);

router.get('/', listarConversaciones);
router.get('/:usuarioId', listarMensajesCon);
router.post('/:usuarioId', enviarMensaje);

export default router;
