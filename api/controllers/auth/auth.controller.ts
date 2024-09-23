import { NextFunction, Request, RequestHandler, Response } from "express";
import Users, { IUserData, IUserInfo, userRole, userStatus } from "../../models/users/user.model";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

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

    const validUser = await Users.findOne({ email }).lean();
    if (!validUser) {
        return res.status(200).send({
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

    if (!process.env.JWT_SECRET) {
        throw new Error("Token cannot be defined");
    }

    try {
        const accessToken = jwt.sign({ id: validUser?._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        const { password, ...rest } = validUser!;
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
        const user = await Users.findOne({ email }).lean();
        if (!process.env.JWT_SECRET) {
            throw new Error("Token cannot be defined");
        }
        if (user) {
            if (user.status === userStatus.inactive) {
                return res.status(401).send({
                    requestStatus: IRequestStatus.Error,
                    fieldError: "email",
                    message: "Error.Account.Locked",
                });
            }
            const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
            const { password, ...rest } = user;
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
            const currentUser = await Users.findById((newUser._id as any).toString()).lean();
            const accessToken = jwt.sign({ id: currentUser?._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
            const { password, ...rest } = currentUser!;
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
        return res.status(500).send({
            success: IRequestStatus.Error,
            message: "Error.Google",
        });
    }
};

export const sendOTP: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

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
            subject: "DEVBLOG PASSWORD RECOVERY",
            html: `<!DOCTYPE html>
      <html lang="en" >
      <head>
        <meta charset="UTF-8">
        <title>Devblog - OTP Email Template</title>
        
      
      </head>
      <body>
      <!-- partial:index.partial.html -->
      <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
        <div style="margin:50px auto;width:70%;padding:20px 0">
          <div style="border-bottom:1px solid #eee">
            <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Devblog</a>
          </div>
          <p style="font-size:1.1em">Hi,</p>
          <p>Thank you for choosing Koding 101. Use the following OTP to complete your Password Recovery Procedure. OTP is valid for 5 minutes</p>
          <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
          <p style="font-size:0.9em;">Regards,<br />Koding 101</p>
          <hr style="border:none;border-top:1px solid #eee" />
          <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
            <p>Koding 101 Inc</p>
            <p>1600 Amphitheatre Parkway</p>
            <p>California</p>
          </div>
        </div>
      </div>
      <!-- partial -->
        
      </body>
      </html>`,
        };

        transporter.sendMail(mail_configs, function (error, info) {
            if (error) {
                return res.status(500).send({
                    success: IRequestStatus.Error,
                    message: "...",
                });
            }
            return res.status(200).send({
                success: IRequestStatus.Success,
                message: "Thành công",
            });
        });
    } catch (error) {
        return res.status(500).send({
            success: IRequestStatus.Error,
            message: "Error.Network",
        });
    }
};
