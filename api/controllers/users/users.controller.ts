import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/verifyUser";
import bcryptjs from "bcryptjs";
import Users from "../../models/users/user.model";
import Posts from "../../models/post/post.model";
import { IRequestStatus } from "../auth/auth.controller";

export enum ISortDirection {
    ASC = 1,
    DESC = -1,
}

export const getAllUsers: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.body.page as string) || 1;
    const limit = parseInt(req.body.limit as string) || 9;

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
            filterObject[filterInfo[i]] = filterInfo[i + 1];
        }
    }

    const searchText = req.body.search;
    if (searchText) {
        filterObject["displayName"] = { $regex: searchText, $options: "i" };
    }
    try {
        const allUsers = await Users.find(filterObject)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort(sortObject)
            .select("-password")
            .lean()
            .exec();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Thành công",
            data: allUsers,
        });
    } catch (error: any) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Thất bại",
        });
    }
};

export const getTotalUsers: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalUsers = await Users.countDocuments({});
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Thành công",
            data: totalUsers,
        });
    } catch (error: any) {
        next(error);
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Thất bại",
        });
    }
};

export const getUserById: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await Users.findById(req.params.userId).select("-password").lean().exec();
        if (!user) {
            return res.status(200).send({
                requestStatus: IRequestStatus.Error,
                message: "Không tìm thấy người dùng",
            });
        }
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Thành công",
            data: {
                ...user,
            },
        });
    } catch (error: any) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Thất bại",
        });
    }
};

export const updateUserInfo: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.id !== req.params.userId) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Bạn không có quyền cập nhật thông tin người dùng này",
        });
    }

    if (req.body.email) {
        const emailRegex =
            /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)$/;
        if (!req.body.email.match(emailRegex)) {
            return res.status(200).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "email",
                message: "Định dạng email không hợp lệ",
            });
        }
    }

    if (req.body.password) {
        if (req.body.password.length < 6) {
            return res.status(200).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "password",
                message: "Mật khẩu cần có ít nhất 6 ký tự",
            });
        }
        req.body.password = bcryptjs.hashSync(req.body.password, 13);
    }

    if (req.body.displayName) {
        if (req.body.displayName.length <= 3 || req.body.displayName.length > 14) {
            return res.status(200).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "displayName",
                message: "Tên hiển thị cần ít nhất 4 ký tự và tối đa 14 ký tự",
            });
        }
        if (req.body.displayName.includes(" ") || !req.body.displayName.match(/^[a-zA-Z0-9]+$/)) {
            return res.status(200).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "displayName",
                message: "Tên hiển thị không được chứa ký tự đặc biệt",
            });
        }
    }

    if (req.body.phoneNumber) {
        if (!req.body.phoneNumber.match(/^0\d{9}$/)) {
            return res.status(200).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "phoneNumber",
                message: "Định dạng số điện thoại không hợp lệ",
            });
        }
    }

    try {
        const updatedUser = await Users.findByIdAndUpdate(
            req.params.userId,
            {
                $set: {
                    email: req.body.email,
                    displayName: req.body.displayName,
                    phoneNumber: req.body.phoneNumber,
                    password: req.body.password,
                },
            },
            { new: true }
        )
            .lean()
            .exec();
        if (!updatedUser) {
            return res.status(200).send({
                requestStatus: IRequestStatus.Error,
                message: "Người dùng không tồn tại"
            });
        }
        const { password, ...rest } = updatedUser;
        res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Cập nhật thông tin người dùng thành công",
            data: rest,
        });
    } catch (error) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng thử lại trong giây lát",
        });
    }
};

export const deleteSingleUser: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    try {
        await Users.findByIdAndDelete(userId).exec();
        await Posts.deleteMany({ author: userId });
        const remainingUsers = await Users.find({}).select("-password").lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Xóa người dùng thành công",
            data: remainingUsers,
        });
    } catch (error: any) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng thử lại trong giây lát",
        });
    }
};

export const deleteMultipleUsers: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const userIds: string[] = req.body.userIds;
    try {
        await Users.deleteMany({ _id: { $in: userIds } }).exec();
        const remainingUsers = await Users.find({}).select("-password").lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: `Xóa ${userIds.length} người thành công`,
            data: remainingUsers,
        });
    } catch (error: any) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng thử lại trong giây lát",
        });
    }
};

export const userLogout: RequestHandler = (_req: Request, res: Response, next: NextFunction) => {
    try {
        return res.clearCookie("access_token").status(200).json({
            requestStatus: IRequestStatus.Success,
            message: `Đăng xuất thành công`,
        });
    } catch (error: any) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng thử lại trong giây lát",
        });
    }
};
