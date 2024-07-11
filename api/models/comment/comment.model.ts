import mongoose from "mongoose";

export interface IComment extends Document {
    content: string;
    postId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    like: Array<string>;
}

const commentSchema = new mongoose.Schema<IComment>(
    {
        content: {
            type: String,
            required: true,
        },
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Posts",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
        },
        like: {
            type: [
                {
                    type: String,
                },
            ],
            default: [],
        },
    },
    { timestamps: true }
);

const Comments = mongoose.model<IComment>("Comments", commentSchema);

export default Comments;
