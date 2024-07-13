"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const database_1 = require("./config/database/database");
const auth_route_1 = __importDefault(require("./router/auth/auth.route"));
const user_route_1 = __importDefault(require("./router/users/user.route"));
const post_route_1 = __importDefault(require("./router/post/post.route"));
const comment_route_1 = __importDefault(require("./router/comment/comment.route"));
const app = (0, express_1.default)();
dotenv_1.default.config();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, cookie_parser_1.default)());
// Port
const port = 8080;
//Database
(0, database_1.connectDB)();
//Router 
app.use('/api/v1/auth/', auth_route_1.default);
app.use('/api/v1/user/', user_route_1.default);
app.use('/api/v1/post/', post_route_1.default);
app.use('/api/v1/comment', comment_route_1.default);
app.listen(port, () => {
    console.log(`Server running on port:${port}`);
});
