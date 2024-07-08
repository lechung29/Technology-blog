import express from 'express';
import { verifyToken } from '../../middlewares/verifyUser';
import { createNewPost } from '../../controllers/post/post.Controller';

const postRoute = express.Router();

postRoute.post("/create-post", verifyToken, createNewPost)

export default postRoute;