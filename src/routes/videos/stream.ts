import { Router, Request, Response } from 'express';
import { splitChunks, mergeChunks } from 'handler/video/uploadChunk';
import { streamList } from 'handler/video/streamVideo';

const videoRouter = Router();

videoRouter.get('/get-all', streamList);
videoRouter.post('/split', splitChunks);
videoRouter.post('/merge', mergeChunks);

export default videoRouter;