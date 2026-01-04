const Favorite = require("../models/favorite.model");
const Pokemon = require("../models/pokemon.model");

async function getFavoritesCount(req, res, next) {
  try {
    const userId = req.user.id;

    const count = await Favorite.countDocuments({ userId });

    res.json({ count });
  } catch (err) {
    next(err);
  }
}

async function addFavorite(req, res, next) {
  try {
    const userId = req.user?.id;
    const pokedexId = Number(req.body?.pokedexId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (Number.isNaN(pokedexId)) {
      return res
        .status(400)
        .json({ message: "pokedexId is required and must be a number" });
    }

    const pokemon = await Pokemon.findOne({ pokedexId }).select("_id").lean();
    if (!pokemon) {
      return res.status(404).json({ message: "Pokemon not found" });
    }

    const favorite = await Favorite.findOneAndUpdate(
      { userId, pokemon: pokemon._id },
      { $setOnInsert: { userId, pokemon: pokemon._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .populate("pokemon")
      .lean();

    return res.status(200).json({ favorite });
  } catch (err) {
    return next(err);
  }
}

async function removeFavorite(req, res, next) {
  try {
    const userId = req.user?.id;
    const pokedexId = Number(req.params?.pokedexId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (Number.isNaN(pokedexId)) {
      return res.status(400).json({ message: "Invalid pokedexId" });
    }

    const pokemon = await Pokemon.findOne({ pokedexId }).select("_id").lean();
    if (!pokemon) {
      return res.status(404).json({ message: "Pokemon not found" });
    }

    const result = await Favorite.deleteOne({ userId, pokemon: pokemon._id });

    return res.status(200).json({
      success: true,
      deleted: result.deletedCount === 1,
    });
  } catch (err) {
    return next(err);
  }
}

async function getMyFavorites(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const favorites = await Favorite.find({ userId })
      .populate("pokemon")
      .select("pokemon -_id")
      .lean();

    const pokemons = favorites.map((f) => f.pokemon).filter(Boolean);

    return res.status(200).json({ favorites: pokemons });
  } catch (err) {
    return next(err);
  }
}

async function checkFavorite(req, res, next) {
  try {
    const userId = req.user?.id;
    const pokedexId = Number(req.params?.pokedexId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (Number.isNaN(pokedexId)) {
      return res.status(400).json({ message: "Invalid pokedexId" });
    }

    const pokemon = await Pokemon.findOne({ pokedexId }).select("_id").lean();

    if (!pokemon) {
      return res.status(200).json({ liked: false });
    }

    const exists = await Favorite.exists({
      userId,
      pokemon: pokemon._id,
    });

    return res.status(200).json({ liked: Boolean(exists) });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getFavoritesCount,
  addFavorite,
  removeFavorite,
  getMyFavorites,
  checkFavorite,
};
