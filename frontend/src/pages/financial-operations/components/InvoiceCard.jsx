import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import Badge from '../../../components/ui/Badge';
import Image from '../../../components/AppImage';
import { useCurrency } from '../../../contexts/CurrencyContext';

const InvoiceCard = ({ invoice, onView, onPay, onDownload, onPrint }) => {
  const { hasPermission } = usePermissions();
  const { formatCurrency } = useCurrency();
  
  const getStatusConfig = (status) => {
    const configs = {
      'payee': { 
        label: 'Payée', 
        color: 'success',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        icon: 'CheckCircle'
      },
      'en_attente': { 
        label: 'En attente', 
        color: 'warning',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-400',
        icon: 'Clock'
      },
      'en_retard': { 
        label: 'En retard', 
        color: 'error',
        bg: 'bg-rose-50 dark:bg-rose-900/20',
        text: 'text-rose-700 dark:text-rose-400',
        icon: 'AlertCircle'
      },
      'annulee': { 
        label: 'Annulée', 
        color: 'default',
        bg: 'bg-slate-50 dark:bg-slate-800',
        text: 'text-slate-600 dark:text-slate-400',
        icon: 'XCircle'
      }
    };
    return configs[status] || configs['en_attente'];
  };

  const statusConfig = getStatusConfig(invoice.statut);
  const montantRestant = invoice.montantTotal - (invoice.montantPaye || 0);
  const pourcentagePaye = invoice.montantTotal > 0 ? ((invoice.montantPaye || 0) / invoice.montantTotal) * 100 : 0;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };


  const getDaysOverdue = (dateEcheance) => {
    if (!dateEcheance) return null;
    const today = new Date();
    const dueDate = new Date(dateEcheance);
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const daysOverdue = invoice.dateEcheance ? getDaysOverdue(invoice.dateEcheance) : null;

  const getGradientBg = () => {
    if (invoice.statut === 'payee') return 'from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20';
    if (invoice.statut === 'en_retard') return 'from-rose-50 via-white to-rose-50/50 dark:from-rose-950/30 dark:via-slate-900 dark:to-rose-950/20';
    if (invoice.statut === 'en_attente') return 'from-amber-50 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20';
    return 'from-blue-50 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20';
  };

  const getBorderColor = () => {
    if (invoice.statut === 'payee') return 'border-emerald-100 dark:border-emerald-900/50';
    if (invoice.statut === 'en_retard') return 'border-rose-100 dark:border-rose-900/50';
    if (invoice.statut === 'en_attente') return 'border-amber-100 dark:border-amber-900/50';
    return 'border-blue-100 dark:border-blue-900/50';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`group relative bg-gradient-to-br ${getGradientBg()} border ${getBorderColor()} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all overflow-hidden`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            {(invoice.patient?.avatar || invoice.patient?.user?.photoProfil) && (
              <div className="relative flex-shrink-0">
                <Image 
                  src={invoice.patient?.avatar || invoice.patient?.user?.photoProfil} 
                  alt={invoice.patient?.name || invoice.patient?.user?.nomComplet || 'Patient'} 
                  className="w-14 h-14 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700"
                />
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                  {invoice.patient?.name || invoice.patient?.user?.nomComplet || 'Patient inconnu'}
                </h4>
                <Badge variant={statusConfig.color} size="sm" className="shadow-sm">
                  <Icon name={statusConfig.icon} size={12} className="mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Icon name="FileText" size={12} />
                  <span className="font-mono font-semibold">{invoice.numeroFacture}</span>
                </div>
                {invoice.patient?.numeroPatient && (
                  <div className="flex items-center gap-1.5">
                    <Icon name="User" size={12} />
                    <span>{invoice.patient.numeroPatient}</span>
                  </div>
                )}
                {invoice.dateEmission && (
                  <div className="flex items-center gap-1.5">
                    <Icon name="Calendar" size={12} />
                    <span>Émise: {formatDate(invoice.dateEmission)}</span>
                  </div>
                )}
                {invoice.dateEcheance && (
                  <div className="flex items-center gap-1.5">
                    <Icon name="Clock" size={12} />
                    <span>Échéance: {formatDate(invoice.dateEcheance)}</span>
                    {daysOverdue && (
                      <span className="ml-1 px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-full font-bold">
                        J+{daysOverdue}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Montants (widget compact) */}
        <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-800/50 dark:via-slate-900/50 dark:to-slate-800/30 rounded-lg px-3 py-2 mb-3 border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Total
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {formatCurrency(invoice.montantTotal)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Payé
              </div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                {formatCurrency(invoice.montantPaye || 0)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Reste
              </div>
              <div className={`text-sm font-bold leading-tight ${montantRestant > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {formatCurrency(montantRestant)}
              </div>
            </div>
          </div>
          {invoice.montantTotal > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pourcentagePaye}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    pourcentagePaye === 100 ? 'bg-emerald-500' : 'bg-primary'
                  }`}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tabular-nums">{Math.round(pourcentagePaye)}%</span>
            </div>
          )}
        </div>

        {/* Informations supplémentaires */}
        {invoice.notes && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-900 dark:text-amber-100">{invoice.notes}</p>
            </div>
          </div>
        )}

        {invoice.consultationId && (
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Icon name="Stethoscope" size={12} />
            <span>Liée à une consultation</span>
          </div>
        )}

        {/* Actions */}
        <div className={`flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700 ${!onView ? 'justify-center' : ''}`}>
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView?.(invoice)}
              className="flex-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Icon name="Eye" size={16} className="mr-1" />
              Voir
            </Button>
          )}
          {montantRestant > 0 && invoice.statut !== 'annulee' && invoice.statut !== 'payee' && (
            <PermissionGuard requiredPermission="payment_process">
              <Button
                variant="default"
                size="sm"
                onClick={() => onPay?.(invoice)}
                disabled={!hasPermission('payment_process')}
                className={onView ? "flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20" : "px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20"}
              >
                <Icon name="CreditCard" size={16} className="mr-1" />
                Payer
              </Button>
            </PermissionGuard>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDownload?.(invoice)}
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Télécharger"
          >
            <Icon name="Download" size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPrint?.(invoice)}
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Imprimer"
          >
            <Icon name="Printer" size={18} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default InvoiceCard;

