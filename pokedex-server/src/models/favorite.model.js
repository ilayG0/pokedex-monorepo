const { Schema, model } = require('mongoose');

const favoriteSchema = new Schema(
  {
    userId: {
      type: String,      
      required: true,
      index: true,
    },
    pokemon: {
      type: Schema.Types.ObjectId,
      ref: 'Pokemon',    
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

favoriteSchema.index({ userId: 1, pokemon: 1 }, { unique: true });

module.exports = model('Favorite', favoriteSchema);
