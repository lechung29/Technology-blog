import express from 'express';
import { registerNewUser, userLogin } from '../../controllers/auth/auth.controller';

const authRouter = express.Router();

// Register
authRouter.post("/register", registerNewUser)

// Login
authRouter.post("/login", userLogin )

export default authRouter;