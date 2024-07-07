import mongoose, { Document } from "mongoose";

export enum userRole {
    admin = "admin",
    user = "user",
}

export interface IUserInfo extends Document{
    displayName: string;
    email: string;
    password: string;
    phoneNumber: string;
    role: userRole;
}

const userSchema = new mongoose.Schema<IUserInfo>({
    displayName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: false
    }, 
    role: {
        type: String,
        required: true,
        enum: Object.values(userRole)
    }
}, {timestamps: true})

const Users = mongoose.model<IUserInfo>("Users", userSchema)

export default Users;