import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { Low } from 'lowdb/lib';
import path from 'path';
import { exec } from 'child_process';
import { uploadPath, uploadPathChunks, streamPath } from 'service/fileSystem/localFileSystemPath';

abstract class AbstractFileSystemAction { }

export class LocalFileSystemAction extends AbstractFileSystemAction {
    public static readFormDir(path: string, options: { [key: string]: any } | undefined): string[] {
        try {
            return fs.readdirSync(path);
        } catch (error) {
            console.error('LocalFileSystemAction.readFormDir error:', error);
        }
    }

    public static rmDirectory(path: string, options: { [key: string | number | symbol]: any } | undefined): void {
        try {
            fs.rmSync(path, options);
        } catch (error) {
            console.error('LocalFileSystemAction.rmDirectory error:', error);
        }
    }

    public static rmFile(path: string): void {
        try {
            fs.unlinkSync(path);
        } catch (error) {
            console.error('LocalFileSystemAction.rmFile error:', error);
        }
    }

    public static createWriteStream(path: string, options: any): fs.WriteStream {
        return fs.createWriteStream(path, options);
    }

    public static createReadStream(path: string, options: any): fs.ReadStream {
        return fs.createReadStream(path, options);
    }

    public static pipeReadToWrite(readStream: fs.ReadStream, writeStream: fs.WriteStream, options: any) {
        readStream.pipe(writeStream, options);
    }

    public static addEventListenerReadStream(readStream: fs.ReadStream, event: string, handler: (...args: any[]) => void) {
        readStream.on(event, handler);
    }

    public static writeChunkToWriteStream(writeStream: fs.WriteStream, chunk: any, callback: any) {
        writeStream.write(chunk, callback);
    }

    public static endWriteStream(writeStream: fs.WriteStream) {
        writeStream.end();
    }
}