/**
 * Utilitaires de memoization pour optimiser les performances React
 */

import { useMemo, useCallback } from 'react';

/**
 * Hook personnalisé pour mémoriser un objet avec dépendances
 * Utile pour éviter les re-renders inutiles
 */
export const useMemoizedObject = (obj, deps) => {
  return useMemo(() => obj, deps);
};

/**
 * Hook personnalisé pour mémoriser un tableau avec dépendances
 */
export const useMemoizedArray = (arr, deps) => {
  return useMemo(() => arr, deps);
};

/**
 * Hook personnalisé pour mémoriser une fonction avec dépendances
 * Alternative à useCallback avec une API plus simple
 */
export const useMemoizedCallback = (fn, deps) => {
  return useCallback(fn, deps);
};

/**
 * Mémorise une fonction de transformation de données
 * Utile pour les transformations coûteuses dans les composants
 */
export const useDataTransformer = (data, transformer, deps) => {
  return useMemo(() => {
    if (!data) return null;
    return transformer(data);
  }, [data, ...(deps || [])]);
};

/**
 * Mémorise un filtre appliqué à une liste
 */
export const useFilteredList = (list, filterFn, deps) => {
  return useMemo(() => {
    if (!list || !Array.isArray(list)) return [];
    return list.filter(filterFn);
  }, [list, ...(deps || [])]);
};

/**
 * Mémorise une liste triée
 */
export const useSortedList = (list, sortFn, deps) => {
  return useMemo(() => {
    if (!list || !Array.isArray(list)) return [];
    return [...list].sort(sortFn);
  }, [list, ...(deps || [])]);
};

/**
 * Mémorise une liste paginée
 */
export const usePaginatedList = (list, page, pageSize) => {
  return useMemo(() => {
    if (!list || !Array.isArray(list)) return { items: [], total: 0, pages: 0 };
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = list.slice(start, end);
    const total = list.length;
    const pages = Math.ceil(total / pageSize);
    
    return { items, total, pages, currentPage: page, pageSize };
  }, [list, page, pageSize]);
};

/**
 * Mémorise une valeur calculée à partir de plusieurs sources
 */
export const useComputedValue = (computeFn, deps) => {
  return useMemo(() => computeFn(), deps);
};
