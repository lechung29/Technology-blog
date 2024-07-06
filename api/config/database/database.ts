import mongoose from "mongoose";
import { MongoClient, ServerApiVersion } from "mongodb"

const formatURL = () => {
    let database_url = process.env.DATABASE_URL as string;
    let username = encodeURIComponent(process.env.USER_NAME as string);
    let password = encodeURIComponent(process.env.PASSWORD as string);

    database_url = database_url?.replace(process.env.USER_NAME as string, username);
    database_url = database_url?.replace(process.env.PASSWORD as string, password);

    return database_url;
};

export const connectDB = async () => {
    try {
        await mongoose.connect(formatURL());
        console.log("Connected to database successfully");
    } catch (error) {
        console.log("Connected to database fails: ", error);
    }
};
