import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database/database';
import authRouter from './router/auth/auth.route';
import { CustomError } from './utils/CustomError';


const app = express();
dotenv.config();
app.use(express.json());

// Port
const port =  3000;

//Database
connectDB()

//Router 
app.use('/api/v1/auth/', authRouter);

app.listen(port, () => {
    console.log(`Server running on port:${port}`);
})
