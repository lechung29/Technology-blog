import mongoose, { Document } from "mongoose";

export interface IRefreshToken {
    token: string;
    userId: string;
    createdAt: Date;
}

const refreshTokenSchema = new mongoose.Schema<IRefreshToken>({
    token: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: "1d"
    },
})

const RefreshTokens = mongoose.model<IRefreshToken>("RefreshTokens", refreshTokenSchema)

export default RefreshTokens;