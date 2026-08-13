const MAX_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 512;

export class ImageError extends Error {}

/**
 * Reads a picked file and returns a downscaled JPEG data URL. Downscaling keeps
 * the profile small enough to sit in localStorage alongside everything else.
 */
export async function fileToScaledDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new ImageError('That file is not an image. Pick a JPG, PNG or WebP.');
  }
  if (file.size > MAX_BYTES) {
    throw new ImageError('That image is over 8 MB. Pick a smaller one.');
  }

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new ImageError('Could not read that image — it may be corrupted.');
  });

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new ImageError('Your browser blocked image processing.');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', 0.85);
}
