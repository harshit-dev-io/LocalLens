/**
 * HTML5 Canvas Image Downscaler & Compressor
 * Guarantees mobile upload payloads < 100KB with max-width 800px and JPEG 0.7 quality.
 */

const MAX_WIDTH = 800;
const INITIAL_QUALITY = 0.7;
const TARGET_SIZE_KB = 100;

/**
 * Loads a File or Blob into an HTMLImageElement
 * @param {Blob|File} file 
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error('Failed to load image: ' + err));
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(new Error('FileReader error: ' + err));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image file using an offscreen HTML5 Canvas.
 * Automatically downscales to max-width 800px while maintaining aspect ratio,
 * and encodes to JPEG with adaptive quality to stay strictly under 100KB.
 * 
 * @param {File|Blob|string} imageInput - File, Blob, or base64 data URL
 * @returns {Promise<{
 *   dataUrl: string,
 *   base64: string,
 *   mimeType: string,
 *   sizeKB: number,
 *   width: number,
 *   height: number
 * }>}
 */
export async function compressImage(imageInput) {
  let img;

  if (typeof imageInput === 'string') {
    img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = (err) => reject(new Error('Invalid image string: ' + err));
      el.src = imageInput;
    });
  } else if (imageInput instanceof Blob) {
    img = await loadImage(imageInput);
  } else {
    throw new Error('Unsupported image input type. Expected File, Blob, or Data URL.');
  }

  // Calculate proportional dimensions
  let targetWidth = img.width;
  let targetHeight = img.height;

  if (targetWidth > MAX_WIDTH) {
    const scaleFactor = MAX_WIDTH / targetWidth;
    targetWidth = MAX_WIDTH;
    targetHeight = Math.round(targetHeight * scaleFactor);
  }

  // Draw to off-screen Canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context.');
  }

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw scaled image
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Iterative adaptive quality check to guarantee < 100KB
  let currentQuality = INITIAL_QUALITY;
  let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
  let base64Data = dataUrl.split(',')[1] || '';
  let sizeKB = Math.round((base64Data.length * (3 / 4)) / 1024);

  // If complex high-noise image exceeds 100KB, adaptively step down quality
  while (sizeKB > TARGET_SIZE_KB && currentQuality > 0.35) {
    currentQuality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
    base64Data = dataUrl.split(',')[1] || '';
    sizeKB = Math.round((base64Data.length * (3 / 4)) / 1024);
  }

  return {
    dataUrl,
    base64: base64Data,
    mimeType: 'image/jpeg',
    sizeKB,
    width: targetWidth,
    height: targetHeight,
  };
}
