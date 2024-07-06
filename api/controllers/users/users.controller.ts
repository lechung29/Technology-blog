import { Request, Response } from "express";

export const test = async (req: Request, res: Response) => {
    res.status(200).send({
        message: "Api working successfully"
    })
}