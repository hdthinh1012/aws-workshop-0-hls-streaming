import dotenv from 'dotenv';
dotenv.config();

import { AbstractFileSystemAction, LocalFileSystemAction } from 'service/fileSystem/localFileSystemAction';
import { AbstractFileSystemPath, LocalFileSystemPath } from 'service/fileSystem/localFileSystemPath';
import { AWSS3FileSystemAction } from 'service/fileSystem/awsS3FileSystemAction';
import { AWSS3FileSystemPath } from 'service/fileSystem/awsS3FileSystemPath';

let fileSystemActionObject: AbstractFileSystemAction;
let fileSystemPathObject: AbstractFileSystemPath;
const isAWSS3 = process.env.IS_AWS_S3 === '1';
if (isAWSS3) {
    fileSystemActionObject = new AWSS3FileSystemAction();
    fileSystemPathObject = new AWSS3FileSystemPath();
} else {
    fileSystemActionObject = new LocalFileSystemAction();
    fileSystemPathObject = new LocalFileSystemPath();
}

export { fileSystemActionObject, fileSystemPathObject };