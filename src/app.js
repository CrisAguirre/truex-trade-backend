import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import itemsRoutes from './routes/items.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import usersRoutes from './routes/users.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import statsRoutes from './routes/stats.routes.js';
import intercambiosRoutes from './routes/intercambios.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// Allowed origins configuration (FRONTEND_URL admite varios separados por coma)
const origenesLocales = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
];

function obtenerOrigenesPermitidos() {
  const configurados = [process.env.FRONTEND_URLS, process.env.FRONTEND_URL]
    .filter(Boolean)
    .join(',')
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (configurados.length === 0) {
    configurados.push('https://truextrade.vercel.app');
  }

  return new Set([...configurados, ...origenesLocales]);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);

      const limpio = origin.replace(/\/+$/, '');
      if (obtenerOrigenesPermitidos().has(limpio)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Origen no permitido: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true, limit: '16mb' }));

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Truex Trade API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API health endpoint
const ESTADOS_DB = ['disconnected', 'connected', 'connecting', 'disconnecting'];

app.get('/api/health', (req, res) => {
  const estadoDb = ESTADOS_DB[mongoose.connection.readyState] ?? 'unknown';

  res.status(200).json({
    status: 'OK',
    database: estadoDb,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Application routes
app.use('/api/items', itemsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/intercambios', intercambiosRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    mensaje: `No existe la ruta ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload Too Large',
      mensaje: 'El contenido enviado es demasiado grande.',
    });
  }

  if (err.name === 'ValidationError') {
    const errores = Object.fromEntries(
      Object.entries(err.errors ?? {}).map(([campo, detalle]) => [campo, detalle.message])
    );

    return res.status(400).json({
      error: 'Validation Error',
      mensaje: 'Revisa los datos enviados.',
      errores,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid Identifier',
      mensaje: 'El identificador enviado no es válido.',
    });
  }

  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue ?? {})[0];
    return res.status(409).json({
      error: 'Duplicate Key',
      mensaje: campo === 'email'
        ? 'Ya existe una cuenta con este correo.'
        : 'Ese nombre de usuario ya está en uso.',
      errores: campo ? { [campo]: 'Este valor ya está registrado.' } : undefined,
    });
  }

  console.error('[Server Error]:', err.stack || err.message);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    mensaje: err.message || 'Ocurrió un error inesperado en el servidor.',
  });
});

export default app;
