import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
const app = express();

import bodyParser from 'body-parser';
import apiRouter from './routes/api';
import cors from 'cors';
// Enable CORS
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false })) // parse application/x-www-form-urlencoded
app.use(bodyParser.json()) // parse application/json
app.use(bodyParser.text())
app.use(bodyParser.raw())

import { FileSystemPathType } from 'initFs';
app.use('/static/hls', express.static(FileSystemPathType.streamPath));
app.use('/static', express.static(FileSystemPathType.uploadPath));

// Define a route
app.use('/api', apiRouter);

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!');
});

// Start the server
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});