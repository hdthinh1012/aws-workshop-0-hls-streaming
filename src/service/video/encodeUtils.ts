import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { Low } from 'lowdb/lib';
import path from 'path';
import { exec } from 'child_process';
import { uploadPath, uploadPathChunks, streamPath } from './videoProcessUtils';

const MAXIMUM_BITRATE_720P = 5 * 10 ** 6 // 5Mbps
const MAXIMUM_BITRATE_1080P = 8 * 10 ** 6 // 8Mbps
const MAXIMUM_BITRATE_1440P = 16 * 10 ** 6 // 16Mbps

export class EncodeUtils {
    public static async encodeHLS(fileName: string, uploadInfo: {
        url: string,
        bitrate: number,
        resolution: any,
        codec: string
    }) {
        try {
            const bitrate720 = uploadInfo['bitrate'] > MAXIMUM_BITRATE_720P ? MAXIMUM_BITRATE_720P : uploadInfo['bitrate'];
            const bitrate1080 = uploadInfo['bitrate'] > MAXIMUM_BITRATE_1080P ? MAXIMUM_BITRATE_1080P : uploadInfo['bitrate'];
            const bitrate1440 = uploadInfo['bitrate'] > MAXIMUM_BITRATE_1440P ? MAXIMUM_BITRATE_1440P : uploadInfo['bitrate'];

            await new Promise((resolve, reject) => {
                console.log('executing: ', `ffmpeg -y -i ${path.resolve(uploadPath, fileName)} \
-loglevel error \
-c:v libx264 -crf 22 -c:a aac -ar 44100 \
-map 0:0 \
-map 0:1 \
-map 0:0 \
-map 0:1 \
-map 0:0 \
-map 0:1 \
-map 0:0 \
-map 0:1 \
-filter:v:0 scale=640:360  -maxrate:v:0 600k -b:a:0 500k \
-filter:v:1 scale=840:480  -maxrate:v:1 1500k -b:a:1 1000k \
-filter:v:2 scale=1280:720  -maxrate:v:0 3000k -b:a:2 2000k \
-filter:v:3 scale=1920:1080 -maxrate:v:2 6000k -b:a:3 2000k \
-var_stream_map "v:0,a:0,name:360p v:1,a:1,name:480p v:2,a:2,name:720p v:3,a:3,name:1080p" \
-preset slow -g 48 -sc_threshold 0 \
-master_pl_name "master.m3u8" \
-f hls -hls_time 5 -hls_list_size 0 \
-hls_segment_filename "${path.resolve(streamPath, fileName)}/%v/fileSequence%d.ts" \
${path.resolve(streamPath, fileName)}/%v/prog_index.m3u8`);
                exec(`ffmpeg -y -i ${path.resolve(uploadPath, fileName)} \
-loglevel error \
-c:v libx264 -crf 22 -c:a aac -ar 44100 \
-map 0:0 \
-map 0:1 \
-map 0:0 \
-map 0:1 \
-map 0:0 \
-map 0:1 \
-map 0:0 \
-map 0:1 \
-filter:v:0 scale=640:360  -maxrate:v:0 600k -b:a:0 500k \
-filter:v:1 scale=840:480  -maxrate:v:1 1500k -b:a:1 1000k \
-filter:v:2 scale=1280:720  -maxrate:v:0 3000k -b:a:2 2000k \
-filter:v:3 scale=1920:1080 -maxrate:v:2 6000k -b:a:3 2000k \
-var_stream_map "v:0,a:0,name:360p v:1,a:1,name:480p v:2,a:2,name:720p v:3,a:3,name:1080p" \
-preset slow -g 48 -sc_threshold 0 \
-master_pl_name "master.m3u8" \
-f hls -hls_time 5 -hls_list_size 0 \
-hls_segment_filename "${path.resolve(streamPath, fileName)}/%v/fileSequence%d.ts" \
${path.resolve(streamPath, fileName)}/%v/prog_index.m3u8`,
                    (err, stdout, stderr) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(stdout.trim() === 'audio');
                    }
                )
            });
        } catch (error) {
            console.error('EncodeUtils.encodeHLS error:', error);
        }
    }
}