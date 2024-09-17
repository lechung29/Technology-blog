import express from 'express';
import { isLocked, verifyToken } from '../../middlewares/verifyUser';
import { AddOrRemoveFavoritePost, getFavoritePosts } from '../../controllers/favorite/favorite.controller';

const favoriteRouter = express.Router();

favoriteRouter.post("/add-favorite", verifyToken, isLocked, AddOrRemoveFavoritePost)
favoriteRouter.get("/get-favorite/:userId", verifyToken, isLocked, getFavoritePosts)

export default favoriteRouter