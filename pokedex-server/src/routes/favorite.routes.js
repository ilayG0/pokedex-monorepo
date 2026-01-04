const express = require("express");
const router = express.Router();

const {
  getFavoritesCount,
  addFavorite,
  removeFavorite,
  getMyFavorites,
  checkFavorite,
} = require("../controllers/favorite.controller");

const { auth } = require("../auth/auth");

router.get("/me", auth, getMyFavorites);
router.get('/me/count',auth, getFavoritesCount);
router.get('/check/:pokedexId',auth, checkFavorite);
router.post("/", auth, addFavorite);
router.delete("/:pokedexId", auth, removeFavorite);

module.exports = router;
