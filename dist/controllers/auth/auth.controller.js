"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userLogin = exports.registerNewUser = void 0;
const user_model_1 = __importDefault(require("../../models/users/user.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ErrorHandle_1 = require("../../utils/ErrorHandle");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var IRegisterStatus;
(function (IRegisterStatus) {
    IRegisterStatus[IRegisterStatus["Success"] = 0] = "Success";
    IRegisterStatus[IRegisterStatus["Existing"] = 1] = "Existing";
    IRegisterStatus[IRegisterStatus["Error"] = 2] = "Error";
})(IRegisterStatus || (IRegisterStatus = {}));
const registerNewUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { displayName, email, password } = req.body;
    if (!email) {
        return res.status(400).send({
            success: false,
            statusType: IRegisterStatus.Error,
            message: "Email is required",
        });
    }
    if (!password) {
        return res.status(400).send({
            success: false,
            statusType: IRegisterStatus.Error,
            message: "Password is required",
        });
    }
    if (!displayName) {
        return res.status(400).send({
            success: false,
            statusType: IRegisterStatus.Error,
            message: "Display name is required",
        });
    }
    if (email) {
        const emailRegex = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)$/;
        if (!email.match(emailRegex)) {
            return res.status(400).send({
                success: false,
                statusType: IRegisterStatus.Error,
                message: "Invalid email format",
            });
        }
    }
    if (password) {
        if (password.length < 6) {
            return res.status(400).send({
                success: false,
                statusType: IRegisterStatus.Error,
                message: "Password must be at least 6 characters",
            });
        }
        req.body.password = bcryptjs_1.default.hashSync(password, 13);
    }
    if (displayName) {
        if (displayName.length <= 3 || displayName.length > 14) {
            return res.status(400).send({
                success: false,
                statusType: IRegisterStatus.Error,
                message: "Display name must be between 4 and 14 characters",
            });
        }
        if (displayName.includes(" ") || !displayName.match(/^[a-zA-Z0-9]+$/)) {
            return res.status(400).send({
                success: false,
                statusType: IRegisterStatus.Error,
                message: "Display name cannot contain spaces and special characters",
            });
        }
    }
    const existingUser = yield user_model_1.default.findOne({ email });
    if (!!existingUser) {
        return res.status(200).send({
            success: false,
            statusType: IRegisterStatus.Existing,
            message: "This user email already exists",
        });
    }
    const newUser = new user_model_1.default({
        displayName,
        email,
        password: req.body.password,
    });
    try {
        yield newUser.save();
        return res.status(201).send({
            success: true,
            statusType: IRegisterStatus.Success,
            message: "Registered new user successfully",
        });
    }
    catch (error) {
        next((0, ErrorHandle_1.errorHandler)(500, error.message));
        return res.status(500).send({
            success: false,
            statusType: IRegisterStatus.Error,
            message: "Somethings went wrong",
        });
        // if (error instanceof Error) {
        //     res.status(500).send({
        //         success: false,
        //         statusType: IRegisterStatus.Error,
        //         message: error.message,
        //     });
        // } else {
        //     res.status(500).send({
        //         success: false,
        //         statusType: IRegisterStatus.Error,
        //         message: "Somethings went wrong",
        //     });
        // }
    }
});
exports.registerNewUser = registerNewUser;
const userLogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email) {
        return res.status(400).send({
            success: false,
            statusType: IRegisterStatus.Error,
            message: "Email is required",
        });
    }
    if (!password) {
        return res.status(400).send({
            success: false,
            statusType: IRegisterStatus.Error,
            message: "Password is required",
        });
    }
    if (email) {
        const emailRegex = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)$/;
        if (!email.match(emailRegex)) {
            return res.status(400).send({
                success: false,
                message: "Invalid email format",
            });
        }
    }
    if (password) {
        if (password.length < 6) {
            return res.status(400).send({
                success: false,
                statusType: IRegisterStatus.Error,
                message: "Password must be at least 6 characters",
            });
        }
    }
    const validUser = yield user_model_1.default.findOne({ email }).lean();
    if (!validUser) {
        return res.status(404).send({
            success: false,
            message: "Email is not existed",
        });
    }
    const validPassword = bcryptjs_1.default.compareSync(password, validUser.password);
    if (!validPassword) {
        return res.status(401).send({
            success: false,
            message: "Password is incorrect",
        });
    }
    if (!process.env.JWT_SECRET) {
        throw new Error("Token cannot be defined");
    }
    try {
        const token = jsonwebtoken_1.default.sign({ id: validUser === null || validUser === void 0 ? void 0 : validUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        const { password: pass } = validUser, rest = __rest(validUser, ["password"]);
        return res.status(200).cookie("access_token", token, { httpOnly: true }).send({
            success: true,
            message: "Sign in successfully",
            userInfo: rest,
        });
    }
    catch (error) {
        next((0, ErrorHandle_1.errorHandler)(500, error.message));
        return res.status(500).send({
            success: false,
            message: "Somethings went wrong",
        });
    }
});
exports.userLogin = userLogin;
