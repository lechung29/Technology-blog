import jwt from "jsonwebtoken";
import Users from "../models/users/user.model";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./verifyUser";

export const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const admin = await Users.findById(req.user?.id)
        if (admin?.role !== "admin") {
            return res.status(401).send({
                success: false,
                message: "You don't have permission to access",
            })
        } else {
            next()
        }
    } catch (error: any) {
        next(error);
        return res.status(401).send({
            success: false,
            message: error.message,
        })
    }
}