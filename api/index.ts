import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database/database';

const app = express();
dotenv.config()

// Port
const port =  3000;

//Database
connectDB()

//Router 
app.get('/api/v1/users');

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
})
