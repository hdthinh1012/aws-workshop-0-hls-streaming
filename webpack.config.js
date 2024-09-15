const webpack = require('webpack');
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const NodemonPlugin = require('nodemon-webpack-plugin');

module.exports = {
    entry: {
        app: './src/server.ts',
    },
    target: 'node',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: [/node_modules/, /uploads/],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        plugins: [
            new TsconfigPathsPlugin({ configFile: './tsconfig.json' })
        ]
    },
    mode: "development",
    watch: true,
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new NodemonPlugin({
            script: './build/server.js',
            // What to watch.
            watch: path.resolve('./build'),
            // Node arguments.
            nodeArgs: ['-r ./tsconfig-paths-bootstrap.js'],
            // Files to ignore.
            ignore: ['*.js.map'],
            // Extensions to watch.
            ext: 'js,njk,json',
            // Unlike the cli option, delay here is in milliseconds (also note that it's a string).
            // Here's 1 second delay:
            delay: '1000',
            // Detailed log.
            verbose: true,
            // Environment variables to pass to the script to be restarted
            env: {
                NODE_ENV: 'development',
            },
        })
    ],
    devServer: {
        static: './build',
        hot: true,
    },
    output: {
        path: path.join(__dirname, 'build'),
        filename: 'server.js',
        clean: true
    },
    stats: {
        errorDetails: true
    }
};