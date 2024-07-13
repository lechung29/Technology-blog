"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSlug = void 0;
const getSlug = (slug) => {
    return slug
        .split(" ")
        .join("-")
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-]/g, "-");
};
exports.getSlug = getSlug;
