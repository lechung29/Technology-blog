import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/verifyUser";
import bcryptjs from "bcryptjs";
import Users from "../../models/users/user.model";
import { IRequestStatus } from "../auth/auth.controller";

export enum ISortDirection {
    ASC = 1,
    DESC = -1,
}

//#region get all users data

export const getAllUsers: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const allUsers = await Users.find().select("-password").lean();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Get.All.User",
            data: allUsers,
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region get total count of users

export const getTotalUsers: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalUsers = await Users.countDocuments({});
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Get.All.User",
            data: totalUsers,
        });
    } catch (error: any) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region get user by id

export const getUserById: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await Users.findById(req.params.userId).select("-password").lean().exec();
        if (!user) {
            return res.status(404).send({
                requestStatus: IRequestStatus.Error,
                message: "Error.User.Not.Found",
            });
        }
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Get.Single.User",
            data: {
                ...user,
            },
        });
    } catch (error: any) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region update user info

export const updateUserInfo: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.id !== req.params.userId) {
        return res.status(403).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.User.Not.Allowed.Access",
        });
    }

    if (req.body.displayName) {
        if (req.body.displayName.length <= 3 || req.body.displayName.length > 14) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "displayName",
                message: "Error.Min.Max.Length.DisplayName",
            });
        }
        if (req.body.displayName.includes(" ") || !req.body.displayName.match(/^[a-zA-Z0-9]+$/)) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "displayName",
                message: "Error.Not.Allowed.Special.Character.DisplayName",
            });
        }
    }

    if (req.body.email) {
        const emailRegex =
            /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)$/;
        if (!req.body.email.match(emailRegex)) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "email",
                message: "Error.Invalid.Email.Format",
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
                    avatar: req.body.avatar,
                },
            },
            { new: true }
        )
            .lean()
            .exec();
        if (!updatedUser) {
            return res.status(404).send({
                requestStatus: IRequestStatus.Error,
                message: "Error.User.Not.Found",
            });
        }
        const { password, ...rest } = updatedUser;
        res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Update.User.Info",
            data: rest,
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region update password user

export const updatePassword: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body;
    if (req.user?.id !== req.params.userId) {
        return res.status(403).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.User.Not.Allowed.Access",
        });
    }

    const validUser = await Users.findById(req.user?.id).lean();
    if (!validUser) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "email",
            message: "Error.User.Not.Found",
        });
    }

    const validPassword = bcryptjs.compareSync(currentPassword, validUser.password);
    if (!validPassword) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "currentPassword",
            message: "Error.Incorrect.Password",
        });
    }

    if (newPassword) {
        if (newPassword.length < 6) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "newPassword",
                message: "Error.Min.Length.Password",
            });
        }
    }

    req.body.newPassword = bcryptjs.hashSync(req.body.newPassword, 13);

    try {
        const updatedUser = await Users.findByIdAndUpdate(
            req.params.userId,
            {
                $set: {
                    password: req.body.newPassword,
                },
            },
            { new: true }
        )
            .lean()
            .exec();
        if (!updatedUser) {
            return res.status(404).send({
                requestStatus: IRequestStatus.Error,
                message: "Error.User.Not.Found",
            });
        }
        res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.Update.Password",
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region update user status

export const adminUpdateUserStatus: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.params.userId;
    const status = req.body.status;

    if (!status) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            message: "Vui lòng lựa chọn trạng thái người dùng",
        });
    }

    try {
        await Users.findByIdAndUpdate(userId, { $set: { status } }, { new: true }).exec();
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Error.User.Choose.Status",
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
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
            message: "Successful.Delete.User",
            data: remainingUsers,
        });
    } catch (error: any) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};
