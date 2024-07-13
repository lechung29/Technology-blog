"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyUser_1 = require("../../middlewares/verifyUser");
const comment_controller_1 = require("../../controllers/comment/comment.controller");
const commentRoute = express_1.default.Router();
commentRoute.post("/create-comment", verifyUser_1.verifyToken, comment_controller_1.createNewComment);
commentRoute.get("/get-post-comment/:postId", comment_controller_1.getAllCommentsByPostId);
commentRoute.put("like-comment/:commentId", verifyUser_1.verifyToken, comment_controller_1.likeComment);
commentRoute.put("update-comment/:commentId", verifyUser_1.verifyToken, comment_controller_1.updateComment);
commentRoute.delete("delete-comment/:commentId", verifyUser_1.verifyToken, comment_controller_1.deleteComment);
exports.default = commentRoute;
