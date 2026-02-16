import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * Wrapper d'animation pour les modales
 * Fournit des animations fluides d'apparition et de disparition
 */
const AnimatedModal = ({ isOpen, onClose, children, className, closeOnBackdropClick = true, usePortal = false }) => {
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={closeOnBackdropClick ? onClose : undefined}
        >
          {/* Backdrop avec animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
          />

          {/* Modal Content avec animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
            onClick={(e) => e.stopPropagation()}
            className={cn('relative', className)}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (usePortal) {
    return ReactDOM.createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default AnimatedModal;
