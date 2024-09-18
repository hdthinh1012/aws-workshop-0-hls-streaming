import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { Low } from 'lowdb/lib';
import path from 'path';
import { exec } from 'child_process';

export abstract class AbstractFileSystemPath { }

export class LocalFileSystemPath extends AbstractFileSystemPath {
    static uploadPath = path.resolve('uploads/videos');
    static uploadPathChunks = path.resolve('uploads/tmp');
    static streamPath = path.resolve('streams');
    public static uploadVideoDirectoryPath() {
        return LocalFileSystemPath.uploadPath;
    }

    public static uploadChunkDirectoryPath() {
        return LocalFileSystemPath.uploadPathChunks;
    }

    public static streamDirectoryPath() {
        return LocalFileSystemPath.streamPath;
    }

    public static uploadVideoFilePath(videoName: string) {
        return path.resolve(LocalFileSystemPath.uploadPath, videoName);
    }

    public static uploadChunkFilePath(chunkName: string) {
        return path.resolve(LocalFileSystemPath.uploadPathChunks, chunkName);
    }

    public static streamVideoMasterPlaylistDirectoryPath(videoName: string) {
        return path.resolve(LocalFileSystemPath.streamPath, videoName);
    }

    public static getFileStatistic(filePath: string) {
        return fs.statSync(filePath);
    }
}
