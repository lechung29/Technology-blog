import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/ErrorHandle';
import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../utils/CustomError';
import { IUserInfo } from '../models/users/user.model';

export interface AuthenticatedRequest extends Request {
    user?: IUserInfo;
}

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.access_token;
    if (!token) {
        next(errorHandler(401, "Unauthorized"));
        return res.status(401).send({
            success: false,
            message: "Please login to access"
        })
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
        if (err) {
            next(errorHandler(401, "Unauthorized"));
            return res.status(401).send({
                success: false,
                message: "Please login to access"
            })
        }
        req.user = user;
        next();
    })
}