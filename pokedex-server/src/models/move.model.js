
const MoveSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String, 
      required: false,
      lowercase: true,
      trim: true,
    },
    power: {
      type: Number, 
    },
    accuracy: {
      type: Number,
    },
    pp: {
      type: Number,
    },
    damage_class: {
      type: String,
      lowercase: true,
      trim: true,
    },
    priority: {
      type: Number,
    },
    short_effect: {
      type: String,
      default: '',
    },
  },
  {
    collection: 'moves',
    timestamps: true,
  }
);

const Move = model('Move', MoveSchema);
