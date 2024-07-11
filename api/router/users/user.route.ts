import express from 'express';
import { deleteMultipleUsers, deleteSingleUser, getAllUsers, getTotalUsers, updateUserInfo, userLogout } from '../../controllers/users/users.controller';
import { verifyToken } from '../../middlewares/verifyUser';
import { isAdmin } from '../../middlewares/authMiddleware';

const userRouter = express.Router();

userRouter.get("/all-users", verifyToken, isAdmin, getAllUsers)
userRouter.get("single-user/:userId")
userRouter.get("/total-users", verifyToken, isAdmin, getTotalUsers)
userRouter.put("/update/:userId", verifyToken, updateUserInfo)
userRouter.delete("/delete/:userId", verifyToken, isAdmin, deleteSingleUser)
userRouter.delete("/multi-delete", verifyToken, isAdmin, deleteMultipleUsers)
userRouter.post("/logout", userLogout)

export default userRouter;