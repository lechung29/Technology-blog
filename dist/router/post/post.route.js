"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyUser_1 = require("../../middlewares/verifyUser");
const post_Controller_1 = require("../../controllers/post/post.Controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const postRoute = express_1.default.Router();
postRoute.post("/create-post", verifyUser_1.verifyToken, post_Controller_1.createNewPost);
postRoute.get("/get-all-posts", post_Controller_1.getAllPosts);
postRoute.put("/update-post/:postId/:userId", verifyUser_1.verifyToken, post_Controller_1.userUpdatePost);
postRoute.put("/update-post/:postId", verifyUser_1.verifyToken, authMiddleware_1.isAdmin, post_Controller_1.adminUpdateStatusPost);
postRoute.delete("/delete-post/:postId/:userId", verifyUser_1.verifyToken, post_Controller_1.userDeletePost);
postRoute.delete("/delete-post/:postId", verifyUser_1.verifyToken, authMiddleware_1.isAdmin, post_Controller_1.adminSingleDeletePost);
postRoute.delete("/multi-delete-post", verifyUser_1.verifyToken, authMiddleware_1.isAdmin, post_Controller_1.adminMultipleDeletePosts);
exports.default = postRoute;
