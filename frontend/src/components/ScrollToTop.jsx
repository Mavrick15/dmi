import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Remet le scroll en haut de la page à chaque changement de route.
 * Invisible (pas de rendu). À placer dans le routeur (ex. dans Router ou Layout).
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;