import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const statsSchema = new mongoose.Schema(
  {
    publicaciones: { type: Number, default: 0, min: 0 },
    intercambios: { type: Number, default: 0, min: 0 },
    calificacion: { type: Number, default: 0, min: 0, max: 5 },
  },
  { _id: false }
);

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio.'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres.'],
      maxlength: [60, 'El nombre no puede superar los 60 caracteres.'],
    },
    username: {
      type: String,
      required: [true, 'El nombre de usuario es obligatorio.'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9._]{3,20}$/,
        'El usuario debe tener de 3 a 20 caracteres: letras, números, punto o guion bajo.',
      ],
    },
    email: {
      type: String,
      required: [true, 'El correo es obligatorio.'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Ingresa un correo válido.'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria.'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres.'],
      select: false,
    },
    avatar: { type: String, default: '' },
    rol: {
      type: String,
      enum: {
        values: ['usuario', 'admin'],
        message: 'El rol debe ser usuario o admin.',
      },
      default: 'usuario',
      index: true,
    },
    verificado: { type: Boolean, default: false },
    ubicacion: {
      type: String,
      trim: true,
      default: '',
      maxlength: [80, 'La ubicación no puede superar los 80 caracteres.'],
    },
    stats: { type: statsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

usuarioSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 10);
});

usuarioSchema.methods.compararClave = function compararClave(clave) {
  return bcrypt.compare(clave, this.password);
};

usuarioSchema.methods.toPublico = function toPublico() {
  return {
    id: this._id.toString(),
    nombre: this.nombre,
    username: this.username,
    email: this.email,
    avatar: this.avatar,
    rol: this.rol ?? 'usuario',
    verificado: this.verificado,
    ubicacion: this.ubicacion,
    stats: {
      publicaciones: this.stats?.publicaciones ?? 0,
      intercambios: this.stats?.intercambios ?? 0,
      calificacion: this.stats?.calificacion ?? 0,
    },
  };
};

export default mongoose.model('Usuario', usuarioSchema);
