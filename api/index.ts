import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import cookieParser from "cookie-parser"
import { connectDB } from './config/database/database';
import authRouter from './router/auth/auth.route';
import userRouter from './router/users/user.route';
import postRouter from './router/post/post.route';
import commentRouter from './router/comment/comment.route';
import favoriteRouter from './router/favorite/favorite.route';


const app = express();
dotenv.config();


app.use(express.json());
app.use(cors())
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Port
const port =  8080;

//Database
connectDB()

//Router 
app.use('/api/v1/auth/', authRouter);
app.use('/api/v1/user/', userRouter)
app.use('/api/v1/post/', postRouter)
app.use('/api/v1/comment/', commentRouter)
app.use('/api/v1/favorite/', favoriteRouter)


app.listen(port, () => {
    console.log(`Server running on port:${port}`);
})
