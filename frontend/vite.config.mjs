import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";
import viteCompression from "vite-plugin-compression";
import path from "path";

export default defineConfig(({ mode }) => {
  // Charge les variables d'environnement selon le mode (ex: .env.production)
  const env = loadEnv(mode, process.cwd(), '');

  // On considère qu'on est en prod si le mode est 'production'
  const isProduction = mode === 'production';

  return {
    resolve: {
      alias: {
        "components": path.resolve(__dirname, "./src/components"),
        "pages": path.resolve(__dirname, "./src/pages"),
        "contexts": path.resolve(__dirname, "./src/contexts"),
        "lib": path.resolve(__dirname, "./src/lib"),
        "utils": path.resolve(__dirname, "./src/utils"),
      },
    },
    build: {
      // Si on est en mode production (npm run build), on écrit dans /var/www
      // Sinon (local), on écrit dans dist/
      outDir: isProduction ? "/var/www/openclinic.cd/html" : "dist",
      emptyOutDir: true,
      
      // Désactiver les sourcemaps en production pour réduire la taille
      sourcemap: false,
      
      // Limite d'avertissement pour la taille des chunks (en KB)
      chunkSizeWarningLimit: 1000, // Augmenté car on a optimisé le code splitting
      
      // Minification optimisée avec esbuild
      minify: 'esbuild',
      // esbuild est plus rapide et offre une bonne compression
      // Pour une compression maximale, vous pouvez installer terser et utiliser 'terser'
      
      // Options esbuild pour éviter les problèmes avec React
      // Désactiver temporairement les options personnalisées pour tester
      // esbuild: {
      //   legalComments: 'none',
      //   minifyIdentifiers: false,
      //   minifySyntax: true,
      //   minifyWhitespace: true,
      //   keepNames: true,
      // },
      
      // Optimisation CSS
      cssCodeSplit: true,
      cssMinify: true,
      
      // Optimisation des assets
      assetsInlineLimit: 4096, // Inline les assets < 4KB
      assetsDir: 'assets',
      
      // Optimisation du rollup
      rollupOptions: {
        // Ne pas préserver les signatures d'entrée pour éviter les problèmes
        // preserveEntrySignatures: 'exports-only',
        output: {
          // Optimisation des noms de fichiers pour le cache
          entryFileNames: 'assets/js/[name]-[hash].js',
          chunkFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
              return `assets/media/[name]-[hash].${ext}`;
            }
            if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name)) {
              return `assets/images/[name]-[hash].${ext}`;
            }
            if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash].${ext}`;
            }
            return `assets/${ext}/[name]-[hash].${ext}`;
          },
          
          // Code splitting optimisé - Version simplifiée pour éviter les problèmes React
          manualChunks(id) {
            // CRITIQUE: Garder React et toutes ses dépendances directes dans le chunk principal
            // pour éviter les problèmes d'ordre de chargement
            if (id.includes('node_modules')) {
              // React, React-DOM et React-Router - NE PAS SÉPARER
              const isReact = id.includes('node_modules/react/') && !id.includes('react-dom');
              const isReactDOM = id.includes('node_modules/react-dom/') || 
                                 id.includes('node_modules/react-dom-client/') || 
                                 id.includes('node_modules/react-dom-server/');
              const isReactRouter = id.includes('node_modules/react-router/');
              
              // Dépendances React critiques - garder dans le chunk principal
              const isReactDependency = id.includes('node_modules/lucide-react/') ||
                                       id.includes('node_modules/@radix-ui/') ||
                                       id.includes('node_modules/framer-motion/') ||
                                       id.includes('node_modules/react-helmet/') ||
                                       id.includes('node_modules/react-hook-form/') ||
                                       id.includes('node_modules/react-signature-canvas/') ||
                                       id.includes('node_modules/@tanstack/react-query/') ||
                                       id.includes('node_modules/@reduxjs/') ||
                                       id.includes('node_modules/redux/');
              
              if (isReact || isReactDOM || isReactRouter || isReactDependency) {
                // Ne pas retourner de valeur = reste dans le chunk principal
                return;
              }
              
              // Axios (petit, utilisé partout, peut être séparé)
              if (id.includes('node_modules/axios/')) {
                return 'vendor-axios';
              }
              
              // Charts et visualisation
              if (id.includes('node_modules/recharts/')) {
                return 'vendor-recharts';
              }
              if (id.includes('node_modules/d3/')) {
                return 'vendor-d3';
              }
              
              // PDF et documents
              if (id.includes('node_modules/jspdf/')) {
                return 'vendor-pdf';
              }
              
              // Date utilities
              if (id.includes('node_modules/date-fns/')) {
                return 'vendor-dates';
              }
              
              // Autres vendors - chunks dédiés pour éviter vendor-other trop gros
              if (id.includes('node_modules/@adonisjs/')) {
                return 'vendor-adonis';
              }
              if (id.includes('node_modules/@testing-library/')) {
                return 'vendor-testing';
              }
              if (id.includes('node_modules/tailwind') ||
                  id.includes('node_modules/clsx') ||
                  id.includes('node_modules/class-variance-authority') ||
                  id.includes('node_modules/tailwind-merge')) {
                return 'vendor-css-utils';
              }
              if (id.includes('node_modules/@dhiwise/')) {
                return 'vendor-tools';
              }
              // Reste des node_modules (évite un seul chunk vendor-other trop gros)
              return 'vendor-other';
            }
            
            // CRITIQUE: Garder TOUS les chunks de l'application dans le chunk principal
            // pour éviter les problèmes d'ordre de chargement avec React
            // Les chunks sont chargés en parallèle et peuvent utiliser React avant qu'il ne soit disponible
            // Seule exception: les vendors peuvent être séparés car ils sont chargés après le chunk principal
            if (id.includes('/src/')) {
              // Tout le code source (pages, hooks, components, routes, contexts) reste dans le chunk principal
              // Cela garantit que React est toujours disponible quand le code s'exécute
              return; // Ne pas séparer = reste dans le chunk principal
            }
          },
          
          // Optimisation des exports
          exports: 'named',
        },
        
        // Optimisation des dépendances externes
        external: [],
      },
      
      // Optimisation de la compilation
      target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      
      // Rapport de build détaillé
      reportCompressedSize: true,
    },
    
    plugins: [
      tsconfigPaths(),
      react({
        // Optimisation React en production
        jsxRuntime: 'automatic',
        jsxImportSource: 'react',
      }),
      tagger(),
      
      // Compression Gzip (meilleure compatibilité)
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024, // Compresse seulement les fichiers > 1KB
        deleteOriginFile: false, // Garde les fichiers originaux
        compressionOptions: {
          level: 9, // Niveau de compression maximum
        },
      }),
      
      // Compression Brotli (meilleure compression, support moderne)
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false,
      }),
    ],
    
    server: {
      port: 2025,
      host: true, // Écoute sur 0.0.0.0 (toutes les interfaces)
      strictPort: true,
      allowedHosts: [
        ".amazonaws.com",
        "openclinic.cd",
        "localhost"
      ]
    },
    
    // Optimisation des dépendances pré-bundlées
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@reduxjs/toolkit',
        'redux',
        '@tanstack/react-query',
        'axios',
      ],
      exclude: [],
    },
    
    // Permet d'accéder à env.VITE_API_URL dans le code si besoin, 
    // mais normalement import.meta.env le fait déjà.
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
      // Supprime les warnings de développement en production
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  };
});
