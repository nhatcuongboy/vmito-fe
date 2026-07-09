import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

// OAuth avatars are stored as small thumbnails (Google `=s96-c` → 96px,
// Zalo `s120-` → 120px); request a larger variant for full-size previews
export const getFullSizeAvatarUrl = (url: string) => {
  if (url.includes('googleusercontent.com')) {
    return url
      .replace(/=s\d+(-c)?(?=$|\?)/, '=s512-c')
      .replace(/\/s\d+(-c)?\//, '/s512-c/');
  }
  if (url.includes('zadn.vn')) {
    return url.replace(/\/\/s\d+-/, '//s240-');
  }
  return url;
};

export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    useWebWorker = true,
  } = options;

  try {
    // browser-image-compression automatically maintains aspect ratio
    // maxWidthOrHeight scales down proportionally without cropping
    const compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
    });

    return new File([compressedFile], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    return file;
  }
};
