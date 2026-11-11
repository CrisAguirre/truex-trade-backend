import mongoose from 'mongoose';

const mensajeSchema = new mongoose.Schema(
  {
    emisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    receptor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    contenido: {
      type: String,
      required: [true, 'El mensaje no puede estar vacío.'],
      trim: true,
      maxlength: [1000, 'El mensaje no puede superar los 1000 caracteres.'],
    },
    articuloRelacionado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
    },
    leido: {
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

mensajeSchema.index({ emisor: 1, receptor: 1, createdAt: -1 });

export default mongoose.model('Mensaje', mensajeSchema);
