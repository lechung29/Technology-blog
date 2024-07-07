import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/verifyUser";
import { errorHandler } from "../../utils/ErrorHandle";
import bcryptjs from "bcryptjs";
import Users from "../../models/users/user.model";

export const getAllUsers: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const allUsers = await Users.find({});
        return res.status(200).send({
            success: true,
            message: "Get all users successfully",
            data: allUsers,
        });
    } catch (error: any) {
        next(error);
        return res.status(500).send({
            success: false,
            message: error.message,
        });
    }
};

export const getUserById: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await Users.findById(req.params.userId);
        return res.status(200).send({
            success: true,
            message: "Get user by id successfully",
            user: user,
        });
    } catch (error: any) {
        next(error);
        return res.status(500).send({
            success: false,
            message: error.message,
        });
    }
};

export const updateUserInfo: RequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.id !== req.params.userId) {
        return res.status(403).send({
            success: false,
            message: "You are not allowed to update this user",
        });
    }

    if (req.body.email) {
        const emailRegex =
            /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)$/;
        if (!req.body.email.match(emailRegex)) {
            return res.status(400).send({
                success: false,
                message: "Invalid email format",
            });
        }
    }

    if (req.body.password) {
        if (req.body.password.length < 6) {
            return res.status(400).send({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }
        req.body.password = bcryptjs.hashSync(req.body.password, 13);
    }

    if (req.body.displayName) {
        if (req.body.displayName.length <= 3 || req.body.displayName.length >= 15) {
            return res.status(400).send({
                success: false,
                message: "Display name must be between 4 and 14 characters",
            });
        }
        if (req.body.displayName.includes(" ") || !req.body.displayName.match(/^[a-zA-Z0-9]+$/)) {
            return res.status(400).send({
                success: false,
                message: "Display name cannot contain spaces and special characters",
            });
        }
    }

    if (req.body.phoneNumber) {
        if (!req.body.phoneNumber.match(/^0\d{9}$/)) {
            return res.status(400).send({
                success: false,
                message: "Invalid phone number format",
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
        );
        if (!updatedUser) {
            return res.status(400).send({
                success: false,
                message: "User not found",
            });
        }
        const { password, ...rest } = updatedUser.toObject();
        res.status(200).send({
            success: true,
            message: "User updated successfully",
            updatedUser: rest,
        });
    } catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to update user",
        });
    }
};

export const deleteSingleUser: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    try {
        await Users.findByIdAndDelete(userId);
        return res.status(200).send({
            success: true,
            message: "Deleted user successfully",
        });
    } catch (error: any) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to delete user",
        });
    }
};

export const deleteMultipleUsers: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const userIds: string[] = req.body.userIds;
    try {
        await Users.deleteMany({ _id: { $in: userIds } });
        return res.status(200).send({
            success: true,
            message: `Deleted ${userIds.length} users successfully`,
        });
    } catch (error: any) {
        next(error);
        return res.status(500).send({
            success: false,
            message: `Failed to delete ${userIds.length} users`,
        });
    }
};

export const userLogout: RequestHandler = (_req: Request, res: Response, next: NextFunction) => {
    try {
        return res.clearCookie("access_token").status(200).json({ 
            success: true,
            message: "Sign out successfully"
        });
    } catch (error: any) {
        next(error);
        return res.status(500).send({
            success: false,
            message: error.message,
        });
    }
};
