import { Router } from 'express';
import {
  actualizarPerfil,
  obtenerUsuarioPublico,
} from '../controllers/users.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const router = Router();

router.patch('/me', autenticar, actualizarPerfil);
router.get('/:id', obtenerUsuarioPublico);

export default router;
