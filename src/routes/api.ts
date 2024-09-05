import { Router } from "express";
import uploadRouter from "./videos/upload";
import streamRouter from "./videos/stream";

const apiRouter = Router();

apiRouter.use('/video/stream', streamRouter);
apiRouter.use('/video/upload', uploadRouter);

export default apiRouter;