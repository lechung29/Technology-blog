import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/verifyUser";
import Comments from "../../models/comment/comment.model";
import { IRequestStatus } from "../auth/auth.controller";

export const createNewComment: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { content, post, commentator } = req.body;

    // For api requests
    if (commentator !== req.user?.id) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Bạn không có quyền bình luận bài viết này",
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
            requestStatus: IRequestStatus.Success,
            message: "Bình luận thành công",
        });
    } catch (error) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
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
            requestStatus: IRequestStatus.Success,
            message: "Thành công",
            comments: allPostComments,
        });
    } catch (error) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
        });
    }
};

export const updateComment: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { content, commentator } = req.body;
    const { commentId } = req.params;
    if (commentator !== req.user?.id) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Bạn không có quyền cập nhật bình luận này",
        });
    }

    try {
        await Comments.findByIdAndUpdate(commentId, { $set: { content: content } }, { new: true });
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Đã cập nhật bình luận thành công",
        });
    } catch (error) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
        });
    }
};

export const deleteComment: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { commentator } = req.body;
    const { commentId } = req.params;
    if (commentator !== req.user?.id) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Bạn không có quyền xóa bình luận này",
        });
    }

    try {
        await Comments.findByIdAndDelete(commentId).exec();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Đã xóa bình luận thành công",
        });
    } catch (error) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
        });
    }
};

export const likeComment: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const comment = await Comments.findById(req.params.id);
        if (!comment) {
            return res.status(200).send({
                requestStatus: IRequestStatus.Error,
                message: "Bình luận không tồn tại",
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
            requestStatus: IRequestStatus.Success,
            message: "Đã thích bình luận",
            totalLike: comment.like.length,
        });
    } catch (error) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
        });
    }
};
