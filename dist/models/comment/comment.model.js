"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const commentSchema = new mongoose_1.default.Schema({
    content: {
        type: String,
        required: true,
    },
    post: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Posts",
        required: true,
    },
    commentator: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
    },
    like: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Users" }],
}, { timestamps: true });
const Comments = mongoose_1.default.model("Comments", commentSchema);
exports.default = Comments;
