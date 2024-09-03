import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/verifyUser";
import Posts from "../../models/post/post.model";
import Users from "../../models/users/user.model";
import { getSlug } from "../../utils/utils";
import { ISortDirection } from "../users/users.controller";
import { IRequestStatus } from "../auth/auth.controller";

export const createNewPost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const existingPost = await Posts.findOne({ title: req.body.title });
        if (!!existingPost) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "title",
                message: "Tiêu đề đã tồn tại",
            });
        }

        const slug = getSlug(req.body.title);
        const newPost = new Posts({
            ...req.body,
            slug,
            author: req.user?.id,
        });

        const savedPost = (await newPost.save()).toObject();
        const formattedPost = await Posts.findById((savedPost._id as any).toString())
            .populate({ path: "author", select: "displayName email" })
            .lean();
        return res.status(201).send({
            requestStatus: IRequestStatus.Success,
            message: "Tạo bài viết thành công",
            data: {
                ...formattedPost,
            },
        });
    } catch (error: any) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
        });
    }
};

export const getAllPosts: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const allPosts = await Posts.find().populate({ path: "author", select: "displayName email" }).lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Thành công",
            data: allPosts,
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
        });
    }
};

export const getFilterPosts: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;

    const sortObject: Record<string, ISortDirection> = {};
    if (!!req.params.sort) {
        const sortInfo = (req.query.sort as string).split(" ");
        for (let i = 0; i < sortInfo.length; i = i + 2) {
            sortObject[sortInfo[i]] = sortInfo[i + 1] === "asc" ? ISortDirection.ASC : ISortDirection.DESC;
        }
    }

    const filterObject: Record<string, string | null | Object> = {};
    if (!!req.query.filter) {
        const filterInfo = (req.query.filter as string).split(" ");
        for (let i = 0; i < filterInfo.length; i = i + 2) {
            if (filterInfo[i] === "author") {
                const authorName = filterInfo[i + 1];
                const author = await Users.findOne({ displayName: authorName }).lean();
                if (!!author) {
                    filterObject["author"] = author._id;
                } else {
                    filterObject["author"] = null;
                }
            } else {
                filterObject[filterInfo[i]] = filterInfo[i + 1];
            }
        }
    }

    const searchText = req.query.search;
    if (searchText) {
        filterObject["title"] = { $regex: searchText, $options: "i" };
    }

    try {
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
            requestStatus: IRequestStatus.Success,
            message: "Thành công",
            data: posts,
            // totalPosts: totalPost,
            // lastMonthPosts: lastMonthPosts,
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
        });
    }
};

export const userSingleDeletePost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.id !== req.params.userId) {
        return res.status(404).send({
            requestStatus: IRequestStatus.Error,
            message: "Bạn không có quyền xóa bài viết này",
        });
    }
    try {
        await Posts.findByIdAndDelete(req.params.postId);
        const allPostsLast = await Posts.find()
            .populate({ path: "author", select: "displayName email" })
            .lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Xóa thành công",
            data: allPostsLast.map((post) => ({
                ...post,
            })),
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
        });
    }
};

export const adminSingleDeletePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    try {
        await Posts.findByIdAndDelete(postId)
        const allPostsLast = await Posts.find()
            .populate({ path: "author", select: "displayName email" })
            .lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Xóa thành công",
            data: allPostsLast.map((post) => ({
                ...post,
            })),
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
        });
    }
};

export const multipleDeletePosts: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const postIds: string[] = req.body.postIds;
    try {
        await Posts.deleteMany({ _id: { $in: postIds } })
        const allPostsLast = await Posts.find()
            .populate({ path: "author", select: "displayName email" })
            .lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: `Xóa ${postIds.length} bài viết thành công`,
            data: allPostsLast.map((post) => ({
                ...post,
            })),
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
        });
    }
};

export const userUpdatePost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.id !== req.params.userId) {
        return res.status(404).send({
            requestStatus: IRequestStatus.Error,
            message: "Bạn không có quyền cập nhật bài viết này",
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
            requestStatus: IRequestStatus.Success,
            message: "Cập nhật bài viết thành công",
            data: {
                ...formattedPost,
            },
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
        });
    }
};

export const adminUpdateStatusPost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    const status = req.body.status;

    if (!status) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            message: "Vui lòng lựa chọn trạng thái bài viết",
        });
    }

    try {
        await Posts.findByIdAndUpdate(postId, { $set: { status } }, { new: true });
        const allPosts = await Posts.find()
            .populate({ path: "author", select: "displayName email" })
            .lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Cập nhật trạng thái bài viết thành công",
            data: allPosts.map((post) => ({
                ...post,
            })),
        });
    } catch (error) {
        next(error);
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
        });
    }
};
