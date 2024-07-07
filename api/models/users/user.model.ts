import mongoose, { Document } from "mongoose";

export enum userRole {
    admin = "admin",
    user = "user",
}

export enum userGender {
    male = "male",
    female = "female",
}

export interface IUserInfo extends Document{
    displayName: string;
    email: string;
    password: string;
    phoneNumber: string;
    avatar:string;
    gender: userGender;
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
    gender: {
        type: String,
        required: false,
        enum: Object.values(userGender)
    }, 
    avatar: {
        type: String,
        required: false,
        default: "https://www.pngkey.com/png/full/115-1150420_avatar-png-pic-male-avatar-icon-png.png"
    },
    role: {
        type: String,
        required: true,
        default: userRole.user,
        enum: Object.values(userRole)
    }
}, {timestamps: true})

const Users = mongoose.model<IUserInfo>("Users", userSchema)

export default Users;