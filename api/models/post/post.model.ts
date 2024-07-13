import mongoose, { Document } from "mongoose";
import { IUserInfo } from "../users/user.model";
import { IComment } from "../comment/comment.model";

export enum PostState {
    PENDING = "Pending",
    PUBLISHED = "Published",
    REJECTED = "Rejected",
}

export enum PostType {
    
}

export interface IPost extends Document {
    title: string;
    slug: string;
    category: string;
    thumbnail: string;
    content: string;
    author: mongoose.Types.ObjectId | IUserInfo;
    comments: (mongoose.Types.ObjectId | IComment)[];
    status: PostState;
}

const postSchema = new mongoose.Schema<IPost>(
    {
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
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Users", 
            required: true 
        },
        comments: [
            { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'Comment' 
            }
        ],
        status: {
            type: String,
            required: true,
            default: PostState.PENDING,
            enum: Object.values(PostState),
        },
    },
    { timestamps: true }
);

const Posts = mongoose.model<IPost>("Posts", postSchema);

export default Posts;
