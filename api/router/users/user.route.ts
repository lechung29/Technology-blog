import express from 'express';
import { updateUserInfo } from '../../controllers/users/users.controller';
import { verifyToken } from '../../middlewares/verifyUser';

const userRouter = express.Router();

userRouter.put("/update/:userId", verifyToken, updateUserInfo)

export default userRouter;