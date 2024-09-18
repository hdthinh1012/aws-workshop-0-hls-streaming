import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { Low } from 'lowdb/lib';
import path from 'path';
import { exec } from 'child_process';

export abstract class AbstractFileSystemPath {
    public abstract uploadVideoDirectoryPath();

    public abstract uploadChunkDirectoryPath();

    public abstract streamDirectoryPath();

    public abstract uploadVideoFilePath(videoName: string);

    public abstract uploadChunkFilePath(chunkName: string);

    public abstract streamVideoMasterPlaylistDirectoryPath(videoName: string);

    public abstract getFileStatistic(filePath: string);

    public abstract uploadVideoDirectoryAbsolutePath();

    public abstract uploadChunkDirectoryAbsolutePath();

    public abstract streamDirectoryAbsolutePath();

    public abstract uploadVideoFileAbsolutePath(videoName: string);

    public abstract uploadChunkFileAbsolutePath(chunkName: string);

    public abstract streamVideoMasterPlaylistDirectoryAbsolutePath(videoName: string);
}

export class LocalFileSystemPath extends AbstractFileSystemPath {
    static uploadPath = path.resolve('uploads/videos');
    static uploadPathChunks = path.resolve('uploads/tmp');
    static streamPath = path.resolve('streams');
    public override uploadVideoDirectoryPath() {
        return LocalFileSystemPath.uploadPath;
    }

    public override uploadChunkDirectoryPath() {
        return LocalFileSystemPath.uploadPathChunks;
    }

    public override streamDirectoryPath() {
        return LocalFileSystemPath.streamPath;
    }

    public override uploadVideoFilePath(videoName: string) {
        return path.resolve(LocalFileSystemPath.uploadPath, videoName);
    }

    public override uploadChunkFilePath(chunkName: string) {
        return path.resolve(LocalFileSystemPath.uploadPathChunks, chunkName);
    }

    public override streamVideoMasterPlaylistDirectoryPath(videoName: string) {
        return path.resolve(LocalFileSystemPath.streamPath, videoName);
    }

    public override getFileStatistic(filePath: string) {
        return fs.statSync(filePath);
    }

    public override uploadVideoDirectoryAbsolutePath() {
        return path.resolve(LocalFileSystemPath.uploadPath);
    }

    public override uploadChunkDirectoryAbsolutePath() {
        return path.resolve(LocalFileSystemPath.uploadPathChunks);
    }

    public override streamDirectoryAbsolutePath() {
        return path.resolve(LocalFileSystemPath.streamPath);
    }

    public override uploadVideoFileAbsolutePath(videoName: string) {
        return path.resolve(LocalFileSystemPath.uploadPath, videoName);
    }

    public override uploadChunkFileAbsolutePath(chunkName: string) {
        return path.resolve(LocalFileSystemPath.uploadPathChunks, chunkName);
    }

    public override streamVideoMasterPlaylistDirectoryAbsolutePath(videoName: string) {
        return path.resolve(LocalFileSystemPath.streamPath, videoName);
    }
}
