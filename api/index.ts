import express, { NextFunction, Request, Response } from 'express';

const app = express();

// Port
const port =  3000;


//Router 
app.get('/api/v1/users');

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
})
