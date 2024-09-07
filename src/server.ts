import * as dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import apiRouter from './routes/api';

const app = express();
app.use(bodyParser.urlencoded({ extended: false })) // parse application/x-www-form-urlencoded
app.use(bodyParser.json()) // parse application/json
app.use(bodyParser.text())
app.use(bodyParser.raw())

// Enable CORS
app.use(cors());

// Define a route
app.use('/api', apiRouter);

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!');
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});