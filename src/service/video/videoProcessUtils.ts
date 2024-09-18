import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { Low } from 'lowdb/lib';
import path from 'path';
import { exec } from 'child_process';
import { LocalFileSystemPath } from 'service/fileSystem/localFileSystemPath';


export class VideoProcessUtils {
    public static async generateMasterPlaylist(fileName: string): Promise<any> {
        const uploadInfo = {
            url: `${process.env.SERVER_URL}/static/${fileName}`,
            bitrate: 0,
            resolution: {},
            codec: '',
        };
        uploadInfo.bitrate = await this.getBitrate(fileName);
        uploadInfo.resolution = await this.getResolution(fileName);
        uploadInfo.codec = await this.getCodec(fileName);
        await this.encodeHLS(fileName, uploadInfo);
    }

    public static async getAllInfos(): Promise<any[]> {
        const videos = fs.readdirSync(LocalFileSystemPath.uploadPath);
        let videoInfos = [];
        for (let video of videos) {
            const info = {
                url: `${process.env.SERVER_URL}/static/${video}`
            };
            info['bitrate'] = await this.getBitrate(video);
            info['resolution'] = await this.getResolution(video);
            info['codec'] = await this.getCodec(video);
            videoInfos.push({
                name: video,
                info: info
            });
        }
        return videoInfos;
    }

    static async isAudioStreamExist(fileName: string): Promise<boolean> {
        return new Promise<boolean>
            ((resolve, reject) => {
                exec(`ffprobe -i ${LocalFileSystemPath.uploadVideoFilePath(fileName)} -v error -select_streams a:0 -show_entries stream=codec_type -of default=nw=1:nk=1`,
                    (err, stdout, stderr) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(stdout.trim() === 'audio');
                    }
                )
            });
    }

    static async getBitrate(fileName: string): Promise<number> {
        return new Promise<number>
            ((resolve, reject) => {
                exec(
                    `ffprobe -v error -select_streams v:0 -show_entries stream=bit_rate -of default=nw=1:nk=1 ${LocalFileSystemPath.uploadVideoFilePath(fileName)}`,
                    (err, stdout, stderr) => {
                        if (err) {
                            return reject(err)
                        }
                        resolve(Number(stdout.trim()))
                    }
                )
            });
    }

    static async getResolution(fileName: string): Promise<string> {
        return new Promise<string>
            ((resolve, reject) => {
                exec(
                    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json ${LocalFileSystemPath.uploadVideoFilePath(fileName)}`,
                    (err, stdout, stderr) => {
                        if (err) {
                            return reject(err)
                        }
                        resolve(JSON.parse(stdout.trim())["streams"][0])
                    }
                )
            });

    }

    static async getCodec(fileName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            exec(
                `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 ${LocalFileSystemPath.uploadVideoFilePath(fileName)}`,
                (err, stdout, stderr) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(stdout.trim())
                }
            )
        });
    }

    public static async encodeHLS(fileName: string, uploadInfo: {
        url: string,
        bitrate: number,
        resolution: any,
        codec: string
    }) {
        try {
            await new Promise((resolve, reject) => {
                exec(`ffmpeg -y -i ${LocalFileSystemPath.uploadVideoFilePath(fileName)} \
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
-hls_segment_filename "${LocalFileSystemPath.streamVideoMasterPlaylistDirectoryPath(fileName)}/%v/fileSequence%d.ts" \
${LocalFileSystemPath.streamVideoMasterPlaylistDirectoryPath(fileName)}/%v/prog_index.m3u8`,
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