import express from 'express';
import { verifyToken } from '../../middlewares/verifyUser';
import { multipleDeletePosts, adminSingleDeletePost, adminUpdateStatusPost, createNewPost, getAllPosts, getFilterPosts, userSingleDeletePost, userUpdatePost, getPublicPosts, getMaxPages, getSinglePost } from '../../controllers/post/post.Controller';
import { isAdmin } from '../../middlewares/authMiddleware';

const postRoute = express.Router();

postRoute.post("/create-post", verifyToken, createNewPost)
postRoute.get('/get-all-posts', getAllPosts)
postRoute.get("/get-filters-posts", getFilterPosts)
postRoute.get("/get-public-posts", getPublicPosts)
postRoute.get("/get-single-post/:postId/:userId", getSinglePost)
postRoute.get("/get-max-pages", getMaxPages)
postRoute.put("/update-post/:postId/:userId", verifyToken, userUpdatePost)
postRoute.put("/update-post/:postId", verifyToken, isAdmin, adminUpdateStatusPost)
postRoute.delete("/delete-post/:postId/:userId", verifyToken, userSingleDeletePost)
postRoute.delete("/delete-post/:postId", verifyToken, isAdmin, adminSingleDeletePost)
postRoute.delete("/multi-delete-post", verifyToken, multipleDeletePosts)

export default postRoute;