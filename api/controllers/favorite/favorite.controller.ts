import { RequestHandler, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/verifyUser";
import { IRequestStatus } from "../auth/auth.controller";
import Favorites from "../../models/favorite/favorite.model";
import Posts from "../../models/post/post.model";

export const AddOrRemoveFavoritePost: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
    const { postId, userId, isAddFavorite } = req.body;

    if (req.user?.id !== userId) {
        return res.status(403).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Post.Not.Allowed.Action",
        });
    }

    try {
        if (isAddFavorite) {
            const favoritePost = new Favorites({
                post: postId,
                user: userId,
            });

            await favoritePost.save();
            return res.status(200).send({
                requestStatus: IRequestStatus.Success,
                message: "Successful.Add.Favorite",
            });
        } else {
            await Favorites.deleteOne({ post: postId, user: userId }).exec();
            return res.status(200).send({
                requestStatus: IRequestStatus.Success,
                message: "Successful.Remove.Favorite",
            });
        }
    } catch (error: any) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

export const getFavoritePosts: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    if (req.user?.id !== userId) {
        return res.status(403).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Not.Allowed.Access.Favorite",
        });
    }

    try {
        const favoritePosts = await Favorites.find({ user: userId }).lean();
        const favoritePostsId = favoritePosts.map((item) => item.post);
        const posts = await Posts.find({ _id: { $in: favoritePostsId } })
            .populate({ path: "author", select: "displayName email" })
            .lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Get.Favorite",
            data: posts.map((post) => ({
                ...post,
                isFavorite: true,
            })),
        });
    } catch (error: any) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};
