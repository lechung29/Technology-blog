import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/verifyUser";
import Comments from "../../models/comment/comment.model";
import { IRequestStatus } from "../auth/auth.controller";
import Posts from "../../models/post/post.model";

//#region create a comment

export const createNewComment: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { content, post, commentator } = req.body;

    // For api requests
    if (commentator !== req.user?.id) {
        return res.status(403).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Comment.Not.Allowed",
        });
    }

    if (!content) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Comment.Not.Blank",
        });
    }

    try {

        const updatedPost = await Posts.findById(post)

        if (!updatedPost) {
            return res.status(404).send({
                requestStatus: IRequestStatus.Error,
                message: "Error.Post.Not.Found",
            });
        }
        updatedPost.totalComments += 1

        const newComment = new Comments({
            content,
            post,
            commentator,
        });

        await newComment.save();
        await updatedPost.save();

        return res.status(201).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Submit.Comment",
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region get all comments by post id

export const getAllCommentsByPostId: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    const { skip } = req.body.skip || 1;
    const limit = 10;
    try {
        const allPostComments = await Comments.find({ post: postId }).populate({ path: "commentator", select: "displayName email" }).skip(skip).limit(limit).sort({ createAt: -1 }).lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Get.Comment",
            comments: allPostComments,
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region update comment

export const updateComment: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { content, commentator } = req.body;
    const { commentId } = req.params;
    if (commentator !== req.user?.id) {
        return res.status(403).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Comment.Not.Allowed.Update",
        });
    }

    try {
        await Comments.findByIdAndUpdate(commentId, { $set: { content: content } }, { new: true });
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Update.Comment",
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region delete comment

export const deleteComment: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { commentId, userId } = req.params;
    if (userId !== req.user?.id) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Comment.Not.Allowed.Delete",
        });
    }

    try {
        const comment = await Comments.findById(commentId)
        if (!comment) {
            return res.status(404).send({
                requestStatus: IRequestStatus.Error,
                message: "Error.Comment.Not.Found",
            });
        }
        const post = await Posts.findById(comment.post.toString())
        if (!post) {
            return res.status(404).send({
                requestStatus: IRequestStatus.Error,
                message: "Error.Post.Not.Found",
            });
        }
        await Comments.findByIdAndDelete(commentId).exec();

        post.totalComments -= 1;
        await post.save();

        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Delete.Comment",
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region like comment

export const likeComment: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const comment = await Comments.findById(req.params.commentId);
        if (!comment) {
            return res.status(404).send({
                requestStatus: IRequestStatus.Error,
                message: "Error.Comment.Not.Found",
            });
        }

        const userIndex = comment.like.indexOf(req.user?.id);
        let message: string

        if (userIndex === -1) {
            comment.like.push(req.user?.id);
            message = "Successful.Like.Comment";
        } else {
            comment.like.splice(userIndex, 1);
            message = "Successful.Dislike.Comment";
        }

        await comment.save();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: message,
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};
