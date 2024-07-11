import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/verifyUser";
import Posts from "../../models/post/post.model";
import Users from "../../models/users/user.model";
import { getSlug } from "../../utils/utils";

export const createNewPost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.body.title || !req.body.content || !req.body.category) {
        return res.status(400).send({
            success: false,
            message: "Title and content are required",
        });
    }

    const slug = getSlug(req.body.title)
    const newPost = new Posts({
        ...req.body,
        slug,
        author: req.user?.id,
    });

    const currentUser = await Users.findById(req.user?.id).lean();

    try {
        const savedPost = await newPost.save();
        return res.status(201).send({
            success: true,
            message: "Post created successfully. Please wait admin approval",
            post: {
                ...savedPost,
                author: currentUser?.displayName,
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
        const startIndex = parseInt(req.query.startIndex as string) || 0;
        const limit = parseInt(req.query.limit as string) || 9;
        const sortInfo = req.query.order === "asc" ? 1 : -1;

        const query: any = {};
        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.slug) {
            query.slug = req.query.slug;
        }
        if (req.query.postId) {
            query._id = req.query.postId;
        }
        if (req.query.author) {
            query.author = req.query.author;
        }
        if (req.query.status) {
            query.status = req.query.status;
        }
        if (req.query.searchTerm) {
            query.$or = [
                { title: { $regex: req.query.searchTerm, $options: "i" } }, 
                { content: { $regex: req.query.searchTerm, $options: "i" } }
            ];
        }
        const posts = await Posts.find(query).sort({ updatedAt: sortInfo }).skip(startIndex).limit(limit).lean();

        // const totalPost = await Posts.countDocuments();
        // const now = new Date();
        // const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        // const lastMonthPosts = await Posts.countDocuments({ createdAt: { $gte: lastMonth } });

        const userIds = posts.map((post) => post.author);

        const users = await Users.find({ _id: { $in: userIds } });

        const userIdToDisplayName: Record<string, string> = {};
        users.forEach((user) => {
            userIdToDisplayName[user.id.toString()] = user.displayName;
        });
        return res.status(200).send({
            success: true,
            message: "Get all posts successfully",
            allPosts: posts.map((post) => ({
                ...post,
                author: userIdToDisplayName[post.author.toString()] || null,
            })),
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
        }).lean();
        const currentUser = await Users.findById(req.user?.id);
        return res.status(200).send({
            success: true,
            message: "Deleted successfully",
            postData: allPostsLast.map((post) => ({
                ...post,
                author: currentUser?.displayName,
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
        await Posts.findByIdAndDelete(postId);
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
        await Posts.deleteMany({ _id: { $in: postIds } });
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
}


export const userUpdatePost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.id !== req.params.userId) {
        return res.status(403).send({
            success: false,
            message: "You are not allowed to update this post",
        });
    }

    try {
        const updatedPost = await Posts.findByIdAndUpdate(req.params.postId, {
            $set: {
                title: req.body.title,
                content: req.body.content,
                category: req.body.category,
                thumbnail: req.body.thumbnail,
                slug: getSlug(req.body.title)
            }
        }, {new: true});
        return res.status(200).send({
            success: true,
            message: "Post updated successfully",
            updatedPost: {
                ...updatedPost,
                author: req.user?.displayName,
            }
            
        })
    } catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to update post",
        });
    }
}

export const adminUpdateStatusPost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    const status = req.body.status;

    try {
        const updatedPost = await Posts.findByIdAndUpdate(postId, { $set: { status } }, { new: true });
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
}