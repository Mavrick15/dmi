import { createContext, useContext, useEffect, useState, useMemo } from "react";

const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
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

export const ThemeProvider = ({ children, defaultTheme = THEME_MODES.SYSTEM }) => {
  // Initialisation avec récupération du localStorage
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("medical-theme") || defaultTheme;
    }
    return defaultTheme;
  });

  const [actualTheme, setActualTheme] = useState(THEME_MODES.LIGHT);

  // Détection du thème système
  const getSystemTheme = () => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? THEME_MODES.DARK
        : THEME_MODES.LIGHT;
    }
    return THEME_MODES.LIGHT;
  };

  // Effet 1 : Écouteur de changement système
  useEffect(() => {
    const handleSystemChange = () => {
      if (theme === THEME_MODES.SYSTEM) {
        setActualTheme(getSystemTheme());
      }
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    // Initial set
    if (theme === THEME_MODES.SYSTEM) {
      setActualTheme(getSystemTheme());
    } else {
      setActualTheme(theme);
    }

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
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

  // Cycle : Light -> Dark -> System -> Light
  const toggleTheme = () => {
    if (theme === THEME_MODES.LIGHT) {
      setTheme(THEME_MODES.DARK);
    } else if (theme === THEME_MODES.DARK) {
      setTheme(THEME_MODES.SYSTEM);
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