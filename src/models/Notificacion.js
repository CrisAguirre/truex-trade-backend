import mongoose from 'mongoose';

const notificacionSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    tipo: {
      type: String,
      enum: {
        values: ['mensaje', 'intercambio', 'favorito', 'sistema'],
        message: 'El tipo de notificación no es válido.',
      },
      default: 'sistema',
    },
    mensaje: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'La notificación no puede superar los 200 caracteres.'],
    },
    enlace: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'El enlace no puede superar los 300 caracteres.'],
    },
    leida: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificacionSchema.index({ usuario: 1, createdAt: -1 });

export default mongoose.model('Notificacion', notificacionSchema);
