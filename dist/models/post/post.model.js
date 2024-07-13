"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostType = exports.PostState = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var PostState;
(function (PostState) {
    PostState["PENDING"] = "Pending";
    PostState["PUBLISHED"] = "Published";
    PostState["REJECTED"] = "Rejected";
})(PostState || (exports.PostState = PostState = {}));
var PostType;
(function (PostType) {
})(PostType || (exports.PostType = PostType = {}));
const postSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    category: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        default: "https://img.lovepik.com/free-template/bg/20190702/bg/877531811030a.png_master.jpg",
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    comments: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ],
    status: {
        type: String,
        required: true,
        default: PostState.PENDING,
        enum: Object.values(PostState),
    },
}, { timestamps: true });
const Posts = mongoose_1.default.model("Posts", postSchema);
exports.default = Posts;
