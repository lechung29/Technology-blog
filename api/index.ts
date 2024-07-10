import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import cookieParser from "cookie-parser"
import { connectDB } from './config/database/database';
import authRouter from './router/auth/auth.route';
import userRouter from './router/users/user.route';
import postRoute from './router/post/post.route';


const app = express();
dotenv.config();


app.use(express.json());
app.use(cors())
app.use(cookieParser());

// Port
const port =  8080;

//Database
connectDB()

//Router 
app.use('/api/v1/auth/', authRouter);
app.use('/api/v1/user/', userRouter)
app.use('/api/v1/post/', postRoute)

app.listen(port, () => {
    console.log(`Server running on port:${port}`);
})
