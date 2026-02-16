// openclinic/frontend/src/contexts/ToastContext.jsx

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/AppIcon';

// 1. Définition du Context
const ToastContext = createContext({});

// 2. Hook pour utiliser le toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast doit être utilisé dans un ToastProvider");
    }
    return context;
};

// 3. Composant Toast (l'UI de la notification)
const ToastComponent = ({ id, type, message, duration = 3000, onClose }) => {
    const baseStyle = "flex items-center gap-3 p-4 rounded-xl shadow-lg border";
    let icon, styles;

    switch (type) {
        case 'success':
            icon = 'CheckCircle';
            styles = {
                bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                text: 'text-emerald-800 dark:text-emerald-300',
                border: 'border-emerald-200 dark:border-emerald-800',
            };
            break;
        case 'error':
            icon = 'AlertTriangle';
            styles = {
                bg: 'bg-rose-50 dark:bg-rose-900/20',
                text: 'text-rose-800 dark:text-rose-300',
                border: 'border-rose-200 dark:border-rose-800',
            };
            break;
        default: // info
            icon = 'Info';
            styles = {
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                text: 'text-blue-800 dark:text-blue-300',
                border: 'border-blue-200 dark:border-blue-800',
            };
            break;
    }

    // Auto-fermeture
    React.useEffect(() => {
        const timer = setTimeout(() => onClose(id), duration);
        return () => clearTimeout(timer);
    }, [duration, id, onClose]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`${baseStyle} ${styles.bg} ${styles.border} ${styles.text} max-w-sm backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-shadow duration-300`}
            role="alert"
            whileHover={{ scale: 1.02 }}
        >
            <div className={`p-2 rounded-lg ${styles.bg} ${styles.border} border`}>
                <Icon name={icon} size={20} className="flex-shrink-0" />
            </div>
            <p className="text-sm font-semibold flex-1 leading-relaxed">{message}</p>
            <button 
                onClick={() => onClose(id)} 
                className={`${styles.text.replace(/800|300/g, '600')} opacity-70 hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5`}
            >
                <Icon name="X" size={16} />
            </button>
        </motion.div>
    );
};

// 4. Toast Provider (Gestionnaire de liste)
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const queueRef = React.useRef([]);
    
    // Fonction pour afficher le prochain toast de la queue
    const showNextFromQueue = useCallback(() => {
        setToasts((prev) => {
            // Si on a déjà un toast affiché, on ne fait rien
            if (prev.length > 0) {
                return prev;
            }
            
            // Si la queue est vide, on ne fait rien
            if (queueRef.current.length === 0) {
                return prev;
            }
            
            // Prendre le premier toast de la queue et l'afficher
            const nextToast = queueRef.current.shift();
            return [nextToast];
        });
    }, []);
    
    // Fonction pour ajouter un toast
    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random(); // ID unique même si appelé en même temps
        const newToast = { id, message, type, duration };
        
        setToasts((prev) => {
            // Si aucun toast n'est affiché, on l'affiche directement
            if (prev.length === 0) {
                return [newToast];
            }
            // Sinon, on l'ajoute à la queue
            queueRef.current.push(newToast);
            return prev;
        });
    }, []);

    // Fonction pour fermer un toast
    const removeToast = useCallback((id) => {
        setToasts((prev) => {
            // Retirer le toast fermé
            const filtered = prev.filter((t) => t.id !== id);
            
            // Si le toast a été fermé et qu'il n'y a plus de toast affiché,
            // on affiche le prochain de la queue après un court délai pour la transition
            if (filtered.length === 0 && queueRef.current.length > 0) {
                setTimeout(() => {
                    showNextFromQueue();
                }, 300); // Petit délai pour laisser l'animation de sortie se terminer
            }
            
            return filtered;
        });
    }, [showNextFromQueue]);
    
    // Essayer d'afficher le prochain toast quand la liste des toasts devient vide
    React.useEffect(() => {
        if (toasts.length === 0 && queueRef.current.length > 0) {
            // Petit délai pour laisser l'animation de sortie se terminer
            const timer = setTimeout(() => {
                showNextFromQueue();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [toasts.length, showNextFromQueue]);

    const value = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            
            {/* Conteneur des Toasts (Fixe en bas à droite) */}
            <div className="fixed bottom-0 right-0 p-4 md:p-6 space-y-3 z-[100000] pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <ToastComponent
                            key={toast.id}
                            {...toast}
                            onClose={removeToast}
                            className="pointer-events-auto"
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;