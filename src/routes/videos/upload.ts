import { Router, Request, Response } from 'express';
import { upload } from 'service/multer/multer';
import { uploadChunk, uploadCancelling, cleanAll, uploadSetup } from 'handler/video/uploadChunk';

const videoRouter = Router();

videoRouter.post('/set-up', upload.none(), uploadSetup);

/**
 * Upload part api
 */
videoRouter.post('/', upload.single('video'), uploadChunk);

videoRouter.delete('/cancel', upload.none(), uploadCancelling);

videoRouter.delete('/clean-all', cleanAll);

export default videoRouter;