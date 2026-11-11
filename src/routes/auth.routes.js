import { Router } from 'express';
import { login, perfil, registrar } from '../controllers/auth.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', registrar);
router.post('/login', login);
router.get('/me', autenticar, perfil);

export default router;
