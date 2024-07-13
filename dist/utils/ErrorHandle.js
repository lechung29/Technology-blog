"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const CustomError_1 = require("./CustomError");
const errorHandler = (statusCode, message) => {
    const error = new CustomError_1.CustomError(message, statusCode);
    error.message = message;
    error.statusCode = statusCode;
    return error;
};
exports.errorHandler = errorHandler;
