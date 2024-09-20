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

## Step-by-step running
1. Clone the repository  
2. Create .env file at the repository folder  
```
PORT=10000
SERVER_URL=http://localhost:10000 // For static file serve
AWS_ACCESS_KEY_ID=<your_iam_access_key_id>
AWS_SECRET_ACCESS_KEY=<your_iam_secret_access_key>
BUCKET_NAME=<your-bucket-name>

IS_AWS_S3=1 // or 0 for local file system
AWS_S3_BUCKET_PATH=<your-mounted-s3fs-location>
```
3. Install s3fs, follow guide for your system at: [s3fs fuse](https://github.com/s3fs-fuse/s3fs-fuse "s3fs fuse")
   - Especially for EC2 Amazon Linux 2023:
   ```
   sudo yum install automake fuse fuse-devel gcc-c++ git libcurl-devel libxml2-devel make openssl-devel -y

   git clone https://github.com/s3fs-fuse/s3fs-fuse.git

   cd  s3fs-fuse
   ./autogen.sh 
   ./configure --prefix=/usr --with-openssl
   make
   sudo make install
   ```
4. Create credential file for s3fs, run mounted command
```
touch ~/.passwd-s3fs
echo <your_iam_access_key_id>:<your_iam_secret_access_key> > ~/.passwd-s3fs
chmod 0600 ~/.passwd-s3fs
s3fs <your-bucket-name> <your-mounted-s3fs-location>
```
5. Open terminal, type command `npm install`
6. To run hot-reload webpack, type command `npm run build`