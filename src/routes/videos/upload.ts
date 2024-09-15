import { Router, Request, Response } from 'express';
import { upload } from 'service/fileSystem/multer';
import { uploadSetup, uploadChunk, uploadState, uploadCancelling, cleanAll } from 'handler/video/uploadChunk';

const videoRouter = Router();

videoRouter.get('/state', uploadState);


videoRouter.post('/set-up', upload.none(), uploadSetup);

/**
 * Upload part api
 */
videoRouter.post('/', upload.single('video'), uploadChunk);

videoRouter.delete('/cancel', upload.none(), uploadCancelling);

videoRouter.delete('/clean-all', cleanAll);

export default videoRouter;