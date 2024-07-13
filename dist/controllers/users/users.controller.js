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
exports.userLogout = exports.deleteMultipleUsers = exports.deleteSingleUser = exports.updateUserInfo = exports.getUserById = exports.getTotalUsers = exports.getAllUsers = exports.ISortDirection = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = __importDefault(require("../../models/users/user.model"));
const post_model_1 = __importDefault(require("../../models/post/post.model"));
var ISortDirection;
(function (ISortDirection) {
    ISortDirection[ISortDirection["ASC"] = 1] = "ASC";
    ISortDirection[ISortDirection["DESC"] = -1] = "DESC";
})(ISortDirection || (exports.ISortDirection = ISortDirection = {}));
const getAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 9;
        const sortType = ((_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.sortInfo) === null || _b === void 0 ? void 0 : _b.sortType) === "asc" ? ISortDirection.ASC : ISortDirection.DESC;
        const sortField = ((_d = (_c = req.body) === null || _c === void 0 ? void 0 : _c.sortInfo) === null || _d === void 0 ? void 0 : _d.sortField) || "createdAt";
        const sortObject = {};
        if (sortField) {
            sortObject[sortField] = sortType;
        }
        const filterField = (_f = (_e = req.body) === null || _e === void 0 ? void 0 : _e.filterInfo) === null || _f === void 0 ? void 0 : _f.filterField;
        const filterValue = (_h = (_g = req.body) === null || _g === void 0 ? void 0 : _g.filterInfo) === null || _h === void 0 ? void 0 : _h.filterValue;
        const filterObject = {};
        if (filterField && filterValue) {
            filterObject[filterField] = filterValue;
        }
        const searchText = (_j = req.body) === null || _j === void 0 ? void 0 : _j.searchText;
        if (searchText) {
            filterObject["displayName"] = { $regex: searchText, $options: "i" };
        }
        const allUsers = yield user_model_1.default.find(filterObject)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort(sortObject)
            .select("-password")
            .lean()
            .exec();
        return res.status(200).send({
            success: true,
            message: "Get all users successfully",
            data: allUsers,
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to get all users",
        });
    }
});
exports.getAllUsers = getAllUsers;
const getTotalUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalUsers = yield user_model_1.default.countDocuments({});
        return res.status(200).send({
            success: true,
            message: "Get total users successfully",
            total: totalUsers,
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to get quantity of all users",
        });
    }
});
exports.getTotalUsers = getTotalUsers;
const getUserById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findById(req.params.userId).select("-password").lean().exec();
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "User not found",
            });
        }
        return res.status(200).send({
            success: true,
            message: "Get user by id successfully",
            user: Object.assign({}, user),
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to get user information",
        });
    }
});
exports.getUserById = getUserById;
const updateUserInfo = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== req.params.userId) {
        return res.status(403).send({
            success: false,
            message: "You are not allowed to update this user",
        });
    }
    if (req.body.email) {
        const emailRegex = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)$/;
        if (!req.body.email.match(emailRegex)) {
            return res.status(400).send({
                success: false,
                message: "Invalid email format",
            });
        }
    }
    if (req.body.password) {
        if (req.body.password.length < 6) {
            return res.status(400).send({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }
        req.body.password = bcryptjs_1.default.hashSync(req.body.password, 13);
    }
    if (req.body.displayName) {
        if (req.body.displayName.length <= 3 || req.body.displayName.length >= 15) {
            return res.status(400).send({
                success: false,
                message: "Display name must be between 4 and 14 characters",
            });
        }
        if (req.body.displayName.includes(" ") || !req.body.displayName.match(/^[a-zA-Z0-9]+$/)) {
            return res.status(400).send({
                success: false,
                message: "Display name cannot contain spaces and special characters",
            });
        }
    }
    if (req.body.phoneNumber) {
        if (!req.body.phoneNumber.match(/^0\d{9}$/)) {
            return res.status(400).send({
                success: false,
                message: "Invalid phone number format",
            });
        }
    }
    try {
        const updatedUser = yield user_model_1.default.findByIdAndUpdate(req.params.userId, {
            $set: {
                email: req.body.email,
                displayName: req.body.displayName,
                phoneNumber: req.body.phoneNumber,
                password: req.body.password,
            },
        }, { new: true }).lean().exec();
        if (!updatedUser) {
            return res.status(400).send({
                success: false,
                message: "User not found",
            });
        }
        const { password } = updatedUser, rest = __rest(updatedUser, ["password"]);
        res.status(200).send({
            success: true,
            message: "User updated successfully",
            updatedUser: rest,
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to update user",
        });
    }
});
exports.updateUserInfo = updateUserInfo;
const deleteSingleUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        yield user_model_1.default.findByIdAndDelete(userId).exec();
        yield post_model_1.default.deleteMany({ author: userId });
        const remainingUsers = yield user_model_1.default.find({}).select("-password").lean();
        return res.status(200).send({
            success: true,
            message: "Deleted user successfully",
            users: remainingUsers,
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to delete user",
        });
    }
});
exports.deleteSingleUser = deleteSingleUser;
const deleteMultipleUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userIds = req.body.userIds;
    try {
        yield user_model_1.default.deleteMany({ _id: { $in: userIds } }).exec();
        const remainingUsers = yield user_model_1.default.find({}).select("-password").lean();
        return res.status(200).send({
            success: true,
            message: `Deleted ${userIds.length} users successfully`,
            users: remainingUsers,
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: `Failed to delete ${userIds.length} users`,
        });
    }
});
exports.deleteMultipleUsers = deleteMultipleUsers;
const userLogout = (_req, res, next) => {
    try {
        return res.clearCookie("access_token").status(200).json({
            success: true,
            message: "Sign out successfully",
        });
    }
    catch (error) {
        next(error);
        return res.status(500).send({
            success: false,
            message: "Failed to log out",
        });
    }
};
exports.userLogout = userLogout;
