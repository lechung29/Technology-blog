import express from 'express';
import { verifyToken } from '../../middlewares/verifyUser';
import { createNewPost, getAllPosts } from '../../controllers/post/post.Controller';

const postRoute = express.Router();

postRoute.post("/create-post", verifyToken, createNewPost)
postRoute.get("/get-all-posts", getAllPosts)

export default postRoute;