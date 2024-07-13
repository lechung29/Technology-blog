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
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const formatURL = () => {
    let database_url = process.env.DATABASE_URL;
    let username = encodeURIComponent(process.env.USER_NAME);
    let password = encodeURIComponent(process.env.PASSWORD);
    database_url = database_url === null || database_url === void 0 ? void 0 : database_url.replace(process.env.USER_NAME, username);
    database_url = database_url === null || database_url === void 0 ? void 0 : database_url.replace(process.env.PASSWORD, password);
    return database_url;
};
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(formatURL());
        console.log("Connected to database successfully");
    }
    catch (error) {
        console.log("Connected to database fails: ", error);
    }
});
exports.connectDB = connectDB;
