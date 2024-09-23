import express from 'express';
import { googleAuth, registerNewUser, sendOTP, userLogin } from '../../controllers/auth/auth.controller';

const authRouter = express.Router();

// Register
authRouter.post("/register", registerNewUser)

// Login
authRouter.post("/login", userLogin )

authRouter.post("/google", googleAuth)

authRouter.post("/send-otp", sendOTP)

export default authRouter;