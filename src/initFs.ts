import dotenv from 'dotenv';
dotenv.config();

import { AbstractFileSystemAction, LocalFileSystemAction } from 'service/fileSystem/localFileSystemAction';
import { AbstractFileSystemPath, LocalFileSystemPath } from 'service/fileSystem/localFileSystemPath';
import { AWSS3FileSystemAction } from 'service/fileSystem/awsS3FileSystemAction';
import { AWSS3FileSystemPath } from 'service/fileSystem/awsS3FileSystemPath';

let FileSystemActionType;
let FileSystemPathType;
const isAWSS3 = process.env.IS_AWS_S3 === '1';
if (isAWSS3) {
    FileSystemActionType = AWSS3FileSystemAction;
    FileSystemPathType = AWSS3FileSystemPath;
} else {
    FileSystemActionType = LocalFileSystemAction;
    FileSystemPathType = LocalFileSystemPath;
}

export { FileSystemActionType, FileSystemPathType };