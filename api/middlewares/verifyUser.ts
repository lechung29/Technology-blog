import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/ErrorHandle';
import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../utils/CustomError';
import { IUserInfo } from '../models/users/user.model';

export interface AuthenticatedRequest extends Request {
    user?: IUserInfo;
}

export const verifyToken = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const token = req.cookies.access_token;
    if (!token) {
        return next(errorHandler(401, "Unauthorized"));
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
        if (err) {
            return next(errorHandler(401, "Unauthorized"));
        }
        req.user = user;
        next();
    })
}