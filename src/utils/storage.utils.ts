export const getVideoThumbnail = (videoId: string) =>
    `${process.env.BUNNY_CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;

export const getPermanentUrl = (storageId: string): string => {
    if (!storageId) return "";
    // Generate permanent URL for public-read files
    return `${process.env.S3_READ_URL}/${storageId}`;
}
