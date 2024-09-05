import express from "express";
import { verifyToken } from "../../middlewares/verifyUser";
import { createNewComment, deleteComment, getAllCommentsByPostId, likeComment, updateComment } from "../../controllers/comment/comment.controller";

const commentRoute = express.Router();

commentRoute.post("/create-comment", verifyToken, createNewComment);
commentRoute.get("/get-post-comment/:postId", getAllCommentsByPostId);
commentRoute.put("/like-comment/:commentId", verifyToken, likeComment);
commentRoute.put("/update-comment/:commentId", verifyToken, updateComment);
commentRoute.delete("/delete-comment/:commentId", verifyToken, deleteComment);

export default commentRoute;
