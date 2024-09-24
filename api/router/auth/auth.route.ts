import express from 'express';
import { googleAuth, registerNewUser, resendOTP, resetPassword, sendOTP, userLogin, verifyOTP } from '../../controllers/auth/auth.controller';

const authRouter = express.Router();

// Register
authRouter.post("/register", registerNewUser)

// Login
authRouter.post("/login", userLogin )

authRouter.post("/google", googleAuth)

authRouter.post("/send-otp", sendOTP)

authRouter.post("/resend-otp", resendOTP)

authRouter.post("/verify-otp", verifyOTP)

authRouter.put("/reset-password", resetPassword)

export default authRouter;