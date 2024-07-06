import { CustomError } from "./CustomError";

export const errorHandler = (statusCode: number, message: string) => {
    const error = new CustomError(message, statusCode);
    error.message = message;
    error.statusCode = statusCode;
    return error;
}