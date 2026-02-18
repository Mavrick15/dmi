import { createContext, useContext, useEffect, useState, useMemo } from "react";

const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
  AUTO: "auto",
};

// Heure de début du "jour" (mode clair) et de la "nuit" (mode sombre)
const DAY_START_HOUR = 7;   // 7h -> mode clair
const NIGHT_START_HOUR = 20; // 20h -> mode sombre

/** Thème basé sur l'heure locale : jour = clair, nuit = sombre */
const getTimeBasedTheme = () => {
  if (typeof window === "undefined") return "light";
  const hour = new Date().getHours();
  return (hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR) ? THEME_MODES.LIGHT : THEME_MODES.DARK;
};

const ThemeContext = createContext({
  theme: THEME_MODES.SYSTEM,
  setTheme: () => null,
  actualTheme: THEME_MODES.LIGHT,
  toggleTheme: () => null,
  themes: THEME_MODES,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children, defaultTheme = THEME_MODES.AUTO }) => {
  // Initialisation avec récupération du localStorage
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("medical-theme") || defaultTheme;
    }
    return defaultTheme;
  });

  const [actualTheme, setActualTheme] = useState(() => {
    if (typeof window === "undefined") return THEME_MODES.LIGHT;
    const stored = localStorage.getItem("medical-theme") || defaultTheme;
    if (stored === THEME_MODES.AUTO) return getTimeBasedTheme();
    if (stored === THEME_MODES.SYSTEM) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? THEME_MODES.DARK : THEME_MODES.LIGHT;
    }
    if (stored === THEME_MODES.DARK || stored === THEME_MODES.LIGHT) return stored;
    return THEME_MODES.LIGHT;
  });

  // Détection du thème système
  const getSystemTheme = () => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? THEME_MODES.DARK
        : THEME_MODES.LIGHT;
    }
    return THEME_MODES.LIGHT;
  };

  // Effet 1 : Détermination du thème effectif (système, auto jour/nuit, ou fixe)
  useEffect(() => {
    const handleSystemChange = () => {
      if (theme === THEME_MODES.SYSTEM) {
        setActualTheme(getSystemTheme());
      }
    };

    if (theme === THEME_MODES.SYSTEM) {
      setActualTheme(getSystemTheme());
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", handleSystemChange);
      return () => mediaQuery.removeEventListener("change", handleSystemChange);
    }
    if (theme === THEME_MODES.AUTO) {
      setActualTheme(getTimeBasedTheme());
      return undefined;
    }
    setActualTheme(theme);
    return undefined;
  }, [theme]);

  // Effet 1b : En mode Auto, mettre à jour le thème à chaque minute (passage jour/nuit)
  useEffect(() => {
    if (theme !== THEME_MODES.AUTO) return;
    const tick = () => setActualTheme(getTimeBasedTheme());
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, [theme]);

  // Effet 2 : Application des classes CSS et du LocalStorage
  useEffect(() => {
    const root = window.document.documentElement;
    
    // 1. Gestion des classes Tailwind
    root.classList.remove(THEME_MODES.LIGHT, THEME_MODES.DARK);
    root.classList.add(actualTheme);
    
    // 2. Gestion native du navigateur (Scrollbars, inputs natifs)
    root.style.colorScheme = actualTheme;

    // 3. Persistance
    localStorage.setItem("medical-theme", theme);
  }, [theme, actualTheme]);

  // Cycle : Light -> Dark -> System -> Auto -> Light
  const toggleTheme = () => {
    if (theme === THEME_MODES.LIGHT) {
      setTheme(THEME_MODES.DARK);
    } else if (theme === THEME_MODES.DARK) {
      setTheme(THEME_MODES.SYSTEM);
    } else if (theme === THEME_MODES.SYSTEM) {
      setTheme(THEME_MODES.AUTO);
    } else {
      setTheme(THEME_MODES.LIGHT);
    }
  };

  // Optimisation des performances avec useMemo
  const value = useMemo(() => ({
    theme,
    setTheme,
    actualTheme,
    toggleTheme,
    themes: THEME_MODES,
  }), [theme, actualTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;