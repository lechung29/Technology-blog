import mongoose, { Document } from "mongoose";
import { IUserInfo } from "../users/user.model";
import { IPost } from "../post/post.model";

export interface IFavorite extends Document {
    post: mongoose.Types.ObjectId | IPost;
    user: mongoose.Types.ObjectId | IUserInfo;
}

const favoriteSchema = new mongoose.Schema<IFavorite>(
    {
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Posts",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
        },
    }, {
        timestamps: true,
    }
)

const Favorites = mongoose.model<IFavorite>("Favorites", favoriteSchema);

export default Favorites;