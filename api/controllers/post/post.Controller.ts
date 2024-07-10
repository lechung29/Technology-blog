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