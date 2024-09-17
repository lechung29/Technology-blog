import mongoose, { Document } from "mongoose";

export enum userRole {
    admin = "admin",
    user = "user",
}

export enum userGender {
    male = "male",
    female = "female",
}

export enum userStatus {
    active = "active",
    inactive = "locked",
}

export type IUserInfo = Omit<IUserData, "password">;

export interface IUserData extends Document {
    displayName: string;
    email: string;
    password: string;
    phoneNumber: string;
    avatar: string;
    gender: userGender;
    role: userRole;
    status: userStatus;
}

export const defaultAvatar: string = "https://www.pngkey.com/png/full/115-1150420_avatar-png-pic-male-avatar-icon-png.png"

const userSchema = new mongoose.Schema<IUserData>(
    {
        displayName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: false,
        },
        gender: {
            type: String,
            required: false,
            enum: Object.values(userGender),
        },
        status: {
            type: String,
            required: true,
            default: userStatus.active,
            enum: Object.values(userStatus),
        },
        avatar: {
            type: String,
            required: false,
            default: defaultAvatar,
        },
        role: {
            type: String,
            required: true,
            default: userRole.user,
            enum: Object.values(userRole),
        },
    },
    { timestamps: true }
);

const Users = mongoose.model<IUserData>("Users", userSchema);

export default Users;
