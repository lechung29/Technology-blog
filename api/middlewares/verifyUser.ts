import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import Users, { IUserInfo, userStatus } from "../models/users/user.model";
import { IRequestStatus } from "../controllers/auth/auth.controller";

export interface AuthenticatedRequest extends Request {
    user?: IUserInfo;
}

export const signAccessToken = async (userId: string, name: string) => {
    const payload = {
        id: userId,
        name: name
    }

    const token = await jwt.sign(payload, process.env.JWT_SECRET!, {expiresIn: "10m"})
    return token;
}

export const signRefreshToken = async (userId: string, name: string) => {
    const payload = {
        id: userId,
        name: name
    }

    const token = await jwt.sign(payload, process.env.JWT_REFRESH!, {expiresIn: "1d"})
    return token;
}

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // const token = req.headers["authorization"];
    // if (!token) {
    //     return res.status(401).send({
    //         requestStatus: IRequestStatus.Error,
    //         message: "Error.Token.Expired",
    //     });
    // } else {
    //     const access_token = token.split(" ")[1];
    //     jwt.verify(access_token, process.env.JWT_SECRET!, (err: any, user: any) => {
    //         if (err) {
    //             return res.status(401).send({
    //                 requestStatus: IRequestStatus.Error,
    //                 message: "Error.Token.Expired",
    //             });
    //         }
    //         req.user = user;
    //         next();
    //     });
        
    // }

    try {
        if (req.headers["x-token"] ) {
            const token = req.headers["x-token"] as string;
            const payload = jwt.verify(token, process.env.JWT_SECRET!)
            req.user = payload as IUserInfo;
            next();
        }
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return res.status(200).send({
                code: 401,
                requestStatus: IRequestStatus.Error,
                message: "Error.Token.Expired",
            });
        }
        return res.status(200).send({
            code: 500,
            requestStatus: IRequestStatus.Error,
            message: error,
        });
    }
};

export const isLocked = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = await Users.findById(req.user?.id);
    if (user?.status === userStatus.inactive) {
        return res.status(200).send({
            code: 403,
            requestStatus: IRequestStatus.Error,
            message: "Error.Account.Locked.Expired",
        });
    }
    next();
}
