const Pokemon = require("../models/pokemon.model");

async function getPokemons(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);

    if (!page || !limit || page < 1 || limit < 1) {
      return res
        .status(400)
        .json({ message: "page and limit must be positive numbers" });
    }

    const skip = (page - 1) * limit;

    const [pokemons, total] = await Promise.all([
      Pokemon.find().sort({ pokedexId: 1 }).skip(skip).limit(limit),
      Pokemon.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      page,
      limit,
      total,
      totalPages,
      data: pokemons,
    });
  } catch (err) {
    next(err);
  }
}
async function getPokemonByNameOrId(req, res, next) {
  try {
    const { nameOrId } = req.params;

    const isNumeric = /^\d+$/.test(nameOrId);

    const query = isNumeric
      ? { pokedexId: Number(nameOrId) }
      : { name: nameOrId.toLowerCase() };

    const pokemon = await Pokemon.findOne(query).lean();

    if (!pokemon) {
      return res.status(404).json({ message: "Pokemon not found" });
    }

    return res.json(pokemon);
  } catch (err) {
    next(err);
  }
}


async function searchPokemons(req, res, next) {
  try {
    const {
      height,
      type,
      group,
      color,
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);

    const match = {};

    if (height !== undefined && height !== '') {
      const h = Number(height);
      if (!Number.isNaN(h)) {
        match.height = h;
      }
    }

    if (type) {
      match['types.name'] = type.toLowerCase();
    }

    if (group) {
      match.eggGroups = group.toLowerCase();
    }

    if (color) {
      match.color = color.toLowerCase();
    }

    const total = await Pokemon.countDocuments(match);
    const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;
    const skip = (pageNum - 1) * limitNum;

    const pokemons = await Pokemon.find(match)
      .sort({ pokedexId: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean()
      .exec();

    res.json({
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      data: pokemons,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPokemons,
  getPokemonByNameOrId,
  searchPokemons,
};
