const webpack = require('webpack');
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
    entry: {
        app: './src/server.ts',
    },
    watch: true,
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
    mode: "development",
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        plugins: [
            new TsconfigPathsPlugin({ configFile: './tsconfig.json' })
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
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