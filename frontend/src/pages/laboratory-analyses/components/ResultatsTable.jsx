import { motion } from 'framer-motion';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import ResultatComments from './ResultatComments';
import { formatDateInBusinessTimezone } from '../../../utils/dateTime';

const ResultatsTable = ({ resultats, onValidate, analyse, onEdit }) => {
  const getInterpretationBadge = (interpretation) => {
    const badges = {
      normal: { variant: 'success', label: 'Normal', color: 'text-emerald-600' },
      anormal_bas: { variant: 'warning', label: 'Bas', color: 'text-amber-600' },
      anormal_haut: { variant: 'warning', label: 'Haut', color: 'text-amber-600' },
      critique: { variant: 'error', label: 'Critique', color: 'text-rose-600' }
    };
    return badges[interpretation] || { variant: 'info', label: interpretation, color: 'text-slate-600' };
  };

  if (!resultats || resultats.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center border-l-4 border-l-primary">
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl glass-surface flex items-center justify-center">
          <Icon name="FileText" size={28} className="text-slate-500 dark:text-slate-400" />
        </div>
        <p className="font-medium text-slate-700 dark:text-slate-300">Aucun résultat enregistré</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Les résultats s'afficheront après saisie ou import.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-white/20 dark:border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Paramètre
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Valeur
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Unité
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Normale
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Interp.
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Commentaires
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20 dark:divide-white/10">
            {resultats.map((resultat, idx) => {
              const badge = getInterpretationBadge(resultat.interpretation);
              const normale = resultat.valeurNormaleMin !== null && resultat.valeurNormaleMax !== null
                ? `${resultat.valeurNormaleMin} - ${resultat.valeurNormaleMax}`
                : 'N/A';

              return (
                <motion.tr
                  key={resultat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                    {resultat.parametre}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${badge.color}`}>
                      {resultat.valeur}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {resultat.unite || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                      {normale}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={badge.variant} size="sm">
                      {badge.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!resultat.validePar ? (
                        <>
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              iconName="Edit"
                              onClick={() => onEdit(resultat)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 p-2"
                              title="Modifier ce résultat"
                            />
                          )}
                          {onValidate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              iconName="Check"
                              onClick={() => onValidate(resultat, analyse)}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 p-2"
                              title="Valider ce résultat avec signature"
                            />
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 p-2" title="Résultat validé - modification impossible">
                            <Icon name="Lock" size={16} />
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 p-2" title={`Validé par ${resultat.validePar?.name || 'Validateur'} ${resultat.dateValidation ? 'le ' + formatDateInBusinessTimezone(resultat.dateValidation) : ''}`}>
                            <Icon name="CheckCircle" size={16} />
                          </div>
                        </>
                      )}
                      <ResultatComments resultat={resultat} analyse={analyse} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                    {resultat.commentaire ? (
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium" title={resultat.commentaire}>
                          {resultat.commentaire}
                        </span>
                        {resultat.annotation && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 italic truncate" title={resultat.annotation}>
                            📝 {resultat.annotation}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Aucun commentaire</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultatsTable;

