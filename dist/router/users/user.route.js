"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_controller_1 = require("../../controllers/users/users.controller");
const verifyUser_1 = require("../../middlewares/verifyUser");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const userRouter = express_1.default.Router();
userRouter.get("/all-users", verifyUser_1.verifyToken, authMiddleware_1.isAdmin, users_controller_1.getAllUsers);
userRouter.get("single-user/:userId");
userRouter.get("/total-users", verifyUser_1.verifyToken, authMiddleware_1.isAdmin, users_controller_1.getTotalUsers);
userRouter.put("/update/:userId", verifyUser_1.verifyToken, users_controller_1.updateUserInfo);
userRouter.delete("/delete/:userId", verifyUser_1.verifyToken, authMiddleware_1.isAdmin, users_controller_1.deleteSingleUser);
userRouter.delete("/multi-delete", verifyUser_1.verifyToken, authMiddleware_1.isAdmin, users_controller_1.deleteMultipleUsers);
userRouter.post("/logout", users_controller_1.userLogout);
exports.default = userRouter;
