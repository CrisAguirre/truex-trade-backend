import mongoose from 'mongoose';
import { ESTADOS_INTERCAMBIO } from '../utils/constants.js';

const intercambioSchema = new mongoose.Schema(
  {
    articulo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    articuloOfrecido: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
    },
    solicitante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    propietario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    mensaje: {
      type: String,
      trim: true,
      maxlength: [500, 'El mensaje no puede superar los 500 caracteres.'],
      default: '',
    },
    estado: {
      type: String,
      enum: {
        values: ESTADOS_INTERCAMBIO,
        message: 'El estado del intercambio no es válido.',
      },
      default: 'pendiente',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

intercambioSchema.index({ solicitante: 1, createdAt: -1 });
intercambioSchema.index({ propietario: 1, createdAt: -1 });

export default mongoose.model('Intercambio', intercambioSchema);
