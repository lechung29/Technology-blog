import express from 'express';
import { googleAuth, logout, refreshToken, registerNewUser, resendOTP, resetPassword, sendOTP, userLogin, verifyOTP } from '../../controllers/auth/auth.controller';
import { verifyToken } from '../../middlewares/verifyUser';

const authRouter = express.Router();

// Register
authRouter.post("/register", registerNewUser)

// Login
authRouter.post("/login", userLogin )

authRouter.get("/refresh-token", refreshToken)

authRouter.post("/google", googleAuth)

authRouter.post("/logout", logout)

authRouter.post("/send-otp", sendOTP)

authRouter.post("/resend-otp", resendOTP)

authRouter.post("/verify-otp", verifyOTP)

authRouter.put("/reset-password", resetPassword)

export default authRouter;