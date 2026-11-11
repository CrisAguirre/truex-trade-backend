import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Usuario from '../models/Usuario.js';

const USERNAME_REGEX = /^[a-z0-9._]{3,20}$/;

function leerConfiguracion() {
  return {
    nombre: (process.env.ADMIN_NOMBRE || 'Administrador TrueX').trim(),
    username: (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase(),
    email: (process.env.ADMIN_EMAIL || 'admin@truex.app').trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'Admin1234',
    ubicacion: (process.env.ADMIN_UBICACION || 'Pasto, Nariño').trim(),
  };
}

function validar({ nombre, username, email, password, ubicacion }) {
  const errores = [];

  if (nombre.length < 2 || nombre.length > 60) {
    errores.push('ADMIN_NOMBRE debe tener entre 2 y 60 caracteres.');
  }

  if (!USERNAME_REGEX.test(username)) {
    errores.push('ADMIN_USERNAME debe tener de 3 a 20 caracteres: letras, números, punto o guion bajo.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errores.push('ADMIN_EMAIL no es un correo válido.');
  }

  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    errores.push('ADMIN_PASSWORD debe tener mínimo 8 caracteres con al menos una letra y un número.');
  }

  if (ubicacion.length < 2) {
    errores.push('ADMIN_UBICACION debe indicar una ciudad o región.');
  }

  return errores;
}

async function main() {
  const configuracion = leerConfiguracion();
  const errores = validar(configuracion);

  if (errores.length > 0) {
    errores.forEach((error) => console.error(`[Seed] ${error}`));
    process.exitCode = 1;
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error('[Seed] Falta MONGODB_URI en el archivo .env.');
    process.exitCode = 1;
    return;
  }

  await connectDB();

  try {
    await Usuario.updateMany({ rol: { $exists: false } }, { $set: { rol: 'usuario' } });

    let usuario = await Usuario.findOne({ email: configuracion.email }).select('+password');

    if (usuario) {
      usuario.nombre = configuracion.nombre;
      usuario.username = configuracion.username;
      usuario.ubicacion = configuracion.ubicacion;
      usuario.rol = 'admin';
      usuario.verificado = true;
      usuario.password = configuracion.password;
      await usuario.save();
      console.log(`[Seed] Administrador actualizado: ${usuario.email}`);
    } else {
      usuario = await Usuario.create({
        ...configuracion,
        rol: 'admin',
        verificado: true,
      });
      console.log(`[Seed] Administrador creado: ${usuario.email}`);
    }

    console.log('[Seed] Credenciales de acceso:');
    console.log(`       Email:    ${configuracion.email}`);
    console.log(`       Password: ${configuracion.password}`);
  } catch (error) {
    if (error.code === 11000) {
      const campo = Object.keys(error.keyValue ?? {})[0] || 'campo único';
      console.error(`[Seed] Ya existe otro usuario con ese ${campo}.`);
    } else {
      console.error('[Seed] Error al crear el administrador:', error.message);
    }
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
