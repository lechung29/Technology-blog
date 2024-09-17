import jwt from "jsonwebtoken";
import { errorHandler } from "../utils/ErrorHandle";
import { NextFunction, Request, Response } from "express";
import { CustomError } from "../utils/CustomError";
import Users, { IUserInfo, userStatus } from "../models/users/user.model";
import { IRequestStatus } from "../controllers/auth/auth.controller";

export interface AuthenticatedRequest extends Request {
    user?: IUserInfo;
}

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers["authorization"];
    if (!token) {
        return res.status(401).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Token.Expired",
        });
    } else {
        const access_token = token.split(" ")[1];
        jwt.verify(access_token, process.env.JWT_SECRET!, (err: any, user: any) => {
            if (err) {
                return res.status(401).send({
                    requestStatus: IRequestStatus.Error,
                    message: "Error.Token.Expired",
                });
            }
            req.user = user;
            next();
        });
        
    }
};

export const isLocked = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = await Users.findById(req.user?.id);
    if (user?.status === userStatus.inactive) {
        return res.status(401).send({
            requestStatus: IRequestStatus.Error,
            message: "Error.Token.Expired",
        });
    }
    next();
}
