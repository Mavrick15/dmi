// openclinic/frontend/src/components/ui/ConfirmationModal.jsx

import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import Button from './Button';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmer l'action",
  message = "Êtes-vous sûr de vouloir continuer ? Cette action ne peut être annulée.",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  iconName = "AlertTriangle",
  iconColor = "text-rose-500",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  // Empêcher le scroll du body quand la modale est ouverte
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 999999, position: 'fixed' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 1000000, position: 'relative' }}
          >
            <div className="relative z-10 w-full">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 mx-auto ${iconColor.replace('text', 'bg').replace('500', '100').replace('600', '100')}`}
              >
                <Icon name={iconName} size={28} className={iconColor} />
              </motion.div>

              <motion.h3
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-xl font-bold text-slate-900 dark:text-white mb-2"
                dangerouslySetInnerHTML={{ __html: title }}
              />
              
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-slate-600 dark:text-slate-400 mb-8"
                dangerouslySetInnerHTML={{ __html: message }}
              />

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex w-full gap-3"
              >
                <Button 
                  variant="outline" 
                  fullWidth 
                  onClick={onClose} 
                  disabled={isLoading}
                  className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {cancelLabel}
                </Button>
                <Button 
                  variant="destructive" 
                  fullWidth 
                  onClick={handleConfirm} 
                  loading={isLoading}
                  disabled={isLoading}
                  className="shadow-sm hover:shadow-md"
                >
                  {confirmLabel}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Utiliser React Portal pour rendre le modal directement dans le body
  // Cela garantit qu'il sera toujours au-dessus de tous les autres éléments
  if (typeof document !== 'undefined') {
    return ReactDOM.createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default ConfirmationModal;