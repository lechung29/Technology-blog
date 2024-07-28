import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/ErrorHandle';
import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../utils/CustomError';
import { IUserInfo } from '../models/users/user.model';

export interface AuthenticatedRequest extends Request {
    user?: IUserInfo;
}

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers["authorization"];
    if (!token) {
        next(errorHandler(401, "Unauthorized"));
        return res.status(401).send({
            success: false,
            message: "Vui lòng đăng nhập lại để tiếp tục"
        })
    }

    const access_token = token.split(" ")[1]

    jwt.verify(access_token, process.env.JWT_SECRET!, (err: any, user: any) => {
        if (err) {
            next(errorHandler(401, "Unauthorized"));
            return res.status(401).send({
                success: false,
                message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục"
            })
        }
        req.user = user;
        next();
    })
}