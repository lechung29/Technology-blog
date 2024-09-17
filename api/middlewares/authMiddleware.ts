import jwt from "jsonwebtoken";
import Users from "../models/users/user.model";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./verifyUser";

export const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const admin = await Users.findById(req.user?.id);
    if (admin?.role !== "admin") {
        return res.status(401).send({
            success: false,
            message: "Error.Not.Have.Permission",
        });
    }
    next();
};
