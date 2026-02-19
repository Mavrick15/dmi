import { useState, useEffect, useMemo, useRef } from "react";
import Icon from "./AppIcon";
import { cn } from "../utils/cn";
import { getImageUrl } from "../utils/imageUtils";
import api from "../lib/axios";

// Cache des URLs blob : une seule requête réseau par URL, réutilisée partout (header, menu, etc.)
const BLOB_CACHE_MAX = 30;
const blobCache = new Map(); // imageUrl -> { blobUrl, lastUsed }
const fetchPromises = new Map(); // imageUrl -> Promise<blobUrl> (évite les requêtes en double)

function getCachedBlob(imageUrl) {
  const entry = blobCache.get(imageUrl);
  if (!entry) return null;
  entry.lastUsed = Date.now();
  return entry.blobUrl;
}

function setCachedBlob(imageUrl, blobUrl) {
  if (blobCache.size >= BLOB_CACHE_MAX) {
    const oldest = [...blobCache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed)[0];
    if (oldest) {
      if (oldest[1].blobUrl.startsWith('blob:')) URL.revokeObjectURL(oldest[1].blobUrl);
      blobCache.delete(oldest[0]);
    }
  }
  blobCache.set(imageUrl, { blobUrl, lastUsed: Date.now() });
}

/** Charge l'image une seule fois par URL : cache + déduplication des requêtes en cours */
function loadBlobOnce(imageUrl, fallbackToDirectUrl = false) {
  const cached = getCachedBlob(imageUrl);
  if (cached) return Promise.resolve(cached);

  let promise = fetchPromises.get(imageUrl);
  if (promise) return promise;

  promise = api.get(imageUrl, { responseType: 'blob' })
    .then((response) => {
      const blobUrl = URL.createObjectURL(response.data);
      setCachedBlob(imageUrl, blobUrl);
      fetchPromises.delete(imageUrl);
      return blobUrl;
    })
    .catch((err) => {
      fetchPromises.delete(imageUrl);
      if (fallbackToDirectUrl) return imageUrl;
      throw err;
    });

  fetchPromises.set(imageUrl, promise);
  return promise;
}

function Image({
  src,
  alt = "Image",
  className = "",
  fallbackSrc = null, 
  ...props
}) {
  // Construire l'URL une seule fois pour l'init et le cache
  const imageUrl = useMemo(() => {
    if (!src) return null;
    return getImageUrl(src);
  }, [src]);

  // Valeur en cache au premier rendu (pour que la photo reste fixe sans recharger au changement de page)
  const initialCached = useMemo(() => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) return imageUrl;
    return getCachedBlob(imageUrl);
  }, [imageUrl]);

  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(!!initialCached);
  const [blobUrl, setBlobUrl] = useState(initialCached);
  const blobUrlRef = useRef(null);

  // Charger l'image via axios avec le token d'authentification (avec cache pour éviter rechargement à chaque page)
  useEffect(() => {
    if (!imageUrl) {
      setBlobUrl(null);
      return;
    }

    // Si c'est déjà une URL blob ou data:, on l'utilise directement
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
      setBlobUrl(imageUrl);
      setIsLoaded(true);
      return;
    }

    // Utiliser le cache si disponible (évite de recharger la photo du header à chaque navigation)
    const cached = getCachedBlob(imageUrl);
    if (cached) {
      setBlobUrl(cached);
      setIsLoaded(true);
      return;
    }

    // Une seule requête réseau par URL (plusieurs composants = un seul chargement)
    const isExternal = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
    setIsLoaded(false);
    setHasError(false);
    let cancelled = false;

    loadBlobOnce(imageUrl, isExternal)
      .then((url) => {
        if (cancelled) return;
        if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        blobUrlRef.current = url;
        setBlobUrl(url);
        setIsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors du chargement de l\'image:', imageUrl);
        }
        setHasError(true);
        setBlobUrl(null);
      });

    return () => {
      cancelled = true;
      blobUrlRef.current = null;
    };
  }, [imageUrl]);

  if (!imageUrl || hasError || !blobUrl) {
    return (
      <div 
        className={cn(
            "flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 overflow-hidden transition-colors duration-200", 
            className
        )} 
        role="img"
        aria-label={alt}
        {...props}
      >
        <Icon name="Image" size={24} className="opacity-60" />
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={cn(
        "transition-opacity duration-500 ease-in-out object-cover",
        isLoaded ? "opacity-100" : "opacity-0", 
        className
      )}
      onLoad={() => setIsLoaded(true)}
      onError={() => {
        setHasError(true);
        if (blobUrl && blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrl);
        }
      }}
      {...props}
    />
  );
}

export default Image;