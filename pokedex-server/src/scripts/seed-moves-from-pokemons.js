// src/scripts/seed-moves-from-pokemons.js

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const { Schema } = mongoose;

// =======================
// SCHEMAS + MODELS
// =======================

// Minimal Pokemon schema – only what we need (moves)
// It reads from the existing "pokemons" collection created by seed-pokemon.js
const PokemonMoveSchema = new Schema(
  {
    name: { type: String, required: true, lowercase: true, trim: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const PokemonSchema = new Schema(
  {
    pokedexId: { type: Number, required: true, unique: true },
    moves: { type: [PokemonMoveSchema], default: [] },
  },
  {
    collection: 'pokemons',
  }
);

const Pokemon = mongoose.model('Pokemon', PokemonSchema);

// Move schema – full details for battles
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
      type: String, // "fire", "water", etc.
      lowercase: true,
      trim: true,
    },
    power: Number, // can be null in PokeAPI
    accuracy: Number, // can be null in PokeAPI
    pp: Number,
    damage_class: {
      type: String, // "physical" | "special" | "status"
      lowercase: true,
      trim: true,
    },
    priority: Number,
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

const Move = mongoose.model('Move', MoveSchema);

// =======================
// HELPERS
// =======================

/**
 * Clean effect text (has \n, \f, etc.)
 */
function cleanText(text) {
  if (!text) return '';
  return text.replace(/[\n\f]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Fetch /move/{name} from PokeAPI
 */
async function fetchMoveFromPokeAPI(moveName) {
  const baseUrl = 'https://pokeapi.co/api/v2/move';
  const res = await axios.get(`${baseUrl}/${moveName.toLowerCase()}`);
  const data = res.data;

  // pick first English effect entry if exists
  let shortEffect = '';
  if (Array.isArray(data.effect_entries)) {
    const entry = data.effect_entries.find(
      (e) => e.language && e.language.name === 'en'
    );
    if (entry && entry.short_effect) {
      shortEffect = cleanText(entry.short_effect);
    }
  }

  return {
    name: data.name,
    type: data.type?.name || null,
    power: data.power, // can be null
    accuracy: data.accuracy, // can be null
    pp: data.pp,
    damage_class: data.damage_class?.name || null,
    priority: data.priority,
    short_effect: shortEffect,
  };
}

/**
 * Upsert (insert or update) a move in MongoDB
 */
async function upsertMove(moveObj) {
  await Move.findOneAndUpdate(
    { name: moveObj.name },
    { $set: moveObj },
    { upsert: true, new: true }
  );
}

/**
 * Get unique move names from all pokemons in DB
 */
async function getAllUniqueMoveNames() {
  const pokemons = await Pokemon.find({}, { moves: 1, _id: 0 }).lean();

  const nameSet = new Set();

  for (const p of pokemons) {
    if (!Array.isArray(p.moves)) continue;
    for (const m of p.moves) {
      if (m && m.name) {
        nameSet.add(m.name.toLowerCase());
      }
    }
  }

  return Array.from(nameSet);
}

/**
 * Seed moves: for all unique move names in pokemons collection,
 * fetch their details from PokeAPI and upsert to MongoDB.
 */
async function seedMovesFromPokemons() {
  const moveNames = await getAllUniqueMoveNames();
  console.log(`Found ${moveNames.length} unique moves`);

  const baseDelayMs = 200; 

  for (let i = 0; i < moveNames.length; i++) {
    const name = moveNames[i];
    try {
      console.log(`(${i + 1}/${moveNames.length}) Fetching move: ${name}`);
      const moveData = await fetchMoveFromPokeAPI(name);
      await upsertMove(moveData);
      console.log(`Saved move: ${name}`);
    } catch (err) {
      console.error(`Failed to fetch/save move "${name}":`, err.message);
    }

    await new Promise((res) => setTimeout(res, baseDelayMs));
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    await seedMovesFromPokemons();

    console.log('Done seeding moves');
  } catch (err) {
    console.error('Error seeding moves:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}


if (require.main === module) {
  main();
}
