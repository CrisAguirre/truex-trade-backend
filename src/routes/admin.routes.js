import { Router } from 'express';
import {
  cambiarRol,
  eliminarUsuario,
  estadisticasAdmin,
  listarUsuarios,
} from '../controllers/admin.controller.js';
import { autenticar, soloAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(autenticar, soloAdmin);

router.get('/usuarios', listarUsuarios);
router.patch('/usuarios/:id/rol', cambiarRol);
router.delete('/usuarios/:id', eliminarUsuario);
router.get('/estadisticas', estadisticasAdmin);

export default router;
