import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import api from '../../../lib/axios';

const ConsultationAnalyses = ({ consultationId, patientId }) => {
  const navigate = useNavigate();

  const { data: analysesData, isLoading } = useQuery({
    queryKey: ['analyses', 'consultation', consultationId],
    queryFn: async () => {
      if (!consultationId) return { data: [] };
      try {
        const response = await api.get('/analyses', {
          params: { consultationId, limit: 100 }
        });
        return response.data.success ? response.data : { data: [] };
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors de la récupération des analyses:', error);
        }
        return { data: [] };
      }
    },
    enabled: !!consultationId,
    retry: 1,
  });

  const analyses = analysesData?.data || analysesData || [];

  const getStatutBadge = (statut) => {
    const badges = {
      prescrite: { variant: 'info', label: 'Prescrite' },
      en_cours: { variant: 'warning', label: 'En cours' },
      terminee: { variant: 'success', label: 'Terminée' },
      annulee: { variant: 'error', label: 'Annulée' },
      en_attente_validation: { variant: 'warning', label: 'En attente' }
    };
    return badges[statut] || { variant: 'info', label: statut };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 border-l-4 border-l-primary">
        <Icon name="Loader2" size={24} className="animate-spin text-primary mb-2" />
        <span className="text-sm text-slate-500 dark:text-slate-400">Chargement…</span>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="TestTube" size={18} className="text-slate-600 dark:text-slate-400" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Analyses prescrites</h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconName="Plus"
            onClick={() => navigate(`/analyses-laboratoire?patientId=${patientId}&prescribe=true&consultationId=${consultationId}`)}
            className="text-xs"
          >
            Prescrire
          </Button>
        </div>
        <EmptyState
          icon="TestTube"
          title="Aucune analyse"
          description="Aucune analyse n'a été prescrite lors de cette consultation."
          size="sm"
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="TestTube" size={18} className="text-primary" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Analyses prescrites ({analyses.length})
          </h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconName="Plus"
          onClick={() => navigate(`/analyses-laboratoire?patientId=${patientId}&prescribe=true&consultationId=${consultationId}`)}
          className="text-xs"
        >
          Ajouter
        </Button>
      </div>

      <div className="space-y-2">
        {Array.isArray(analyses) && analyses.map((analyse, idx) => {
          if (!analyse || typeof analyse !== 'object') return null;
          const statutBadge = getStatutBadge(analyse.statut);
          return (
            <motion.div
              key={analyse.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="TestTube" size={16} className="text-primary flex-shrink-0" />
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {analyse.typeAnalyse?.replace('_', ' ').toUpperCase() || 'Analyse'}
                    </p>
                    <Badge variant={statutBadge.variant} size="sm">
                      {statutBadge.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Icon name="Hash" size={12} />
                      <span className="font-mono">{analyse.numeroAnalyse}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Calendar" size={12} />
                      <span>{formatDate(analyse.datePrescription)}</span>
                    </div>
                    {analyse.priorite === 'urgente' && (
                      <Badge variant="error" size="xs">Urgent</Badge>
                    )}
                    {analyse.priorite === 'critique' && (
                      <Badge variant="error" size="xs">Critique</Badge>
                    )}
                  </div>
                  {analyse.notesPrescription && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 italic truncate">
                      {analyse.notesPrescription}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Eye"
                  onClick={() => navigate(`/analyses-laboratoire?analyseId=${analyse.id}`)}
                  className="ml-2 text-xs flex-shrink-0"
                >
                  Voir
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ConsultationAnalyses;

