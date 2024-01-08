/**
 * Manages the loading and caching of sprites, designed to be utilized in environments
 * without direct DOM access, such as web workers.
 */
export default class SpriteManager {
  /**
   * Cache to store loaded sprites.
   * @type {Map<string, Promise<Bitmap>>}
   */
  static cache = new Map();

  /**
   * Loads and returns the sprite for the specified source.
   * @param {string} src - The source of the sprite.
   * @returns {Promise<Bitmap>} - The loaded bitmap sprite.
   * @throws {Error} - If there is an error loading the sprite.
   */
  static async get(src) {
    if (SpriteManager.cache.has(src)) {
      return SpriteManager.cache.get(src);
    }
    try {
      const response = await fetch(location.origin + src);
      const blob = await response.blob();

      // In a web worker without DOM access, createImageBitmap can be used
      // to decode the image data from the blob.
      const bitmap = await createImageBitmap(blob);

      SpriteManager.cache.set(src, bitmap);

      return bitmap;
    } catch (error) {
      throw error;
    }
  }
}
