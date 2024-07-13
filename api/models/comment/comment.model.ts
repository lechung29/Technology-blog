import mongoose from "mongoose";
import { IUserInfo } from "../users/user.model";
import { IPost } from "../post/post.model";

export interface IComment extends Document {
    content: string;
    post: mongoose.Types.ObjectId | IPost;
    commentator: mongoose.Types.ObjectId | IUserInfo;
}

const commentSchema = new mongoose.Schema<IComment>(
    {
        content: {
            type: String,
            required: true,
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Posts",
            required: true,
        },
        commentator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
        },
    },
    { timestamps: true }
);

const Comments = mongoose.model<IComment>("Comments", commentSchema);

export default Comments;
