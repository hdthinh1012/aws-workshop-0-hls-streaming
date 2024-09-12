import { Router } from "express";
import uploadRouter from "./videos/upload";
import streamRouter from "./videos/stream";
import processRouter from "./videos/process";

const apiRouter = Router();

apiRouter.use('/video/stream', streamRouter);
apiRouter.use('/video/upload', uploadRouter);
apiRouter.use('/video/process', processRouter);

export default apiRouter;