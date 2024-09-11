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
import { uploadPath } from "service/video/fileUtils";
app.use('/static', express.static(uploadPath))

// Enable CORS
app.use(cors());

// Define a route
app.use('/api', apiRouter);

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!');
});

// Start the server
const port = process.env.PORT || 3000;

var server = require('http').createServer(app);
server.keepAliveTimeout = 0; // This is a workaround for WSL v2 issues

server.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});