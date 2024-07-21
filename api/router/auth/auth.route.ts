import express from 'express';
import { googleAuth, registerNewUser, userLogin } from '../../controllers/auth/auth.controller';

const authRouter = express.Router();

// Register
authRouter.post("/register", registerNewUser)

// Login
authRouter.post("/login", userLogin )

authRouter.post("/google", googleAuth)

export default authRouter;