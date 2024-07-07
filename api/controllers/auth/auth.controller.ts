import { NextFunction, Request, RequestHandler, Response } from "express";
import Users, { IUserInfo } from "../../models/users/user.model";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../../utils/ErrorHandle";
import jwt from "jsonwebtoken";

enum IRegisterStatus {
    Success,
    Existing,
    Error,
}

export const registerNewUser: RequestHandler = async (req: Request<{}, {}, Pick<IUserInfo, "email" | "displayName" | "password">>, res: Response, next: NextFunction) => {
    const { displayName, email, password } = req.body;

    if (!email) {
        return res.status(400).send({
            success: false,
            statusType: IRegisterStatus.Error,
            message: "Email is required",
        });
    }

    if (!password) {
        return res.status(400).send({
            success: false,
            statusType: IRegisterStatus.Error,
            message: "Password is required",
        });
    }

    if (!displayName) {
        return res.status(400).send({
            success: false,
            statusType: IRegisterStatus.Error,
            message: "Display name is required",
        });
    }

    if (email) {
        const emailRegex =
            /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)$/;
        if (!email.match(emailRegex)) {
            return res.status(400).send({
                success: false,
                statusType: IRegisterStatus.Error,
                message: "Invalid email format",
            });
        }
    }

    if (password) {
        if (password.length < 6) {
            return res.status(400).send({
                success: false,
                statusType: IRegisterStatus.Error,
                message: "Password must be at least 6 characters",
            });
        }
        req.body.password = bcryptjs.hashSync(password, 13);
    }

    if (displayName) {
        if (displayName.length <= 3 || displayName.length > 14) {
            return res.status(400).send({
                success: false,
                statusType: IRegisterStatus.Error,
                message: "Display name must be between 4 and 14 characters",
            });
        }
        if (displayName.includes(" ") || !displayName.match(/^[a-zA-Z0-9]+$/)) {
            return res.status(400).send({
                success: false,
                statusType: IRegisterStatus.Error,
                message: "Display name cannot contain spaces and special characters",
            });
        }
    }

    const existingUser = await Users.findOne({ email });

    if (!!existingUser) {
        return res.status(200).send({
            success: false,
            statusType: IRegisterStatus.Existing,
            message: "This user email already exists",
        });
    }
    const newUser = new Users({
        displayName,
        email,
        password: req.body.password,
    });

    try {
        await newUser.save();
        return res.status(201).send({
            success: true,
            statusType: IRegisterStatus.Success,
            message: "Registered new user successfully",
        });
    } catch (error: any) {
        next(errorHandler(500, error.message));
        return res.status(500).send({
            success: false,
            statusType: IRegisterStatus.Error,
            message: "Somethings went wrong",
        });
        // if (error instanceof Error) {
        //     res.status(500).send({
        //         success: false,
        //         statusType: IRegisterStatus.Error,
        //         message: error.message,
        //     });
        // } else {
        //     res.status(500).send({
        //         success: false,
        //         statusType: IRegisterStatus.Error,
        //         message: "Somethings went wrong",
        //     });
        // }
    }
};

export const userLogin: RequestHandler = async (req: Request<{}, {}, Pick<IUserInfo, "email" | "password">>, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(400).send({
            success: false,
            statusType: IRegisterStatus.Error,
            message: "Email is required",
        });
    }

    if (!password) {
        return res.status(400).send({
            success: false,
            statusType: IRegisterStatus.Error,
            message: "Password is required",
        });
    }

    if (email) {
        const emailRegex =
            /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)$/;
        if (!email.match(emailRegex)) {
            return res.status(400).send({
                success: false,
                message: "Invalid email format",
            });
        }
    }

    if (password) {
        if (password.length < 6) {
            return res.status(400).send({
                success: false,
                statusType: IRegisterStatus.Error,
                message: "Password must be at least 6 characters",
            });
        }
    }

    const validUser = await Users.findOne({ email });
    if (!validUser) {
        return res.status(404).send({
            success: false,
            message: "Email is not existed",
        });
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
        return res.status(401).send({
            success: false,
            message: "Password is incorrect",
        });
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("Token cannot be defined");
    }

    try {
        const token = jwt.sign({ id: validUser?._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        const { password: pass, ...rest } = validUser.toObject();
        return res.status(200).cookie("access_token", token, { httpOnly: true }).send({
            success: true,
            message: "Sign in successfully",
            userInfo: rest,
        });
    } catch (error: any) {
        next(errorHandler(500, error.message));
        return res.status(500).send({
            success: false,
            message: "Somethings went wrong",
        });
    }
};
