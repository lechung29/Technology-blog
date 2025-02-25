import { NextFunction, Request, RequestHandler, Response } from "express";
import Users, { IUserData, IUserInfo, userRole, userStatus } from "../../models/users/user.model";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import OTPs from "../../models/otp/otp.model";
import { signAccessToken, signRefreshToken } from "../../middlewares/verifyUser";
import RefreshTokens from "../../models/refreshToken/refreshToken.model";

export enum IRequestStatus {
    Error,
    Success,
    Info,
}

//#region register user

export const registerNewUser: RequestHandler = async (
    req: Request<{}, {}, Pick<IUserData, "email" | "displayName" | "password">>,
    res: Response,
    next: NextFunction
) => {
    const { displayName, email, password } = req.body;

    if (!email) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "email",
            message: "Error.Required.Email",
        });
    }

    if (!password) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "password",
            message: "Error.Required.Password",
        });
    }

    if (!displayName) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "displayName",
            message: "Error.Required.DisplayName",
        });
    }

    if (email) {
        const emailRegex =
            /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)$/;
        if (!email.match(emailRegex)) {
            return res.status(200).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "email",
                message: "Error.Invalid.Format.Email",
            });
        }
    }

    if (password) {
        if (password.length < 6) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "password",
                message: "Error.Min.Length.Password",
            });
        }
        req.body.password = bcryptjs.hashSync(password, 13);
    }

    if (displayName) {
        if (displayName.length <= 3 || displayName.length > 14) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "displayName",
                message: "Error.Min.Max.Length.DisplayName",
            });
        }
        if (!displayName.match(/^[a-zA-Z0-9]+$/)) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "displayName",
                message: "Error.Not.Allowed.Special.Character.DisplayName",
            });
        }
    }

    const existingUser = await Users.findOne({ email });

    if (!!existingUser) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "email",
            message: "Error.Existed.Email",
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
            message: "Successful.SignUp.User",
        });
    } catch (error: any) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region refresh token

export const refreshToken: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies?.refreshToken) {
        return res.status(200).send({
            code: 401,
            requestStatus: IRequestStatus.Error,
            message: "Error.Token.Expired",
        });
    }
    const token = await RefreshTokens.findOne({ token: req.cookies?.refreshToken });
    if (!token) {
        return res.status(200).send({
            code: 401,
            requestStatus: IRequestStatus.Error,
            message: "Error.Token.Expired",
        });
    }
    let tempUser: IUserInfo | undefined = undefined
    await jwt.verify(req.cookies?.refreshToken, process.env.JWT_REFRESH!, (err: any, user: any) => {
        if (err) {
            return res.status(200).send({
                code: 401,
                requestStatus: IRequestStatus.Error,
                message: "Error.Token.Expired",
            });
        }
        tempUser = user;
    });
    const accessToken = await signAccessToken(tempUser!._id as string, tempUser!.displayName)
    return res.status(200).send({
        accessToken
    })
}

//#region login user

export const userLogin: RequestHandler = async (req: Request<{}, {}, Pick<IUserData, "email" | "password">>, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "email",
            message: "Error.Required.Email",
        });
    }

    if (!password) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "password",
            message: "Error.Required.Password",
        });
    }

    if (email) {
        const emailRegex =
            /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)$/;
        if (!email.match(emailRegex)) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "email",
                message: "Error.Invalid.Format.Email",
            });
        }
    }

    if (password) {
        if (password.length < 6) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "password",
                message: "Error.Min.Length.Password",
            });
        }
    }

    const validUser = await Users.findOne({ email })
    if (!validUser) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "email",
            message: "Error.User.Not.Found",
        });
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "password",
            message: "Error.Incorrect.Password",
        });
    }

    if (validUser.status === userStatus.inactive) {
        return res.status(403).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "email",
            message: "Error.Account.Locked",
        });
    }

    try {
        const accessToken = await signAccessToken(validUser?._id as string, validUser?.displayName)
        const refreshToken = await signRefreshToken(validUser?._id as string, validUser?.displayName)
        const newRefreshToken = new RefreshTokens({
            token: refreshToken,
            userId: validUser?._id as string
        })
        await newRefreshToken.save()
        const { password, ...rest } = validUser.toObject();
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24
        })
        return res.status(201).send({
            requestStatus: IRequestStatus.Success,
            message: "Successful.SignIn.User",
            data: {
                ...rest,
                accessToken: accessToken,
            },
        });
    } catch (error: any) {
        return res.status(500).send({
            success: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region login with google

export const googleAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { email, displayName, avatar } = req.body;
    try {
        const user = await Users.findOne({ email });
        if (user) {
            if (user.status === userStatus.inactive) {
                return res.status(401).send({
                    requestStatus: IRequestStatus.Error,
                    fieldError: "email",
                    message: "Error.Account.Locked",
                });
            }
            const accessToken = await signAccessToken(user?._id as string, user?.displayName)
            const refreshToken = await signRefreshToken(user?._id as string, user?.displayName)
            const newRefreshToken = new RefreshTokens({
                token: refreshToken,
                userId: user?._id as string
            })
            await newRefreshToken.save()
            const { password, ...rest } = user!.toObject();
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 1000 * 60 * 60 * 24
            })
            return res.status(200).send({
                requestStatus: IRequestStatus.Success,
                message: "Successful.SignIn.User",
                data: {
                    ...rest,
                    accessToken: accessToken,
                },
            });
        } else {
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
            const newUser = new Users({
                displayName: displayName.toLowerCase().split(" ").join(""),
                email: email,
                password: hashedPassword,
                avatar: avatar,
            });
            await newUser.save();
            const currentUser = await Users.findById((newUser._id as any).toString());
            const accessToken = await signAccessToken(currentUser?._id as string, currentUser!.displayName)
            const refreshToken = await signRefreshToken(currentUser?._id as string, currentUser!.displayName)
            const newRefreshToken = new RefreshTokens({
                token: refreshToken,
                userId: currentUser?._id as string
            })
            await newRefreshToken.save()
            const { password, ...rest } = currentUser!.toObject();
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 1000 * 60 * 60 * 24
            })
            return res.status(201).send({
                requestStatus: IRequestStatus.Success,
                message: "Successful.SignIn.User",
                data: {
                    ...rest,
                    accessToken: accessToken,
                },
            });
        }
    } catch (error) {
        console.log(error)
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Google",
        });
    }
};

//#region logout user

export const logout: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.body;
    res.clearCookie("refreshToken")
    await RefreshTokens.findOneAndDelete({ token: req.cookies?.refreshToken, userId });
    return res.json({})
}

//#region send otp

export const sendOTP: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (email) {
        const emailRegex =
            /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)$/;
        if (!email.match(emailRegex)) {
            return res.status(400).send({
                requestStatus: IRequestStatus.Error,
                fieldError: "email",
                message: "Error.Invalid.Format.Email",
            });
        }
    }

    const validUser = await Users.findOne({ email }).lean();
    if (!validUser) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "email",
            message: "Error.User.Not.Found",
        });
    }

    const existingOtp = await OTPs.findOne({ userEmail: email }).lean();
    if (existingOtp) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Send.Otp.Successful",
        });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MY_EMAIL,
                pass: process.env.MY_PASSWORD,
            },
        });

        const OTP = Math.floor(Math.random() * 9000 + 1000);

        const mail_configs = {
            from: process.env.MY_EMAIL,
            to: email,
            subject: "[NO-REPLY] DEVBLOG PASSWORD RECOVERY",
            html: `<!DOCTYPE html>
      <html lang="en" >
      <head>
        <meta charset="UTF-8">
        <title>Devblog - OTP Email Template</title>
      </head>
      <body>
      <!-- partial:index.partial.html -->
      <div style="font-family: Helvetica,Arial,sans-serif;overflow:auto;line-height:2">
        <div style="margin:15px auto;width:70%;padding:20px 0">
          <p>Thank you for choosing Devblog. Use the following OTP to complete your Password Recovery Procedure. OTP is valid for 5 minutes</p>
          <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
        </div>
      </div>
      <!-- partial -->
        
      </body>
      </html>`,
        };

        transporter.sendMail(mail_configs, async function (error, info) {
            if (error) {
                return res.status(500).send({
                    requestStatus: IRequestStatus.Error,
                    message: "Error.Network",
                });
            }
            const newOtp = new OTPs({
                otpCode: OTP,
                userEmail: email,
            });

            await newOtp.save();

            return res.status(200).send({
                requestStatus: IRequestStatus.Success,
                message: "Send.Otp.Successful",
            });
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region resend otp

export const resendOTP: RequestHandler = async (req: Request, res: Response) => {
    const { email } = req.body;
    try {
        await OTPs.findOneAndDelete({ userEmail: email });
        const OTP = Math.floor(Math.random() * 9000 + 1000);

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MY_EMAIL,
                pass: process.env.MY_PASSWORD,
            },
        });
        const mail_configs = {
            from: process.env.MY_EMAIL,
            to: email,
            subject: "[NO-REPLY] DEVBLOG PASSWORD RECOVERY",
            html: `<!DOCTYPE html>
      <html lang="en" >
      <head>
        <meta charset="UTF-8">
        <title>Devblog - OTP Email Template</title>
      </head>
      <body>
      <!-- partial:index.partial.html -->
      <div style="font-family: Helvetica,Arial,sans-serif;overflow:auto;line-height:2">
        <div style="margin:15px auto;width:70%;padding:20px 0">
          <p>Thank you for choosing Devblog. Use the following OTP to complete your Password Recovery Procedure. OTP is valid for 5 minutes</p>
          <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
        </div>
      </div>
      <!-- partial -->
        
      </body>
      </html>`,
        };

        transporter.sendMail(mail_configs, async function (error, info) {
            if (error) {
                return res.status(500).send({
                    requestStatus: IRequestStatus.Error,
                    message: "Error.Network",
                });
            }
            const newOtp = new OTPs({
                otpCode: OTP,
                userEmail: email,
            });

            await newOtp.save();

            return res.status(200).send({
                requestStatus: IRequestStatus.Success,
                message: "Send.Otp.Successful",
            });
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region verify otp

export const verifyOTP: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;

    try {
        const validOtp = await OTPs.findOne({ userEmail: email }).lean();
        if (!validOtp) {
            return res.status(200).send({
                requestStatus: IRequestStatus.Error,
                message: "Expired.Otp",
            });
        }

        if (validOtp.otpCode !== otp) {
            return res.status(200).send({
                requestStatus: IRequestStatus.Error,
                message: "Verify.Otp.Fails",
            });
        }

        return res.status(200).send({
            requestStatus: IRequestStatus.Success,
            message: "Verify.Otp.Successful",
        });
    } catch (error) {
        return res.status(500).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};

//#region reset password

export const resetPassword: RequestHandler = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const validUser = await Users.findOne({ email: email }).lean();
    if (!validUser) {
        return res.status(200).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "email",
            message: "Error.User.Not.Found",
        });
    }

    if (password && password.length < 6) {
        return res.status(400).send({
            requestStatus: IRequestStatus.Error,
            fieldError: "newPassword",
            message: "Error.Min.Length.Password",
        });
    }

    req.body.password = bcryptjs.hashSync(req.body.password, 13);

    try {
        await Users.findOneAndUpdate(
            {
                email: email,
            },
            {
                $set: {
                    password: req.body.password,
                },
            },
            { new: true }
        )
            .lean()
            .exec();
        await OTPs.findOneAndDelete({ userEmail: email });
        
        return res.status(200).send({
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
