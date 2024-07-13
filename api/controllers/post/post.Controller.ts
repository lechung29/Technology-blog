import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/verifyUser";
import Posts from "../../models/post/post.model";
import Users from "../../models/users/user.model";
import { getSlug } from "../../utils/utils";
import { ISortDirection } from "../users/users.controller";

export const createNewPost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.body.title || !req.body.content || !req.body.category) {
        return res.status(400).send({
            success: false,
            message: "Title, content and category are required",
        });
    }

    const existingPost = await Posts.findOne({ title: req.body.title });
    if (!!existingPost) {
        return res.status(400).send({
            success: false,
            message: "This title blog already exists",
        });
    }

    const slug = getSlug(req.body.title);
    const newPost = new Posts({
        ...req.body,
        slug,
        author: req.user?.id,
    });

    try {
        const savedPost = (await newPost.save()).toObject();
        const formattedPost = await Posts.findById((savedPost._id as any).toString())
            .populate({ path: "author", select: "displayName email" })
            .lean();
        return res.status(201).send({
            success: true,
            message: "Post created successfully. Please wait admin approval",
            post: {
                ...formattedPost,
            },
        });
    } catch (error: any) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Something went wrong. Please check your post settings",
        });
    }
};

export const getAllPosts: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.body.page as string) || 1;
        const limit = parseInt(req.body.limit as string) || 9;

        const sortType = req.body?.sortInfo?.sortType === "asc" ? ISortDirection.ASC : ISortDirection.DESC;
        const sortField: string = req.body?.sortInfo?.sortField || "createdAt";

        const sortObject: Record<string, ISortDirection> = {};
        if (sortField) {
            sortObject[sortField] = sortType;
        }

        const filterField = req.body?.filterInfo?.filterField;
        const filterValue = req.body?.filterInfo?.filterValue;
        const filterObject: Record<string, string | Object> = {};
        if (filterField && filterValue) {
            filterObject[filterField] = filterValue;
        }

        const searchText = req.body?.searchText;
        if (searchText) {
            filterObject["title"] = { $regex: searchText, $options: "i" };
        }

        const posts = await Posts.find(filterObject)
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
    } catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to get all posts",
        });
    }
};

export const userDeletePost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.id !== req.params.userId) {
        return res.status(403).send({
            success: false,
            message: "You are not allowed to delete this post",
        });
    }
    try {
        await Posts.findByIdAndDelete(req.params.postId);
        const allPostsLast = await Posts.find({
            author: req.user?.id,
        })
            .populate({ path: "author", select: "displayName email" })
            .lean();
        return res.status(200).send({
            success: true,
            message: "Deleted successfully",
            postData: allPostsLast.map((post) => ({
                ...post,
            })),
        });
    } catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to delete post",
        });
    }
};

export const adminSingleDeletePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    try {
        await Posts.findByIdAndDelete(postId).exec();
        return res.status(200).send({
            success: true,
            message: "Deleted post successfully",
        });
    } catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to delete post",
        });
    }
};

export const adminMultipleDeletePosts: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const postIds: string[] = req.body.postIds;
    try {
        await Posts.deleteMany({ _id: { $in: postIds } }).exec();
        return res.status(200).send({
            success: true,
            message: `Deleted ${postIds.length} posts successfully`,
        });
    } catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to delete post",
        });
    }
};

export const userUpdatePost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.id !== req.params.userId) {
        return res.status(403).send({
            success: false,
            message: "You are not allowed to update this post",
        });
    }

    try {
        const updatedPost = await Posts.findByIdAndUpdate(
            req.params.postId,
            {
                $set: {
                    title: req.body.title,
                    content: req.body.content,
                    category: req.body.category,
                    thumbnail: req.body.thumbnail,
                    slug: getSlug(req.body.title),
                },
            },
            { new: true }
        ).lean();
        const formattedPost = await Posts.findById((updatedPost?._id as any).toString())
            .populate("author", "displayName email")
            .lean();
        return res.status(200).send({
            success: true,
            message: "Post updated successfully",
            updatedPost: {
                ...formattedPost,
            },
        });
    } catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to update post",
        });
    }
};

export const adminUpdateStatusPost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    const status = req.body.status;

    if (!status) {
        return res.status(400).send({
            success: false,
            message: "Status is required",
        });
    }

    try {
        await Posts.findByIdAndUpdate(postId, { $set: { status } }, { new: true });
        return res.status(200).send({
            success: true,
            message: "Post status updated successfully",
        });
    } catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to update post status",
        });
    }
};
