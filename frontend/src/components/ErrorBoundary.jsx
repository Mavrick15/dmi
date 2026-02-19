import React from "react";
import Icon from "./AppIcon";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    error.__ErrorBoundary = true;
    // Vous pouvez logger l'erreur ici vers un service externe (Sentry, etc.)
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full text-center">
            
            {/* Icône d'erreur */}
            <div className="mb-6 mx-auto w-16 h-16 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 flex items-center justify-center">
              <Icon name="AlertTriangle" size={32} className="text-rose-500 dark:text-rose-400" />
            </div>

            <div className="flex flex-col gap-2 mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Oups ! Une erreur est survenue.
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Nous avons rencontré un problème inattendu. Ne vous inquiétez pas, aucune donnée n'a été perdue.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {/* Bouton Recharger (Primaire) */}
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                <Icon name="RefreshCw" size={18} />
                Rafraîchir la page
              </button>

              {/* Bouton Accueil (Secondaire) */}
              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                className="flex items-center justify-center gap-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium py-3 px-4 rounded-xl transition-all duration-200"
              >
                <Icon name="Home" size={18} />
                Retour à l'accueil
              </button>
            </div>

            {/* Détails techniques (Optionnel - visible en dev seulement) */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <div className="mt-8 text-left">
                <details className="text-xs text-slate-400 cursor-pointer">
                  <summary className="hover:text-slate-600 mb-2">Détails techniques</summary>
                  <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-auto max-h-32 border border-slate-200 dark:border-slate-700">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              </div>
            )}

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;