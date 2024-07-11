import express from 'express';
import { verifyToken } from '../../middlewares/verifyUser';
import { adminMultipleDeletePosts, adminSingleDeletePost, adminUpdateStatusPost, createNewPost, getAllPosts, userDeletePost, userUpdatePost } from '../../controllers/post/post.Controller';
import { isAdmin } from '../../middlewares/authMiddleware';

const postRoute = express.Router();

postRoute.post("/create-post", verifyToken, createNewPost)
postRoute.get("/get-all-posts", getAllPosts)
postRoute.put("/update-post/:postId/:userId", verifyToken, userUpdatePost)
postRoute.put("/update-post/:postId", verifyToken, isAdmin, adminUpdateStatusPost)
postRoute.delete("/delete-post/:postId/:userId", verifyToken, userDeletePost)
postRoute.delete("/delete-post/:postId", verifyToken, isAdmin, adminSingleDeletePost)
postRoute.delete("/multi-delete-post", verifyToken, isAdmin, adminMultipleDeletePosts)

export default postRoute;