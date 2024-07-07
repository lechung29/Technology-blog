import mongoose, { Document } from "mongoose";

export interface IUserInfo extends Document{
    displayName: string;
    email: string;
    password: string;
    phoneNumber: string;
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
    }
}, {timestamps: true})

const Users = mongoose.model<IUserInfo>("Users", userSchema)

export default Users;