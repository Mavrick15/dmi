import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { formatDateInBusinessTimezone } from '../../../utils/dateTime';

const RecentOrdersTable = ({ orders, loading, onReceiveOrder, onViewOrderDetails, onViewHistory }) => {
  const { formatCurrency } = useCurrency();
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return formatDateInBusinessTimezone(dateString);
    } catch (error) {
      return 'N/A';
    }
  };
  
  const getStatusBadge = (status) => {
    const statusConfig = {
      recue: { 
        color: 'bg-emerald-50 dark:bg-emerald-900/20', 
        text: 'text-emerald-700 dark:text-emerald-400', 
        icon: 'PackageCheck',
        label: 'Reçue'
      },
      commandee: { 
        color: 'bg-blue-50 dark:bg-blue-900/20', 
        text: 'text-blue-700 dark:text-blue-400', 
        icon: 'Clock',
        label: 'Commandée'
      },
      partiellement_recue: { 
        color: 'bg-amber-50 dark:bg-amber-900/20', 
        text: 'text-amber-700 dark:text-amber-400', 
        icon: 'AlertTriangle',
        label: 'Partiellement reçue'
      },
      annulee: { 
        color: 'bg-rose-50 dark:bg-rose-900/20', 
        text: 'text-rose-700 dark:text-rose-400', 
        icon: 'XCircle',
        label: 'Annulée'
      }
    };
    const config = statusConfig[status] || statusConfig.commandee;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-transparent ${config.color} ${config.text}`}>
        <Icon name={config.icon} size={12} />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/20 dark:border-white/10 border-l-4 border-l-primary glass-surface flex flex-col items-center justify-center gap-3 py-12">
        <Icon name="Loader2" size={28} className="animate-spin text-primary" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement…</span>
      </div>
    );
  }

  if (!Array.isArray(orders) || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 rounded-xl border border-white/20 dark:border-white/10 glass-surface">
        <div className="w-14 h-14 rounded-xl glass-surface flex items-center justify-center mb-4">
          <Icon name="ShoppingCart" size={28} className="text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucune commande récente</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Utilisez « Nouvelle commande » pour créer une commande.</p>
      </div>
    );
  }

  return (
    <div className="border border-white/20 dark:border-white/10 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-white/20 dark:border-white/10 glass-surface flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <Icon name="Package" size={20} className="text-primary dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Commandes récentes</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Dernières commandes fournisseur</p>
          </div>
        </div>
        {onViewHistory && (
          <Button variant="outline" size="sm" className="rounded-xl" iconName="History" onClick={() => onViewHistory()}>
            Historique
          </Button>
        )}
      </div>
      
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto custom-scrollbar">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-white/20 dark:border-white/10 sticky top-0 z-10">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Commande</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fournisseur</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
              <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Montant</th>
              <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20 dark:divide-white/10 backdrop-blur-xl bg-white/50 dark:bg-white/10">
{orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="py-3 px-4">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">{order.orderNumber || order.numeroCommande || '—'}</div>
                  {(order.trackingNumber || order.numeroSuivi) && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{order.trackingNumber || order.numeroSuivi}</div>
                  )}
                </td>
                <td className="py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">{order.supplier || order.fournisseur?.nom || '—'}</td>
                <td className="py-3 px-4">
                  <div className="text-sm text-slate-700 dark:text-slate-300">{formatDate(order.date || order.dateCommande)}</div>
                  {(order.deliveryDate || order.dateLivraisonPrevue) && order.deliveryDate !== 'N/A' && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Liv. prévue : {formatDate(order.deliveryDate || order.dateLivraisonPrevue)}</div>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(order.totalAmount || order.montantTotal || 0)}</div>
                  {(order.items != null || order.nombreArticles != null) && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{order.items ?? order.nombreArticles} article{(order.items ?? order.nombreArticles) !== 1 ? 's' : ''}</div>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  {getStatusBadge(order.status || order.statut)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1.5">
                    {(order.status === 'commandee' || order.status === 'partiellement_recue' || order.statut === 'commandee' || order.statut === 'partiellement_recue') && onReceiveOrder && (
                      <Button
                        variant="outline"
                        size="sm"
                        iconName="PackageCheck"
                        className="rounded-lg h-8 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        title="Réceptionner"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReceiveOrder(order.id);
                        }}
                      >
                        Recevoir
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-slate-500 hover:text-primary dark:hover:text-blue-400"
                      title="Détails"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewOrderDetails) onViewOrderDetails(order.id, order);
                      }}
                    >
                      <Icon name="Eye" size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrdersTable;
