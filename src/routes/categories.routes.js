import { Router } from 'express';
import { listarCategorias } from '../controllers/categories.controller.js';

const router = Router();

router.get('/', listarCategorias);

export default router;
