"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userGender = exports.userRole = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var userRole;
(function (userRole) {
    userRole["admin"] = "admin";
    userRole["user"] = "user";
})(userRole || (exports.userRole = userRole = {}));
var userGender;
(function (userGender) {
    userGender["male"] = "male";
    userGender["female"] = "female";
})(userGender || (exports.userGender = userGender = {}));
const userSchema = new mongoose_1.default.Schema({
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
    avatar: {
        type: String,
        required: false,
        default: "https://www.pngkey.com/png/full/115-1150420_avatar-png-pic-male-avatar-icon-png.png",
    },
    role: {
        type: String,
        required: true,
        default: userRole.user,
        enum: Object.values(userRole),
    },
}, { timestamps: true });
const Users = mongoose_1.default.model("Users", userSchema);
exports.default = Users;
