import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/verifyUser";
import Posts from "../../models/post/post.model";
import Users, { defaultAvatar } from "../../models/users/user.model";
import { getMonth, getSlug } from "../../utils/utils";
import { ISortDirection } from "../users/users.controller";
import { IRequestStatus } from "../auth/auth.controller";
import Comments from "../../models/comment/comment.model";
import Favorites from "../../models/favorite/favorite.model";
import mongoose from "mongoose";

//#region create a post

export const createNewPost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const existingPost = await Posts.findOne({ title: req.body.title });
        if (!!existingPost) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "title",
                message: "Error.Post.Title.Existed",
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
            message: "Successful.Create.Post",
            data: {
                ...formattedPost,
            },
        });
    } catch (error: any) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region get all post not filter

export const getAllPosts: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const allPosts = await Posts.find().populate({ path: "author", select: "displayName email" }).lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Get.Post",
            data: allPosts,
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region get filter post

export const getFilterPosts: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;

    const sortObject: Record<string, ISortDirection> = {};
    if (!!req.query.sort) {
        const sortInfo = (req.query.sort as string).split(" ");
        for (let i = 0; i < sortInfo.length; i = i + 2) {
            if (sortInfo[i] === "like") {
                sortObject["totalLikes"] = sortInfo[i + 1] === "asc" ? ISortDirection.ASC : ISortDirection.DESC;
            } else if (sortInfo[i] === "comment") {
                sortObject["totalComments"] = sortInfo[i + 1] === "asc" ? ISortDirection.ASC : ISortDirection.DESC;
            } else {
                sortObject[sortInfo[i]] = sortInfo[i + 1] === "asc" ? ISortDirection.ASC : ISortDirection.DESC;
            }
        }
    } else {
        sortObject["createdAt"] = ISortDirection.DESC;
    }

    const filterObject: Record<string, string | null | Object> = {};
    let filterTagsName: string[] = [];
    let filterCategory: string[] = [];
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
            } else if (filterInfo[i] === "tags") {
                filterTagsName.push(filterInfo[i + 1]);
            } else if (filterInfo[i] === "category") {
                filterCategory.push(filterInfo[i + 1]);
            } else {
                filterObject[filterInfo[i]] = filterInfo[i + 1];
            }
        }

        filterObject["tags"] = { $in: filterTagsName.map((tag) => new RegExp(`^${tag}$`, "i")) };
        filterObject["category"] = { $in: filterCategory };

        if (!filterInfo.includes("tags")) {
            delete filterObject["tags"];
        }

        if (!filterInfo.includes("category")) {
            delete filterObject["category"];
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
            .populate({ path: "author", select: "displayName email avatar" })
            .lean()
            .exec();

        const postId = posts.map((post) => post._id);

        const allFavorite = await Favorites.find({ post: { $in: postId } })
            .lean()
            .exec();

        const allPostComments = await Comments.find().populate({ path: "commentator", select: "displayName email avatar" }).lean();

        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Get.Post",
            data: posts.map((post) => {
                return {
                    ...post,
                    totalFavorites: allFavorite.filter((item) => item.post.toString() === post._id.toString()).length,
                    comments: allPostComments.filter((comment) => comment.post.toString() === post._id.toString()),
                };
            }),
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region get single post

export const getSinglePost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    const userId = req.params.userId;
    try {
        const post = await Posts.findById(postId).populate({ path: "author", select: "displayName email avatar" }).lean();
        const favorites = await Favorites.find({ post: postId }).lean();
        const isAddFavorite = favorites.find((item) => item.user.toString() === userId);
        const allPostComments = await Comments.find({ post: postId }).populate({ path: "commentator", select: "displayName email avatar" }).lean();
        if (!post) {
            return res.status(404).send({
                requestStatus: IRequestStatus.Error,
                message: "Error.Post.Not.Found",
            });
        } else {
            return res.status(200).send({
                requestStatus: IRequestStatus.Success,
                message: "Successful.Get.Post",
                data: {
                    ...post,
                    isLike: post.like.includes(userId),
                    isFavorite: !!isAddFavorite,
                    comments: allPostComments.map((comment) => {
                        return {
                            ...comment,
                            isLike: comment.like.includes(userId),
                        };
                    }),
                },
            });
        }
    } catch (error: any) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            serverError: error.message,
            message: "Error.Network",
        });
    }
};

//#region get max page of post category with filter

export const getMaxPages: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const limit = parseInt(req.query.limit as string) || 9;
    const filterObject: Record<string, string | null | Object> = {};

    let filterTagsName: string[] = [];
    let filterCategory: string[] = [];
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
            } else if (filterInfo[i] === "tags") {
                filterTagsName.push(filterInfo[i + 1]);
            } else if (filterInfo[i] === "category") {
                filterCategory.push(filterInfo[i + 1]);
            } else {
                filterObject[filterInfo[i]] = filterInfo[i + 1];
            }
        }

        filterObject["tags"] = { $in: filterTagsName.map((tag) => new RegExp(`^${tag}$`, "i")) };
        filterObject["category"] = { $in: filterCategory };

        if (!filterInfo.includes("tags")) {
            delete filterObject["tags"];
        }

        if (!filterInfo.includes("category")) {
            delete filterObject["category"];
        }
    }

    const searchText = req.query.search;
    if (searchText) {
        filterObject["title"] = { $regex: searchText, $options: "i" };
    }

    try {
        const totalPostsByFilter = await Posts.find(filterObject).countDocuments({});

        const maxPages = Math.ceil(totalPostsByFilter / limit);

        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Get.MaxPage",
            data: maxPages,
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region user delete post

export const userSingleDeletePost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.id !== req.params.userId) {
        return res.status(404).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Post.Not.Allowed.Delete",
        });
    }
    try {
        await Comments.deleteMany({ post: req.params.postId }).exec();
        await Posts.findByIdAndDelete(req.params.postId).exec();
        const allPostsLast = await Posts.find({ author: req.user?.id }).populate({ path: "author", select: "displayName email" }).lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Delete.Post",
            data: allPostsLast.map((post) => ({
                ...post,
            })),
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region admin delete a post

export const adminSingleDeletePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    try {
        await Comments.deleteMany({ post: postId }).exec();
        await Posts.findByIdAndDelete(postId);
        const allPostsLast = await Posts.find().populate({ path: "author", select: "displayName email" }).lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Delete.Post.Success",
            data: allPostsLast.map((post) => ({
                ...post,
            })),
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region admin delete multi post

export const multipleDeletePosts: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const postIds: string[] = req.body.postIds;
    try {
        await Comments.deleteMany({ post: { $in: postIds } }).exec();
        await Posts.deleteMany({ _id: { $in: postIds } }).exec();
        const allPostsLast = await Posts.find().populate({ path: "author", select: "displayName email" }).lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Delete.Post.Success",
            data: allPostsLast.map((post) => ({
                ...post,
            })),
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region user update post

export const userUpdatePost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.id !== req.params.userId) {
        return res.status(404).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Post.Not.Allowed",
        });
    }

    try {
        const existingPost = await Posts.findOne({ title: req.body.title });
        if (!!existingPost) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "title",
                message: "Error.Post.Title.Existed",
            });
        }

        const updatedPost = await Posts.findByIdAndUpdate(
            req.params.postId,
            {
                $set: {
                    title: req.body.title,
                    content: req.body.content,
                    category: req.body.category,
                    thumbnail: req.body.thumbnail,
                    tags: req.body.tags,
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
            message: "Successful.Update.Post",
            data: {
                ...formattedPost,
            },
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region like post

export const likePost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const post = await Posts.findById(req.params.postId);
        if (!post) {
            return res.status(404).send({
                requestStatus: IRequestStatus.Error,
                message: "Error.Post.Not.Found",
            });
        }

        const userIndex = post.like.indexOf(req.user?.id);
        let message: string;

        if (userIndex === -1) {
            post.like.push(req.user?.id);
            post.totalLikes += 1;
            message = "Successful.Like.Post";
        } else {
            post.like.splice(userIndex, 1);
            post.totalLikes -= 1;
            message = "Successful.Dislike.Post";
        }

        await post.save();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: message,
        });
    } catch (error: any) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region admin update status post

export const adminUpdateStatusPost: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    const status = req.body.status;

    if (!status) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Post.Choose.Status",
        });
    }

    try {
        await Posts.findByIdAndUpdate(postId, { $set: { status } }, { new: true });
        const allPosts = await Posts.find().populate({ path: "author", select: "displayName email" }).lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Update.Post",
            data: allPosts.map((post) => ({
                ...post,
            })),
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region get all tags

export const getAllTags: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const allPosts = await Posts.find({}).lean();
        const allTags = allPosts.flatMap((post) => post.tags);
        const setTags = new Set<string>();
        const uniqueTags = allTags
            .filter((tag) => {
                const lowerTag = tag.toLowerCase();
                if (setTags.has(lowerTag)) {
                    return false;
                }
                setTags.add(lowerTag);
                return true;
            })
            .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase());
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Get.Post.TagList",
            data: uniqueTags,
        });
    } catch (error: any) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region get user overview

export const getOverViewUser: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    if (req.user?.id !== userId) {
        return res.status(404).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Post.Not.Allowed",
        });
    }

    const currentYear = new Date().getFullYear();
    try {
        //#region get total of user's posts
        const postCount = await Posts.countDocuments({ author: userId });

        //#region get total like of user's posts
        const allUserPosts = await Posts.find({ author: userId }).lean()
        const totalLikes = allUserPosts.reduce((sum, post) => sum + post.totalLikes, 0);

        //#region get total post of user in current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(1);
        endOfMonth.setHours(0, 0, 0, 0);

        const postCountByCurrentMonth = await Posts.countDocuments({
            author: userId,
            createdAt: {
                $gte: startOfMonth,
                $lt: endOfMonth,
            },
        });

        //#region get post count by month of current year
        const postCountsByMonth = await Posts.aggregate([
            {
                $match: {
                    author: new mongoose.Types.ObjectId(userId),
                    createdAt: {
                        $gte: new Date(currentYear, 0, 1),
                        $lt: new Date(currentYear + 1, 0, 1),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" },
                    },
                    post: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.month": 1 },
            },
        ]);

        const postByMonth = Array.from({ length: 12 }, (_, index) => {
            const monthData = postCountsByMonth.find((item) => item._id.month === index + 1);
            return { month: getMonth(index + 1), post: monthData ? monthData.post : 0 };
        });



        //#region get post count by category

        const postCountsByCategory = await Posts.aggregate([
            {
                $match: {
                    author: new mongoose.Types.ObjectId(userId), 
                },
            },
            {
                $group: {
                    _id: "$category",
                    postCount: { $sum: 1 },
                },
            },
            {
                $sort: { postCount: -1 },
            },
        ]);

        const formattedPostCountsByCategory = postCountsByCategory.map((post, key) => ({
            id: key,
            value: post.postCount,
            label: post._id
        }))

        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Get.Post.Data",
            data: {
                totalPosts: postCount,
                postInCurrentMonth: postCountByCurrentMonth,
                totalLikes: totalLikes,
                postByMonth: postByMonth,
                postByCategory: formattedPostCountsByCategory
            }
        })
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};
