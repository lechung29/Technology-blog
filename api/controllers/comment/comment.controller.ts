import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/verifyUser";
import Comments from "../../models/comment/comment.model";

export const createNewComment: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { content, post, commentator } = req.body;

    // For api requests
    if (commentator !== req.user?.id) {
        return res.status(403).send({
            success: false,
            message: "You are not allowed to comment on this post",
        });
    }

    try {
        const newComment = new Comments({
            content,
            post,
            commentator,
        });

        await newComment.save();

        return res.status(201).send({
            success: true,
            message: "New comment created successfully",
        });
    } catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to create new comment",
        });
    }
};

export const getAllCommentsByPostId: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    const { skip } = req.body.skip;
    const limit = 10;
    try {
        const allPostComments = await Comments.find({ post: postId }).populate({ path: "commentator", select: "displayName email" }).skip(skip).limit(limit).sort({ createAt: -1 }).lean();
        return res.status(200).send({
            success: true,
            message: "Comments fetched successfully",
            comments: allPostComments,
        });
    } catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to fetch comments",
        });
    }
};

export const updateComment: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { content, commentator } = req.body;
    const { commentId } = req.params;
    if (commentator !== req.user?.id) {
        return res.status(403).send({
            success: false,
            message: "You are not allowed to update this comment",
        });
    }

    try {
        await Comments.findByIdAndUpdate(commentId, { $set: { content: content } }, { new: true });
        return res.status(200).send({
            success: true,
            message: "Comment updated successfully",
        });
    } catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to update comment",
        });
    }
};

export const deleteComment: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { commentator } = req.body;
    const { commentId } = req.params;
    if (commentator !== req.user?.id) {
        return res.status(403).send({
            success: false,
            message: "You are not allowed to delete this comment",
        });
    }

    try {
        await Comments.findByIdAndDelete(commentId).exec();
        return res.status(200).send({
            success: true,
            message: "Comment deleted successfully",
        });
    } catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to delete comment",
        });
    }
};

export const likeComment: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const comment = await Comments.findById(req.params.id);
        if (!comment) {
            return res.status(404).send({
                success: false,
                message: "Comment not found",
            });
        }

        const userIndex = comment.like.indexOf(req.user?.id);

        if (userIndex === -1) {
            comment.like.push(req.user?.id);
        } else {
            comment.like.splice(userIndex, 1);
        }

        await comment.save();
        return res.status(200).send({
            success: true,
            message: "Like status updated successfully",
            totalLike: comment.like.length,
        });
    } catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to like comment",
        });
    }
};
