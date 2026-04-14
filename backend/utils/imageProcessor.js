const sharp = require('sharp');
const fs = require('fs').promises;

class ImageProcessor {
  /**
   * Optimizes an image for Gemini API by resizing, grayscaling, and compressing.
   * @param {string} inputPath - Path to original image uploaded
   * @param {string} outputPath - Path to save the processed image
   * @returns {Promise<{base64: string, mimeType: string}>} - Returns optimized image as base64 string and mimeType
   */
  async processForGemini(inputPath, outputPath) {
    try {
      await sharp(inputPath)
        .grayscale()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      const fileBuffer = await fs.readFile(outputPath);
      const base64 = fileBuffer.toString('base64');
      const mimeType = 'image/jpeg';
      
      return { base64, mimeType };
    } catch (error) {
      console.error('Image processing failed:', error);
      throw error;
    }
  }
}

module.exports = new ImageProcessor();