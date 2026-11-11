import 'dotenv/config';

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const variablesRequeridas = ['MONGODB_URI', 'JWT_SECRET'];
const variablesFaltantes = variablesRequeridas.filter((clave) => !process.env[clave]);

if (variablesFaltantes.length > 0) {
  console.error(`[Config] Faltan variables de entorno: ${variablesFaltantes.join(', ')}`);
  process.exit(1);
}

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[Server] Truex Trade backend listening on http://localhost:${PORT}`);
    console.log(`[Environment] Node: ${process.version} | Mode: ${process.env.NODE_ENV || 'development'}`);
  });

  const gracefulShutdown = (signal) => {
    console.log(`\n[Server] Received ${signal}. Closing HTTP server and database connection...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer();
