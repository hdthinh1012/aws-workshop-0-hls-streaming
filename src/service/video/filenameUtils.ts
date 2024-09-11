export class FilenameUtils {
    public static getBaseName(baseFileName: string): string {
        try {
            const lastDotIdx = baseFileName.lastIndexOf('.');
            if (lastDotIdx === -1) {
                throw 'Invalid baseFileName, must be <movie-name>.part_<no>!';
            } else {
                return baseFileName.substring(0, lastDotIdx);
            }
        } catch (error) {
            console.error('FilenameUtils::getBaseName error:', error);
            throw error;
        }
    }

    public static getPartNumber(baseFileName: string): number {
        try {
            const match = baseFileName.match(/\.part_(\d+)$/);
            /**
             * match[0]: full result
             * match[1]: in the (...)
             */
            if (match && match[1]) {
                return parseInt(match[1], 10);
            }
        } catch (error) {
            console.error('FilenameUtils::getPartNumber error:', error);
            throw error;
        }
    }
}