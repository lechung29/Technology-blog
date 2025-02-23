import express from 'express';
import { isLocked, verifyToken } from '../../middlewares/verifyUser';
import { multipleDeletePosts, getOverViewUser, adminSingleDeletePost, adminUpdateStatusPost, createNewPost, getAllPosts, getFilterPosts, userSingleDeletePost, userUpdatePost, getMaxPages, getSinglePost, likePost, getAllTags } from '../../controllers/post/post.Controller';
import { isAdmin } from '../../middlewares/authMiddleware';

const postRouter = express.Router();

postRouter.post("/create-post", verifyToken, isLocked, createNewPost)
postRouter.get('/get-all-posts', getAllPosts)
postRouter.get("/get-filters-posts", getFilterPosts)
postRouter.get("/get-single-post/:postId/:userId", getSinglePost)
postRouter.get("/get-max-pages", getMaxPages)
postRouter.put("/like-post/:postId", verifyToken, isLocked, likePost)
postRouter.put("/update-post/:postId/:userId", verifyToken, isLocked, userUpdatePost)
postRouter.put("/update-post/:postId", verifyToken, isLocked, isAdmin, adminUpdateStatusPost)
postRouter.delete("/delete-post/:postId/:userId", verifyToken, isLocked, userSingleDeletePost)
postRouter.delete("/delete-post/:postId", verifyToken, isLocked, isAdmin, adminSingleDeletePost)
postRouter.post("/multi-delete-post", verifyToken, isLocked, multipleDeletePosts)
postRouter.get("/get-all-tags", getAllTags)
postRouter.get("/get-overview/:userId", verifyToken, isLocked, getOverViewUser)

export default postRouter;