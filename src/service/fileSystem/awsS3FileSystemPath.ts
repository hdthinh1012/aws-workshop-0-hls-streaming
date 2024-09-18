import { AbstractFileSystemPath } from "./localFileSystemPath";
import path from "path";
import fs from "fs";

export class AWSS3FileSystemPath extends AbstractFileSystemPath {
    static uploadPath = 'uploads/videos';
    static uploadPathChunks = 'uploads/tmp';
    static streamPath = 'streams';

    public static uploadVideoDirectoryPath() {
        return AWSS3FileSystemPath.uploadPath;
    }

    public static uploadChunkDirectoryPath() {
        return AWSS3FileSystemPath.uploadPathChunks;
    }

    public static streamDirectoryPath() {
        return AWSS3FileSystemPath.streamPath;
    }

    public static uploadVideoFilePath(videoName: string) {
        return path.join(AWSS3FileSystemPath.uploadPath, videoName);
    }

    public static uploadChunkFilePath(chunkName: string) {
        return path.join(AWSS3FileSystemPath.uploadPathChunks, chunkName);
    }

    public static streamVideoMasterPlaylistDirectoryPath(videoName: string) {
        return path.join(AWSS3FileSystemPath.streamPath, videoName);
    }

    public static getFileStatistic(filePath: string) {
        return fs.statSync(filePath); // TODO: Change to S3Client command getting info from presigned URL
    }
}