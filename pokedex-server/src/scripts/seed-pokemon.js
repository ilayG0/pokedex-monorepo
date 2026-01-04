
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

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
      default: '',
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
    collection: 'pokemons',
    timestamps: true,
  }
);

const Pokemon = mongoose.model('Pokemon', PokemonSchema);

function cleanFlavorText(text) {
  if (!text) return '';
  return text.replace(/[\n\f]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function getEnglishDescription(speciesData) {
  if (!speciesData || !Array.isArray(speciesData.flavor_text_entries)) {
    return '';
  }

  const entry = speciesData.flavor_text_entries.find(
    (e) => e.language && e.language.name === 'en'
  );

  return entry ? cleanFlavorText(entry.flavor_text) : '';
}

function mapPokemonData(pokemonData, speciesData) {
  const pokedexId = pokemonData.id;
  const name = pokemonData.name;

  const sprites = {
    front_default: pokemonData.sprites?.front_default || '',
    front_shiny: pokemonData.sprites?.front_shiny || '',
    official_artwork:
      pokemonData.sprites?.other?.['official-artwork']?.front_default || '',
  };

  const types =
    pokemonData.types?.map((t) => ({
      name: t.type.name,
    })) || [];

  const abilities =
    pokemonData.abilities?.map((a) => ({
      name: a.ability.name,
      is_hidden: !!a.is_hidden,
    })) || [];

  const stats =
    pokemonData.stats?.map((s) => ({
      name: s.stat.name,
      base_stat: s.base_stat,
    })) || [];

  const moves =
    pokemonData.moves?.map((m) => ({
      name: m.move.name,
      url: m.move.url,
    })) || [];

  const description = getEnglishDescription(speciesData);

  const color = speciesData?.color?.name || null;
  const eggGroups =
    speciesData?.egg_groups?.map((g) => g.name).filter(Boolean) || [];

  return {
    pokedexId,
    name,
    description,
    sprites,
    height: pokemonData.height,
    weight: pokemonData.weight,
    types,
    abilities,
    stats,
    moves,
    color,
    eggGroups,
  };
}

async function fetchPokemonFromPokeAPI(id) {
  const baseUrl = 'https://pokeapi.co/api/v2';

  const [pokemonRes, speciesRes] = await Promise.all([
    axios.get(`${baseUrl}/pokemon/${id}`),
    axios.get(`${baseUrl}/pokemon-species/${id}`),
  ]);

  return mapPokemonData(pokemonRes.data, speciesRes.data);
}

async function upsertPokemon(pokemonObj) {
  await Pokemon.findOneAndUpdate(
    { pokedexId: pokemonObj.pokedexId },
    { $set: pokemonObj },
    { upsert: true, new: true }
  );
}

async function seedPokemonRange(startId, endId) {
  for (let id = startId; id <= endId; id++) {
    try {
      console.log(`Fetching Pokémon #${id}...`);
      const pokemonObj = await fetchPokemonFromPokeAPI(id);
      await upsertPokemon(pokemonObj);
      console.log(`Saved Pokémon #${id} (${pokemonObj.name})`);
      await new Promise((res) => setTimeout(res, 250));
    } catch (err) {
      console.error(`Failed for Pokémon #${id}:`, err.message);
    }
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  const startId = Number(process.env.POKEMON_START_ID || 1);
  const endId = Number(process.env.POKEMON_END_ID || 151);

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    await seedPokemonRange(startId, endId);

    console.log('Done seeding Pokémon');
  } catch (err) {
    console.error('Error seeding Pokémon:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}
