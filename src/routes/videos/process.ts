import { Router, Request, Response } from 'express';
import fs from "fs";
import { processVideo, getAllUploadInfo } from 'handler/video/processVideo';
const processRouter = Router();

processRouter.get('/get-all', getAllUploadInfo);

export default processRouter;