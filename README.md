# AWS First Cloud Journey Workshop 0: Building HLS Large Video Streaming Web App using AWS EC2, S3

## Goal
Building NodeJS Typescript application allow users to upload large video file, convert into master playist with different resolution to support adaptive streaming conform to HTTP Live Streaming (HLS) protocol.

## Step
Projects contains multiple steps

### Implement with local file system
- Implement large video upload mechanism by splitting into chunks
- Generate HLS Master playlist from original upload.
- Streaming video with front-end React App

### Migrate to AWS S3 Bucket
- Implementing custom engine for Multer to support direct uploading to AWS S3 Bucket.
- Implement custom NodeJS Writable Stream and Readable Stream with Multipart Uploading/Downloading command from the AWS S3 SDK v3, replacing fs.WriteStream and fs.ReadStream.
- Mounting AWS S3 Bucket into local file system using s3fs package, executing ffmpeg Master Playist generation with mounted S3 files with the same command as when working with local file.

## About the repository
Contain back-end source code for the project, please refer to the writeup for detail explanation and step by step guide for deploying to AWS EC2.

Writeup link at: [Coming soon](./ "Writeup") 

The accompanied front-end repository: [Front-end Github Link](https://github.com/hdthinh1012/aws-workshop-0-hls-streaming-fe "Front-end Github Link") 