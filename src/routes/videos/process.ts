import { Router, Request, Response } from 'express';
import fs from "fs";
import { processVideo, getAllUploadInfo } from 'handler/video/processVideo';
import { uploadPath } from 'service/video/fileUtils';
const processRouter = Router();

processRouter.get('/get-all', getAllUploadInfo);

// processRouter.get('/', async (req: Request, res: Response) => {
//     try {

//     } catch (error) {
//         console.error('ProcessGetAllInfo Error:', error);
//     }
// });

export default processRouter;