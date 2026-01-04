const express = require("express");
const { getPokemons, getPokemonByNameOrId, searchPokemons} = require("../controllers/pokemons.controller");
const { auth } = require("../auth/auth");

const router = express.Router();

router.get("/", auth , getPokemons);
router.get("/search",auth, searchPokemons);
router.get("/:nameOrId", auth , getPokemonByNameOrId);

module.exports = router;