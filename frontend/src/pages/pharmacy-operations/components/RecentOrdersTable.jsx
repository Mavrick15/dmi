import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';
import { useCurrency } from '../../../contexts/CurrencyContext';

const RecentOrdersTable = ({ orders, loading, onReceiveOrder, onViewOrderDetails, onViewHistory }) => {
  const { formatCurrency } = useCurrency();
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
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
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${config.color} ${config.text}`}>
        <Icon name={config.icon} size={12} className={status === 'commandee' ? 'animate-spin' : ''} />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-center gap-3 py-12">
        <Icon name="Loader2" size={28} className="animate-spin text-primary" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement des commandes…</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 border border-slate-200 dark:border-slate-700">
          <Icon name="ShoppingCart" size={28} className="text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucune commande récente</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Utilisez « Nouvelle commande » pour créer une commande.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
           <h3 className="text-lg font-bold text-slate-900 dark:text-white">Commandes Récentes</h3>
           <p className="text-xs text-slate-500 dark:text-slate-400">Les 10 dernières soumissions</p>
        </div>
        <Button variant="ghost" size="sm" className="rounded-xl" iconName="ArrowRight" onClick={() => onViewHistory?.()}>
          Voir l'historique
        </Button>
      </div>
      
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Commande / Suivi</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Fournisseur</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Montant</th>
              <th className="text-center py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="py-4 px-6">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{order.orderNumber}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{order.trackingNumber}</div>
                </td>
                <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">{order.supplier}</td>
                <td className="py-4 px-6">
                    <div className="text-sm text-slate-600 dark:text-slate-400">{formatDate(order.date)}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Est. Liv.: {order.deliveryDate !== 'N/A' ? formatDate(order.deliveryDate) : 'N/A'}</div>
                </td>
                <td className="py-4 px-6 text-right">
                    <div className="font-bold text-slate-900 dark:text-white">{formatCurrency(order.totalAmount)}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{order.items} articles</div>
                </td>
                <td className="py-4 px-6 text-center">
                    {getStatusBadge(order.status)}
                </td>
                <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        
                        {/* Bouton pour Réceptionner */}
                        {(order.status === 'commandee' || order.status === 'partiellement_recue') && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                iconName="PackageCheck" 
                                className="dark:border-slate-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20 h-8"
                                title="Recevoir Stock"
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  if (onReceiveOrder) {
                                    onReceiveOrder(order.id);
                                  }
                                }}
                            >
                                Recevoir
                            </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-primary dark:hover:text-blue-400" 
                          title="Détails" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewOrderDetails) {
                              onViewOrderDetails(order.id, order);
                            }
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
