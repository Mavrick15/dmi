import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitaire pour fusionner les classes Tailwind conditionnelles (clsx)
 * et résoudre les conflits de classes (tailwind-merge).
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}