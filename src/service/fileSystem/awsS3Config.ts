import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";

let jsonSecret = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    BUCKET_NAME: process.env.BUCKET_NAME,
};

let s3 = new S3Client({
    credentials: {
        accessKeyId: jsonSecret.AWS_ACCESS_KEY_ID,
        secretAccessKey: jsonSecret.AWS_SECRET_ACCESS_KEY,
    },
    region: "us-east-1",
    // Use a custom request handler so that we can adjust the HTTPS Agent and
    // socket behavior.
    requestHandler: new NodeHttpHandler({
        httpsAgent: new https.Agent({
            maxSockets: 500,

            // keepAlive is a default from AWS SDK. We want to preserve this for
            // performance reasons.
            keepAlive: true,
            keepAliveMsecs: 1000,
        }),
        socketTimeout: 900000,
    }),
});

export { s3, jsonSecret };