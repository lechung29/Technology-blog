import { NextFunction, Request, RequestHandler, Response } from "express";
import Users, { IUserData, IUserInfo, userRole } from "../../models/users/user.model";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../../utils/ErrorHandle";
import jwt from "jsonwebtoken";

export enum IRequestStatus {
    Error,
    Success,
    Info,
}

export const registerNewUser: RequestHandler = async (req: Request<{}, {}, Pick<IUserData, "email" | "displayName" | "password">>, res: Response, next: NextFunction) => {
    const { displayName, email, password } = req.body;

    if (!email) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "email",
            message: "Tài khoản email là bắt buộc",
        });
    }

    if (!password) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "password",
            message: "Mật khẩu là bắt buộc",
        });
    }

    if (!displayName) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "displayName",
            message: "Tên hiển thị là bắt buộc",
        });
    }

    if (email) {
        const emailRegex =
            /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)$/;
        if (!email.match(emailRegex)) {
            return res.status(200).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "email",
                message: "Định dạng email không hợp lệ",
            });
        }
    }

    if (password) {
        if (password.length < 6) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "password",
                message: "Mật khẩu cần có ít nhất 6 ký tự",
            });
        }
        req.body.password = bcryptjs.hashSync(password, 13);
    }

    if (displayName) {
        if (displayName.length <= 3 || displayName.length > 14) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "displayName",
                message: "Tên hiển thị cần ít nhất 4 ký tự và tối đa 14 ký tự",
            });
        }
        if (displayName.includes(" ") || !displayName.match(/^[a-zA-Z0-9]+$/)) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "displayName",
                message: "Tên hiển thị không được chứa ký tự đặc biệt",
            });
        }
    }

    const existingUser = await Users.findOne({ email });

    if (!!existingUser) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "email",
            message: "Tài khoản email đã tồn tại",
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
            requestStatus: IRequestStatus.Success,
            message: "Đăng ký người dùng mới thành công",
        });
    } catch (error: any) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
        });
    }
};

export const userLogin: RequestHandler = async (req: Request<{}, {}, Pick<IUserData, "email" | "password">>, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "email",
            message: "Tài khoản email là bắt buộc",
        });;
    }

    if (!password) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "password",
            message: "Mật khẩu là bắt buộc",
        });
    }

    if (email) {
        const emailRegex =
            /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)$/;
        if (!email.match(emailRegex)) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "email",
                message: "Định dạng email không hợp lệ",
            });
        }
    }

    if (password) {
        if (password.length < 6) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "password",
                message: "Mật khẩu cần có ít nhất 6 ký tự",
            });
        }
    }

    const validUser = await Users.findOne({ email }).lean();
    if (!validUser) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "email",
            message: "Tài khoản email không tồn tại",
        });
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "password",
            message: "Mật khẩu không đúng",
        });
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("Token cannot be defined");
    }

    try {
        const accessToken = jwt.sign({id: validUser?._id}, process.env.JWT_SECRET);
        const {password, ...rest} = validUser!;
        return res.status(201).cookie("access_token", accessToken, { httpOnly: true, secure: false, sameSite: "strict" }).send({
            requestStatus: IRequestStatus.Success,
            message: "Đăng nhập thành công",
            data: {
                ...rest,
                accessToken: accessToken,
            }
        });
    } catch (error: any) {
        return res.status(500).send({
            success: IRequestStatus.Error,
            message: "Có lỗi mạng xảy ra, vui lòng chờ đợi trong giây lát",
        });
    }
};

export const googleAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { email, displayName, avatar} = req.body;
    try {
        const user = await Users.findOne({email}).lean();
        if (!process.env.JWT_SECRET) {
            throw new Error("Token cannot be defined");
        }
        if (user) {
            const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, { expiresIn: "1d" });
            const {password, ...rest} = user; 
            return res.status(200).cookie("access_token", token, { httpOnly: true }).send({
                requestStatus: IRequestStatus.Success,
                message: "Đăng nhập thành công",
                data: rest,
            });
        } else {
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
            const hashedPassword = bcryptjs.hashSync(generatedPassword, 10)
            const newUser = new Users({
                displayName: displayName.toLowerCase().split(" ").join(""),
                email: email,
                password: hashedPassword,
                avatar: avatar,
            })
            await newUser.save();
            const currentUser = await Users.findById((newUser._id as any).toString()).lean()
            const accessToken = jwt.sign({id: currentUser?._id}, process.env.JWT_SECRET);
            const {password, ...rest} = currentUser!;
            return res.status(201).cookie("access_token", accessToken, { httpOnly: true, secure: false, sameSite: "strict" }).send({
                requestStatus: IRequestStatus.Success,
                message: "Đăng nhập thành công",
                data: {
                    ...rest,
                    accessToken: accessToken,
                }
            });
        }
    } catch (error) {
        return res.status(500).send({
            success: IRequestStatus.Error,
            message: "Có lỗi khi đăng nhập bằng Google, vui lòng chờ đợi trong giây lát",
        });
    }
} 
