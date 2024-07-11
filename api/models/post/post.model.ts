import mongoose, { Document } from "mongoose";

export enum PostState {
    PENDING = "Pending",
    PUBLISHED = "Published",
    DELETED = "Deleted",
}

export interface IPost extends Document {
    title: string;
    slug: string;
    category: string;
    thumbnail: string;
    content: string;
    author: string;
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
            type: String,
            required: true,
        },
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
