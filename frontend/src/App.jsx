import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import AppRoutes from "./Routes";
import { useRealtime } from "./hooks/useRealtime";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Rafraîchir quand la fenêtre reprend le focus
      refetchOnMount: true, // Rafraîchir à chaque montage
      retry: (failureCount, error) => {
        // Ne pas retry sur les erreurs 4xx (sauf 429 rate limiting)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          // Retry uniquement pour le rate limiting (429)
          if (error?.response?.status === 429) {
            // Retry avec backoff exponentiel pour rate limiting
            return failureCount < 3;
          }
          return false;
        }
        // Retry pour les erreurs réseau et serveur (max 2 tentatives)
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => {
        // Backoff exponentiel : 1s, 2s, 4s...
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
      staleTime: 30 * 1000, // Considérer les données comme fraîches pendant 30 secondes
      gcTime: 5 * 60 * 1000, // Garder les données en cache pendant 5 minutes (anciennement cacheTime)
    },
    mutations: {
      retry: (failureCount, error) => {
        // Ne pas retry les mutations sur erreurs client (4xx)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry uniquement pour les erreurs réseau/serveur (1 tentative)
        return failureCount < 1;
      },
      retryDelay: 1000,
    },
  },
});

const AppContent = () => {
  useRealtime();

  return (
    <>
      <AppRoutes />
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <CurrencyProvider>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </CurrencyProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;