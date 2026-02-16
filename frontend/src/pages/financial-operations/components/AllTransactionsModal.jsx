import { motion } from 'framer-motion';
import Modal from '../../../components/ui/Modal';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import { useCurrency } from '../../../contexts/CurrencyContext';

const AllTransactionsModal = ({ isOpen, onClose, transactions = [] }) => {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Toutes les Transactions"
      icon="CreditCard"
      size="xl"
      footer={
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Fermer
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Historique complet des entrées et sorties de caisse ({transactions.length} transaction{transactions.length > 1 ? 's' : ''})
        </div>
        
        <div className="overflow-x-auto custom-scrollbar max-h-[600px]">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">N° Facture</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Service</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Montant</th>
                <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Icon name="Inbox" size={48} className="text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Aucune transaction</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Les transactions apparaîtront ici</p>
                    </div>
                  </td>
                </tr>
              ) : (
                Array.isArray(transactions) && transactions.map((tx, idx) => {
                  if (!tx || typeof tx !== 'object') return null;
                  return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Image 
                            src={tx.patientAvatar} 
                            alt={tx.patientName} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-slate-900 rounded-full p-0.5">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {tx.patientName || 'Patient inconnu'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {tx.facture?.numeroFacture ? (
                        <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {tx.facture.numeroFacture}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400 dark:text-slate-500 italic">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                      {tx.service}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{tx.date}</div>
                      <div className="text-xs text-slate-400">{tx.time}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(tx.status)}
                    </td>
                  </tr>
                );
              }).filter(Boolean)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default AllTransactionsModal;

