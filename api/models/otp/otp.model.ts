import mongoose, { Document } from "mongoose";

export interface IOTP extends Document {
    otpCode: string;
    userEmail: string;
    createdAt: Date;
}

const otpSchema = new mongoose.Schema<IOTP>({
    otpCode: {
        type: String,
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: "5m"
    },
});

const OTPs = mongoose.model<IOTP>("OTPs", otpSchema);

export default OTPs;
