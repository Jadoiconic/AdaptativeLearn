import imageCompression from "browser-image-compression";


export interface CloudinaryUploadOptions {
    folder?: string;
    onProgress?: (progress: number) => void;
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
}

const getCloudinaryConfig = () => {
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error("Missing Cloudinary environment variables (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET)");
    }
    return { CLOUD_NAME, UPLOAD_PRESET };
};

export const uploadImagesToCloudinary = async (
    files: File[],
    options: CloudinaryUploadOptions = {}
): Promise<string[]> => {
    if (!files || files.length === 0) return [];

    const { CLOUD_NAME, UPLOAD_PRESET } = getCloudinaryConfig();
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Compress Image before upload
        const compressedImage = await imageCompression(file, {
            maxSizeMB: options.maxSizeMB ?? 1,
            maxWidthOrHeight: options.maxWidthOrHeight ?? 1920,
            useWebWorker: true,
        });

        const formData = new FormData();
        formData.append("file", compressedImage);
        formData.append("upload_preset", UPLOAD_PRESET);

        if (options.folder) {
            formData.append("folder", options.folder);
        }

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
        );

        if (!response.ok) {
            throw new Error(`Failed to upload image #${i + 1}`);
        }

        const data = await response.json();
        uploadedUrls.push(data.secure_url);

        if (options.onProgress) {
            options.onProgress(Math.round(((i + 1) / files.length) * 100));
        }
    }

    return uploadedUrls;
};

export const uploadVideosToCloudinary = async (
    files: File[],
    options: CloudinaryUploadOptions = {}
): Promise<string[]> => {
    if (!files || files.length === 0) return [];

    const { CLOUD_NAME, UPLOAD_PRESET } = getCloudinaryConfig();
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        if (options.folder) {
            formData.append("folder", options.folder);
        }

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
            { method: "POST", body: formData }
        );

        if (!response.ok) {
            throw new Error(`Failed to upload video #${i + 1}`);
        }

        const data = await response.json();
        uploadedUrls.push(data.secure_url);

        if (options.onProgress) {
            options.onProgress(Math.round(((i + 1) / files.length) * 100));
        }
    }

    return uploadedUrls;
};

export const uploadRawToCloudinary = async (
    files: File[],
    options: CloudinaryUploadOptions = {}
): Promise<string[]> => {
    if (!files || files.length === 0) return [];

    const { CLOUD_NAME, UPLOAD_PRESET } = getCloudinaryConfig();
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        if (options.folder) {
            formData.append("folder", options.folder);
        }

        // Use 'raw' resource type for PDFs and other non-image/video files
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
            { method: "POST", body: formData }
        );

        if (!response.ok) {
            throw new Error(`Failed to upload file #${i + 1}`);
        }

        const data = await response.json();
        uploadedUrls.push(data.secure_url);

        if (options.onProgress) {
            options.onProgress(Math.round(((i + 1) / files.length) * 100));
        }
    }

    return uploadedUrls;
};
