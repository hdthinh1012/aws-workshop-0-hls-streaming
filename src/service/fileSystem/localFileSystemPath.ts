import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { Low } from 'lowdb/lib';
import path from 'path';
import { exec } from 'child_process';
abstract class AbstractFileSystemPath { }

export const uploadPath = path.resolve('uploads/videos');
export const uploadPathChunks = path.resolve('uploads/tmp');
export const streamPath = path.resolve('streams');

export class LocalFileSystemPath {
    public static uploadVideoDirectoryPath() {
        return uploadPath;
    }

    public static uploadChunkDirectoryPath() {
        return uploadPathChunks;
    }

    public static streamDirectoryPath() {
        return streamPath;
    }

    public static uploadVideoFilePath(videoName: string) {
        return path.resolve(uploadPath, videoName);
    }

    public static uploadChunkFilePath(chunkName: string) {
        return path.resolve(uploadPathChunks, chunkName);
    }

    public static streamVideoMasterPlaylistDirectoryPath(videoName: string) {
        return path.resolve(streamPath, videoName);
    }

    public static getFileStatistic(filePath: string) {
        return fs.statSync(filePath);
    }
}
