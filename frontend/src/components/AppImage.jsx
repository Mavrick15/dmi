import { useState, useEffect, useMemo, useRef } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "../utils/cn";
import { getImageUrl } from "../utils/imageUtils";
import api from "../lib/axios";

function Image({
  src,
  alt = "Image",
  className = "",
  fallbackSrc = null, 
  ...props
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const blobUrlRef = useRef(null);

  // Construire l'URL complète de l'image
  const imageUrl = useMemo(() => {
    if (!src) return null;
    return getImageUrl(src);
  }, [src]);

  // Charger l'image via axios avec le token d'authentification
  useEffect(() => {
    if (!imageUrl) {
      setBlobUrl(null);
      return;
    }

    // Si c'est déjà une URL blob ou data:, on l'utilise directement
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
      setBlobUrl(imageUrl);
      return;
    }

    // Si c'est une URL externe complète (http:// ou https://), on essaie de la charger via axios
    // mais si ça échoue (pas d'authentification), on utilise l'URL directe
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      api.get(imageUrl, { responseType: 'blob' })
        .then(response => {
          const url = URL.createObjectURL(response.data);
          setBlobUrl(url);
        })
        .catch(() => {
          // Si l'authentification échoue, on essaie l'URL directe (pour les images publiques)
          setBlobUrl(imageUrl);
        });
      return;
    }

    // Pour les chemins relatifs (commençant par /), on charge via axios avec le token
    // axios ajoutera automatiquement son baseURL (/api/v1)
    api.get(imageUrl, { responseType: 'blob' })
      .then(response => {
        // Nettoyer l'ancienne URL blob si elle existe
        if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        const url = URL.createObjectURL(response.data);
        blobUrlRef.current = url;
        setBlobUrl(url);
      })
      .catch(error => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors du chargement de l\'image:', error);
        }
        setHasError(true);
        setBlobUrl(null);
      });

    // Nettoyer l'URL blob lors du démontage ou changement d'image
    return () => {
      if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [imageUrl]);

  if (!imageUrl || hasError || !blobUrl) {
    return (
      <div 
        className={cn(
            "flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 overflow-hidden transition-colors duration-300", 
            className
        )} 
        role="img"
        aria-label={alt}
        {...props}
      >
        <ImageIcon size="40%" strokeWidth={1.5} />
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