import { Router, Request, Response } from 'express';
import { splitChunks, mergeChunks } from 'handler/video/uploadChunk';

const videoRouter = Router();

videoRouter.get('/get-all', (req: Request, res: Response) => {
    try {
        res.json({
            api: '/api/videos/get-alaaalwwwqqqstcse',
            items: []
        });
    } catch (error) {
        console.error('VideoRouter get all:', error);
    }
});

videoRouter.post('/split', splitChunks);
videoRouter.post('/merge', mergeChunks);

export default videoRouter;