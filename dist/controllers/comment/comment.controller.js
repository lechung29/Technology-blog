"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeComment = exports.deleteComment = exports.updateComment = exports.getAllCommentsByPostId = exports.createNewComment = void 0;
const comment_model_1 = __importDefault(require("../../models/comment/comment.model"));
const createNewComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { content, post, commentator } = req.body;
    // For api requests
    if (commentator !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return res.status(403).send({
            success: false,
            message: "You are not allowed to comment on this post",
        });
    }
    try {
        const newComment = new comment_model_1.default({
            content,
            post,
            commentator,
        });
        yield newComment.save();
        return res.status(201).send({
            success: true,
            message: "New comment created successfully",
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to create new comment",
        });
    }
});
exports.createNewComment = createNewComment;
const getAllCommentsByPostId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    const { skip } = req.body.skip;
    const limit = 10;
    try {
        const allPostComments = yield comment_model_1.default.find({ post: postId }).populate({ path: "commentator", select: "displayName email" }).skip(skip).limit(limit).sort({ createAt: -1 }).lean();
        return res.status(200).send({
            success: true,
            message: "Comments fetched successfully",
            comments: allPostComments,
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to fetch comments",
        });
    }
});
exports.getAllCommentsByPostId = getAllCommentsByPostId;
const updateComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { content, commentator } = req.body;
    const { commentId } = req.params;
    if (commentator !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return res.status(403).send({
            success: false,
            message: "You are not allowed to update this comment",
        });
    }
    try {
        yield comment_model_1.default.findByIdAndUpdate(commentId, { $set: { content: content } }, { new: true });
        return res.status(200).send({
            success: true,
            message: "Comment updated successfully",
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to update comment",
        });
    }
});
exports.updateComment = updateComment;
const deleteComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { commentator } = req.body;
    const { commentId } = req.params;
    if (commentator !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return res.status(403).send({
            success: false,
            message: "You are not allowed to delete this comment",
        });
    }
    try {
        yield comment_model_1.default.findByIdAndDelete(commentId).exec();
        return res.status(200).send({
            success: true,
            message: "Comment deleted successfully",
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to delete comment",
        });
    }
});
exports.deleteComment = deleteComment;
const likeComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const comment = yield comment_model_1.default.findById(req.params.id);
        if (!comment) {
            return res.status(404).send({
                success: false,
                message: "Comment not found",
            });
        }
        const userIndex = comment.like.indexOf((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (userIndex === -1) {
            comment.like.push((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        }
        else {
            comment.like.splice(userIndex, 1);
        }
        yield comment.save();
        return res.status(200).send({
            success: true,
            message: "Like status updated successfully",
            totalLike: comment.like.length,
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to like comment",
        });
    }
});
exports.likeComment = likeComment;
