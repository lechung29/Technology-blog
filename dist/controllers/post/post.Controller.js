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
exports.adminUpdateStatusPost = exports.userUpdatePost = exports.adminMultipleDeletePosts = exports.adminSingleDeletePost = exports.userDeletePost = exports.getAllPosts = exports.createNewPost = void 0;
const post_model_1 = __importDefault(require("../../models/post/post.model"));
const utils_1 = require("../../utils/utils");
const users_controller_1 = require("../users/users.controller");
const createNewPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.body.title || !req.body.content || !req.body.category) {
        return res.status(400).send({
            success: false,
            message: "Title, content and category are required",
        });
    }
    const existingPost = yield post_model_1.default.findOne({ title: req.body.title });
    if (!!existingPost) {
        return res.status(400).send({
            success: false,
            message: "This title blog already exists",
        });
    }
    const slug = (0, utils_1.getSlug)(req.body.title);
    const newPost = new post_model_1.default(Object.assign(Object.assign({}, req.body), { slug, author: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id }));
    try {
        const savedPost = (yield newPost.save()).toObject();
        const formattedPost = yield post_model_1.default.findById(savedPost._id.toString())
            .populate({ path: "author", select: "displayName email" })
            .lean();
        return res.status(201).send({
            success: true,
            message: "Post created successfully. Please wait admin approval",
            post: Object.assign({}, formattedPost),
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Something went wrong. Please check your post settings",
        });
    }
});
exports.createNewPost = createNewPost;
const getAllPosts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 9;
        const sortType = ((_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.sortInfo) === null || _b === void 0 ? void 0 : _b.sortType) === "asc" ? users_controller_1.ISortDirection.ASC : users_controller_1.ISortDirection.DESC;
        const sortField = ((_d = (_c = req.body) === null || _c === void 0 ? void 0 : _c.sortInfo) === null || _d === void 0 ? void 0 : _d.sortField) || "createdAt";
        const sortObject = {};
        if (sortField) {
            sortObject[sortField] = sortType;
        }
        const filterField = (_f = (_e = req.body) === null || _e === void 0 ? void 0 : _e.filterInfo) === null || _f === void 0 ? void 0 : _f.filterField;
        const filterValue = (_h = (_g = req.body) === null || _g === void 0 ? void 0 : _g.filterInfo) === null || _h === void 0 ? void 0 : _h.filterValue;
        const filterObject = {};
        if (filterField && filterValue) {
            filterObject[filterField] = filterValue;
        }
        const searchText = (_j = req.body) === null || _j === void 0 ? void 0 : _j.searchText;
        if (searchText) {
            filterObject["title"] = { $regex: searchText, $options: "i" };
        }
        const posts = yield post_model_1.default.find(filterObject)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort(sortObject)
            .populate({ path: "author", select: "displayName email" })
            .lean()
            .exec();
        // const totalPost = await Posts.countDocuments();
        // const now = new Date();
        // const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        // const lastMonthPosts = await Posts.countDocuments({ createdAt: { $gte: lastMonth } });
        return res.status(200).send({
            success: true,
            message: "Get all posts successfully",
            allPosts: posts
            // totalPosts: totalPost,
            // lastMonthPosts: lastMonthPosts,
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to get all posts",
        });
    }
});
exports.getAllPosts = getAllPosts;
const userDeletePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== req.params.userId) {
        return res.status(403).send({
            success: false,
            message: "You are not allowed to delete this post",
        });
    }
    try {
        yield post_model_1.default.findByIdAndDelete(req.params.postId);
        const allPostsLast = yield post_model_1.default.find({
            author: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
        })
            .populate({ path: "author", select: "displayName email" })
            .lean();
        return res.status(200).send({
            success: true,
            message: "Deleted successfully",
            postData: allPostsLast.map((post) => (Object.assign({}, post))),
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to delete post",
        });
    }
});
exports.userDeletePost = userDeletePost;
const adminSingleDeletePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const postId = req.params.postId;
    try {
        yield post_model_1.default.findByIdAndDelete(postId).exec();
        return res.status(200).send({
            success: true,
            message: "Deleted post successfully",
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to delete post",
        });
    }
});
exports.adminSingleDeletePost = adminSingleDeletePost;
const adminMultipleDeletePosts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const postIds = req.body.postIds;
    try {
        yield post_model_1.default.deleteMany({ _id: { $in: postIds } }).exec();
        return res.status(200).send({
            success: true,
            message: `Deleted ${postIds.length} posts successfully`,
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to delete post",
        });
    }
});
exports.adminMultipleDeletePosts = adminMultipleDeletePosts;
const userUpdatePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== req.params.userId) {
        return res.status(403).send({
            success: false,
            message: "You are not allowed to update this post",
        });
    }
    try {
        const updatedPost = yield post_model_1.default.findByIdAndUpdate(req.params.postId, {
            $set: {
                title: req.body.title,
                content: req.body.content,
                category: req.body.category,
                thumbnail: req.body.thumbnail,
                slug: (0, utils_1.getSlug)(req.body.title),
            },
        }, { new: true }).lean();
        const formattedPost = yield post_model_1.default.findById((updatedPost === null || updatedPost === void 0 ? void 0 : updatedPost._id).toString())
            .populate("author", "displayName email")
            .lean();
        return res.status(200).send({
            success: true,
            message: "Post updated successfully",
            updatedPost: Object.assign({}, formattedPost),
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to update post",
        });
    }
});
exports.userUpdatePost = userUpdatePost;
const adminUpdateStatusPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const postId = req.params.postId;
    const status = req.body.status;
    if (!status) {
        return res.status(400).send({
            success: false,
            message: "Status is required",
        });
    }
    try {
        yield post_model_1.default.findByIdAndUpdate(postId, { $set: { status } }, { new: true });
        return res.status(200).send({
            success: true,
            message: "Post status updated successfully",
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to update post status",
        });
    }
});
exports.adminUpdateStatusPost = adminUpdateStatusPost;
