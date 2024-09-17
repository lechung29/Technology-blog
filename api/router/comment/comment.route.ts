import express from "express";
import { isLocked, verifyToken } from "../../middlewares/verifyUser";
import { createNewComment, deleteComment, getAllCommentsByPostId, likeComment, updateComment } from "../../controllers/comment/comment.controller";

const commentRouter = express.Router();

commentRouter.post("/create-comment", verifyToken, isLocked, createNewComment);
commentRouter.get("/get-post-comment/:postId", getAllCommentsByPostId);
commentRouter.put("/like-comment/:commentId", verifyToken, isLocked, likeComment);
commentRouter.put("/update-comment/:commentId", verifyToken, isLocked, updateComment);
commentRouter.delete("/delete-comment/:commentId", verifyToken, isLocked, deleteComment);

export default commentRouter;
