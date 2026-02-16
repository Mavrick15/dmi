/**
 * Utilitaires pour la gestion des URLs d'images
 */

/**
 * Construit l'URL d'une image à partir d'un chemin relatif
 * Retourne un chemin relatif (sans /api/v1) car axios ajoute automatiquement son baseURL
 * @param {string} imagePath - Chemin relatif de l'image (ex: "avatars/xxx.jpg")
 * @returns {string|null} Chemin relatif de l'image ou null si le chemin est invalide
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return null;
  
  // Si c'est déjà une URL complète (http:// ou https:// ou data: ou blob:), on la retourne telle quelle
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
    return imagePath;
  }
  
  // Nettoyer le chemin (enlever le slash initial s'il existe)
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Retourner un chemin relatif que axios utilisera avec son baseURL
  // axios.baseURL est déjà '/api/v1' ou 'http://.../api/v1', donc on retourne juste '/uploads/...'
  return `/uploads/${cleanPath}`;
}
