const mongoose = require("mongoose");
const { Schema } = mongoose;

const PokemonSpritesSchema = new Schema(
  {
    front_default: { type: String },
    front_shiny: { type: String },
    official_artwork: { type: String },
  },
  { _id: false }
);

const PokemonTypeSchema = new Schema(
  {
    name: { type: String, required: true },
  },
  { _id: false }
);

const PokemonAbilitySchema = new Schema(
  {
    name: { type: String, required: true },
    is_hidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const PokemonStatSchema = new Schema(
  {
    name: { type: String, required: true },
    base_stat: { type: Number, required: true },
  },
  { _id: false }
);

const PokemonMoveSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const PokemonSchema = new Schema(
  {
    pokedexId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    sprites: {
      type: PokemonSpritesSchema,
      default: {},
    },
    height: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    types: {
      type: [PokemonTypeSchema],
      default: [],
    },
    abilities: {
      type: [PokemonAbilitySchema],
      default: [],
    },
    stats: {
      type: [PokemonStatSchema],
      default: [],
    },
    moves: {
      type: [PokemonMoveSchema],
      default: [],
    },
    isFavorit: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      index: true,
      lowercase: true,
      trim: true,
    },
    eggGroups: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    collection: "pokemons",
    timestamps: true,
  }
);

const Pokemon = mongoose.model("Pokemon", PokemonSchema);

module.exports = Pokemon;
