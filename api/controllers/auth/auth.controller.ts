import { NextFunction, Request, Response } from "express";
import Users, { IUserInfo } from "../../models/users/user.model";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../../utils/ErrorHandle";
import jwt from "jsonwebtoken";

enum IRegisterStatus {
    Success,
    Existing,
    Error,
}

export const registerNewUser = async (req: Request<{}, {}, Pick<IUserInfo, "email" | "displayName" | "password">>, res: Response, next: NextFunction) => {
    try {
        const { displayName, email, password } = req.body;
        const hashedPassword = bcryptjs.hashSync(password, 13);
        const existingUser = await Users.findOne({ email });

        if (!!existingUser) {
            return res.status(200).send({
                success: false,
                statusType: IRegisterStatus.Existing,
            });
        } else {
            const newUser = new Users({
                displayName,
                email,
                password: hashedPassword,
            });
            await newUser.save();
            return res.status(201).send({
                success: true,
                statusType: IRegisterStatus.Success,
            });
        }
    } catch (error: any) {
        return next(errorHandler(500, error.message));
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

export const userLogin = async (req: Request<{}, {}, Pick<IUserInfo, "email" | "password">>, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
        // next(errorHandler(400, "Email and password is required"));
        return res.status(400).send({
            success: false,
            message: "Email and password are required",
        });
    }

    try {
        const validUser = await Users.findOne({ email });
        if (!validUser) {
            return res.status(404).send({
                success: false,
                message: "User not found",
            })
        }

        const validPassword = bcryptjs.compareSync(password, validUser.password);
        if (!validPassword) {
            return res.status(401).send({
                success: false,
                message: "Password is incorrect",
            })
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("Token cannot be defined");
        }
        const token = jwt.sign({ id: validUser?._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        const {password: pass, ...rest} = validUser.toObject();
        return res.status(200).cookie("access_token", token, { httpOnly: true }).send({
            success: true,
            message: "Sign in successfully",
            userInfo: rest,
        });
    } catch (error: any) {
        return next(errorHandler(500, error.message));
    }
};
