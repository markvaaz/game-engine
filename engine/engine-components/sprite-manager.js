export default class SpriteManager {
  static cache = new Map();

  static async get(src){
    if(SpriteManager.cache.has(src)) return SpriteManager.cache.get(src);
    try{
      const response = await fetch(location.origin + src);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);

      SpriteManager.cache.set(src, bitmap);

      return bitmap;
    }catch(error) {
      throw error;
    }
  }
}
