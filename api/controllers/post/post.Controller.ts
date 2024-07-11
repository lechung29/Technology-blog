import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/verifyUser";
import Posts from "../../models/post/post.model";

export const createNewPost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.body.title || !req.body.content || !req.body.category) {
        return res.status(400).send({
            success: false,
            message: "Title and content are required",
        });
    }

    const slug = req.body.title
        .split(" ")
        .join("-")
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-]/g, "-");
    const newPost = new Posts({
        ...req.body,
        slug,
        author: req.user?.id,
    });

    try {
        const savedPost = await newPost.save();
        return res.status(201).send({
            success: true,
            message: "Post created successfully. Please wait admin approval",
            post: savedPost,
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
        const sortInfo = req.query.order === 'asc' ? 1 : -1;

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
                { title: { $regex: req.query.searchTerm, $options: 'i' } },
                { content: { $regex: req.query.searchTerm, $options: 'i' } }
            ];
        }
        const posts = await Posts.find(
            // {
            // ...(req.query.category && {category: req.query.category}),
            // ...(req.query.slug && {slug: req.query.slug}),
            // ...(req.query.postId && {_id: req.query.postId}),
            // ...(req.query.searchTerm && {
            //     $or: [
            //         {title: { $regex: req.query.searchTerm, $options: 'i'}},
            //         {content: { $regex: req.query.searchTerm, $options: 'i'}}
            //     ]
            // })}
            query
    ).sort({ updatedAt: sortInfo}).skip(startIndex).limit(limit)

    const totalPost = await Posts.countDocuments();
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const lastMonthPosts = await Posts.countDocuments({ createdAt: { $gte: lastMonth } });

    return res.status(200).send({
        success: true,
        message: "Get all posts successfully",
        allPosts: posts,
        totalPosts: totalPost,
        lastMonthPosts: lastMonthPosts,
    })
    } catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to get all posts",
        });
    }
}