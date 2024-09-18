import { AbstractFileSystemPath } from "./localFileSystemPath";
import path from "path";
import fs from "fs";
import dotenv from 'dotenv';
dotenv.config();

export class AWSS3FileSystemPath extends AbstractFileSystemPath {
    static uploadPath = 'uploads/videos';
    static uploadPathChunks = 'uploads/tmp';
    static streamPath = 'streams';
    static s3BucketMountPath = process.env.AWS_S3_BUCKET_PATH;

    public override uploadVideoDirectoryPath() {
        return AWSS3FileSystemPath.uploadPath;
    }

    public override uploadChunkDirectoryPath() {
        return AWSS3FileSystemPath.uploadPathChunks;
    }

    public override streamDirectoryPath() {
        return AWSS3FileSystemPath.streamPath;
    }

    public override uploadVideoFilePath(videoName: string) {
        return path.join(AWSS3FileSystemPath.uploadPath, videoName);
    }

    public override uploadChunkFilePath(chunkName: string) {
        return path.join(AWSS3FileSystemPath.uploadPathChunks, chunkName);
    }

    public override streamVideoMasterPlaylistDirectoryPath(videoName: string) {
        return path.join(AWSS3FileSystemPath.streamPath, videoName);
    }

    public override getFileStatistic(filePath: string) {
        return fs.statSync(filePath); // TODO: Change to S3Client command getting info from presigned URL
    }


    public override uploadVideoDirectoryAbsolutePath() {
        return path.resolve(AWSS3FileSystemPath.s3BucketMountPath, AWSS3FileSystemPath.uploadPath);
    }

    public override uploadChunkDirectoryAbsolutePath() {
        return path.resolve(AWSS3FileSystemPath.s3BucketMountPath, AWSS3FileSystemPath.uploadPathChunks);
    }

    public override streamDirectoryAbsolutePath() {
        return path.resolve(AWSS3FileSystemPath.s3BucketMountPath, AWSS3FileSystemPath.streamPath);
    }

    public override uploadVideoFileAbsolutePath(videoName: string) {
        return path.resolve(AWSS3FileSystemPath.s3BucketMountPath, AWSS3FileSystemPath.uploadPath, videoName);
    }

    public override uploadChunkFileAbsolutePath(chunkName: string) {
        return path.resolve(AWSS3FileSystemPath.s3BucketMountPath, AWSS3FileSystemPath.uploadPathChunks, chunkName);
    }

    public override streamVideoMasterPlaylistDirectoryAbsolutePath(videoName: string) {
        return path.resolve(AWSS3FileSystemPath.s3BucketMountPath, AWSS3FileSystemPath.streamPath, videoName);
    }
}