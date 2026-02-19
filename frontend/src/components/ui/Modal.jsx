import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  className,
  headerClassName,
  bodyClassName,
  footer,
  icon,
  iconColor = 'text-primary',
}) => {
  // Empêcher le scroll du body quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-7xl',
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={closeOnBackdropClick ? onClose : undefined}
        >
          {/* Backdrop avec blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700',
              'w-full flex flex-col max-h-[90vh] overflow-hidden',
              sizes[size],
              className
            )}
          >
            {/* Header */}
            {(title || icon || showCloseButton) && (
              <div
                className={cn(
                  'flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700',
                  'bg-slate-50 dark:bg-slate-800/50',
                  headerClassName
                )}
              >
                <div className="flex items-center gap-3">
                  {icon && (
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconColor.replace('text', 'bg').replace('-500', '-100').replace('-600', '-100'))}>
                      <Icon name={icon} size={20} className={iconColor} />
                    </div>
                  )}
                  {title && (
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {title}
                    </h2>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                  >
                    <Icon name="X" size={18} className="text-slate-500 dark:text-slate-400" />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div
              className={cn(
                'flex-1 overflow-y-auto custom-scrollbar p-6',
                bodyClassName
              )}
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;

