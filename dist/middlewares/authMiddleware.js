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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const user_model_1 = __importDefault(require("../models/users/user.model"));
const isAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const admin = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if ((admin === null || admin === void 0 ? void 0 : admin.role) !== "admin") {
            return res.status(401).send({
                success: false,
                message: "You don't have permission to access",
            });
        }
        else {
            next();
        }
    }
    catch (error) {
        next(error);
        return res.status(401).send({
            success: false,
            message: error.message,
        });
    }
});
exports.isAdmin = isAdmin;
