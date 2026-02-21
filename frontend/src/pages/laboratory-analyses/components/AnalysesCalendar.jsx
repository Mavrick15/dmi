import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { useAnalysesList } from '../../../hooks/useAnalyses';
import { useNavigate } from 'react-router-dom';

const AnalysesCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Récupérer toutes les analyses pour le mois
  const { data: analysesData, isLoading } = useAnalysesList({
    limit: 1000
  });

  const analyses = analysesData?.data || analysesData || [];

  // Grouper les analyses par date
  const analysesByDate = useMemo(() => {
    const grouped = {};
    analyses.forEach(analyse => {
      try {
        let dateKey = null;
        
        // Utiliser la date de prélèvement si disponible, sinon la date de prescription
        if (analyse.datePrelevement) {
          const date = new Date(analyse.datePrelevement);
          if (!isNaN(date.getTime())) {
            dateKey = format(date, 'yyyy-MM-dd');
          }
        } else if (analyse.datePrescription) {
          const date = new Date(analyse.datePrescription);
          if (!isNaN(date.getTime())) {
            dateKey = format(date, 'yyyy-MM-dd');
          }
        }

        if (dateKey) {
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(analyse);
        }
      } catch (error) {
        // Ignorer les analyses avec des dates invalides
        console.warn('Date invalide pour l\'analyse:', analyse.id, error);
      }
    });
    return grouped;
  }, [analyses]);

  // Générer les jours du mois
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: fr });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getAnalysesForDate = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return analysesByDate[dateKey] || [];
  };

  const getDayAnalysesCount = (date) => {
    return getAnalysesForDate(date).length;
  };

  const getDayAnalysesByStatus = (date) => {
    const dayAnalyses = getAnalysesForDate(date);
    return {
      prescrite: dayAnalyses.filter(a => a.statut === 'prescrite').length,
      en_cours: dayAnalyses.filter(a => a.statut === 'en_cours').length,
      terminee: dayAnalyses.filter(a => a.statut === 'terminee').length,
      annulee: dayAnalyses.filter(a => a.statut === 'annulee').length
    };
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/20 dark:border-white/10 glass-surface border-l-4 border-l-primary flex flex-col items-center justify-center gap-3 py-16">
        <Icon name="Loader2" size={28} className="animate-spin text-primary" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement du calendrier…</span>
      </div>
    );
  }

  const selectedAnalyses = selectedDate ? getAnalysesForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            iconName="ChevronLeft"
            onClick={goToPreviousMonth}
          />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            iconName="ChevronRight"
            onClick={goToNextMonth}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
        >
          Aujourd'hui
        </Button>
      </div>

      {/* Calendrier */}
      <div className="glass-panel rounded-xl overflow-hidden">
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 glass-surface border-b border-white/20 dark:border-white/10">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, idx) => (
            <div
              key={idx}
              className="p-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const analysesCount = getDayAnalysesCount(day);
            const statusCounts = getDayAnalysesByStatus(day);
            const dayAnalyses = getAnalysesForDate(day);
            
            // Déterminer si le jour est dans les premières lignes (pour afficher le tooltip en bas)
            const rowIndex = Math.floor(idx / 7);
            const showTooltipBelow = rowIndex < 2;
            
            const tooltipContent = analysesCount > 0 ? (
              <div className="text-left">
                <div className="font-semibold mb-2 text-sm">{format(day, 'd MMMM yyyy', { locale: fr })}</div>
                <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
                  {dayAnalyses.map((analyse, analyseIdx) => (
                    <div key={analyseIdx} className="flex items-start gap-2 py-1 border-b border-slate-700/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{analyse.numeroAnalyse}</div>
                        <div className="text-slate-400 capitalize truncate">{analyse.typeAnalyse?.replace('_', ' ')}</div>
                        {analyse.patient && (
                          <div className="text-slate-500 text-[10px] truncate">
                            {analyse.patient.name || analyse.patient.numeroPatient}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.01 }}
                onClick={() => {
                  if (isCurrentMonth) {
                    setSelectedDate(day);
                  }
                }}
                className={`
                  min-h-[100px] p-2 border-r border-b border-white/20 dark:border-white/10 relative group
                  ${!isCurrentMonth ? 'bg-slate-50 dark:bg-slate-950 opacity-50' : 'backdrop-blur-xl bg-white/50 dark:bg-white/10'}
                  ${isToday ? 'ring-2 ring-primary ring-inset' : ''}
                  ${isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''}
                  ${isCurrentMonth ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : ''}
                  transition-colors
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`
                      text-sm font-semibold
                      ${isToday ? 'text-primary' : isCurrentMonth ? 'text-slate-900 dark:text-white' : 'text-slate-400'}
                    `}
                  >
                    {format(day, 'd')}
                  </span>
                  {analysesCount > 0 && (
                    <Badge variant="info" size="sm">
                      {analysesCount}
                    </Badge>
                  )}
                </div>

                {/* Indicateurs de statut */}
                {analysesCount > 0 && (
                  <div className="space-y-1 mt-2">
                    {statusCounts.prescrite > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {statusCounts.prescrite}
                        </span>
                      </div>
                    )}
                    {statusCounts.en_cours > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {statusCounts.en_cours}
                        </span>
                      </div>
                    )}
                    {statusCounts.terminee > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {statusCounts.terminee}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tooltip au survol */}
                {analysesCount > 0 && tooltipContent && (
                  <div className={`absolute z-50 left-1/2 -translate-x-1/2 w-72 p-4 bg-slate-900 dark:bg-slate-800 text-white rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 border border-slate-700 ${
                    showTooltipBelow ? 'top-full mt-2' : 'bottom-full mb-2'
                  }`}>
                    {tooltipContent}
                    <div className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 dark:bg-slate-800 rotate-45 border-r border-b border-slate-700 ${
                      showTooltipBelow ? 'top-0 -mt-1.5' : 'bottom-0 -mb-1.5'
                    }`}></div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Liste des analyses pour la date sélectionnée */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="Calendar" size={20} className="text-primary" />
              Analyses du {format(selectedDate, 'd MMMM yyyy', { locale: fr })}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              onClick={() => setSelectedDate(null)}
            >
              Fermer
            </Button>
          </div>

          {selectedAnalyses.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Aucune analyse prévue pour cette date
            </div>
          ) : (
            <div className="space-y-3">
              {selectedAnalyses.map((analyse) => (
                <motion.div
                  key={analyse.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => navigate(`/analyses-laboratoire?analyseId=${analyse.id}`)}
                  className="p-4 border border-white/20 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {analyse.numeroAnalyse}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                        {analyse.typeAnalyse?.replace('_', ' ')}
                      </p>
                      {analyse.patient && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Patient: {analyse.patient.name || analyse.patient.numeroPatient}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          analyse.statut === 'terminee' ? 'success' :
                          analyse.statut === 'en_cours' ? 'warning' :
                          analyse.statut === 'annulee' ? 'error' : 'info'
                        }
                        size="sm"
                      >
                        {analyse.statut}
                      </Badge>
                      <Icon name="ChevronRight" size={16} className="text-slate-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AnalysesCalendar;

