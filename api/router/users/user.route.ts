import express from 'express';
import { adminUpdateUserStatus, deleteMultipleUsers, getAllUsers, getTotalUsers, updatePassword, updateUserInfo } from '../../controllers/users/users.controller';
import { isLocked, verifyToken } from '../../middlewares/verifyUser';
import { isAdmin } from '../../middlewares/authMiddleware';

const userRouter = express.Router();

userRouter.get("/all-users", verifyToken, isLocked, isAdmin, getAllUsers)
userRouter.get("single-user/:userId")
userRouter.get("/total-users", verifyToken, isLocked, isAdmin, getTotalUsers)
userRouter.put("/update/:userId", verifyToken, isLocked, updateUserInfo)
userRouter.put("/update-password/:userId", verifyToken, isLocked, updatePassword)
userRouter.delete("/multi-delete", verifyToken, isLocked, isAdmin, deleteMultipleUsers)
userRouter.put("/update-status/:userId", verifyToken, isLocked, isAdmin, adminUpdateUserStatus)

export default userRouter;