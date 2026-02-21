import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';
import { useCurrency } from '../../../contexts/CurrencyContext';

const RecentTransactionsTable = ({ transactions = [], onViewAll }) => {
  const { formatCurrency } = useCurrency();
  
  const getStatusBadge = (status) => {
    const configs = {
      'Payé': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', icon: 'CheckCircle' },
      'En attente': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', icon: 'Clock' },
      'Refusé': { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-400', icon: 'XCircle' }
    };
    const config = configs[status] || configs['En attente'];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${config.bg} ${config.text}`}>
        <Icon name={config.icon} size={12} />
        {status}
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-white/20 dark:border-white/10 flex justify-between items-center">
        <div>
           <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dernières Transactions</h3>
           <p className="text-xs text-slate-500">Entrées et sorties de caisse</p>
        </div>
        {onViewAll && (
          <Button 
            variant="ghost" 
            size="sm" 
            iconName="ArrowRight"
            onClick={onViewAll}
          >
            Tout voir
          </Button>
        )}
      </div>
      
      <div className="overflow-y-auto overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full">
          <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-white/20 dark:border-white/10 sticky top-0 z-10">
            <tr>
              <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">N° Facture</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Service</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Montant</th>
              <th className="text-center py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20 dark:divide-white/10">
            {Array.isArray(transactions) && transactions.map((tx, idx) => {
              if (!tx || typeof tx !== 'object') return null;
              return (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                        <Image src={tx.patientAvatar} alt={tx.patientName} className="w-10 h-10 rounded-full object-cover border border-white/20 dark:border-white/10" />
                        <div className="absolute -bottom-0.5 -right-0.5 backdrop-blur-xl bg-white/50 dark:bg-white/10 rounded-full p-0.5">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                        </div>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{tx.patientName || 'Patient inconnu'}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  {tx.facture?.numeroFacture ? (
                    <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {tx.facture.numeroFacture}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400 dark:text-slate-500 italic">N/A</span>
                  )}
                </td>
                <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-300">
                    {tx.service}
                </td>
                <td className="py-4 px-6">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{tx.date}</div>
                    <div className="text-xs text-slate-400">{tx.time}</div>
                </td>
                <td className="py-4 px-6 text-right">
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</span>
                </td>
                <td className="py-4 px-6 text-center">
                    {getStatusBadge(tx.status)}
                </td>
              </tr>
            );
          }).filter(Boolean)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentTransactionsTable;