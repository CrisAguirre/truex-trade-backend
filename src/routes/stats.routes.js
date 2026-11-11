import { Router } from 'express';
import { obtenerEstadisticas } from '../controllers/stats.controller.js';

const router = Router();

router.get('/', obtenerEstadisticas);

export default router;
