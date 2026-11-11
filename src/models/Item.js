import mongoose from 'mongoose';
import { ESTADOS_ITEM, TIPOS_ITEM } from '../utils/constants.js';

const MAX_IMAGENES = 4;

const itemSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio.'],
      trim: true,
      minlength: [3, 'El título debe tener al menos 3 caracteres.'],
      maxlength: [80, 'El título no puede superar los 80 caracteres.'],
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria.'],
      trim: true,
      minlength: [10, 'La descripción debe tener al menos 10 caracteres.'],
      maxlength: [600, 'La descripción no puede superar los 600 caracteres.'],
    },
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria.'],
      trim: true,
      maxlength: [40, 'La categoría no puede superar los 40 caracteres.'],
    },
    estado: {
      type: String,
      enum: {
        values: ESTADOS_ITEM,
        message: 'Selecciona un estado válido para el artículo.',
      },
      default: 'Buen estado',
    },
    tipo: {
      type: String,
      enum: {
        values: TIPOS_ITEM,
        message: 'El tipo debe ser trueque, venta o ambos.',
      },
      default: 'trueque',
    },
    imagenes: {
      type: [String],
      default: [],
      validate: {
        validator: (imagenes) => imagenes.length <= MAX_IMAGENES,
        message: `Puedes subir hasta ${MAX_IMAGENES} imágenes.`,
      },
    },
    ubicacion: {
      type: String,
      required: [true, 'La ubicación es obligatoria.'],
      trim: true,
      minlength: [2, 'Indica tu ciudad o región.'],
      maxlength: [80, 'La ubicación no puede superar los 80 caracteres.'],
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    favoritos: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
      default: [],
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

itemSchema.index({ titulo: 'text', descripcion: 'text' });
itemSchema.index({ categoria: 1, createdAt: -1 });

export default mongoose.model('Item', itemSchema);
