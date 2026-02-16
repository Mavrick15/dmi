import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';

const UserCard = ({ user, onEdit, onDelete, onToggleStatus }) => {
  const { hasPermission } = usePermissions();
  const isActive = user.status === 'Active' || user.actif === true;

  // Détermine le thème visuel en fonction du rôle
  const getRoleTheme = (roleName) => {
    const role = roleName?.toLowerCase() || '';
    if (role.includes('docteur') || role.includes('medecin') || role.includes('physician')) {
      return { 
        color: 'text-blue-600 dark:text-blue-400', 
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        borderTop: 'border-t-blue-500',
        icon: 'Stethoscope'
      };
    }
    if (role.includes('admin')) {
      return { 
        color: 'text-purple-600 dark:text-purple-400', 
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        borderTop: 'border-t-purple-500',
        icon: 'ShieldCheck'
      };
    }
    if (role.includes('infirmiere') || role.includes('nurse')) {
      return { 
        color: 'text-emerald-600 dark:text-emerald-400', 
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderTop: 'border-t-emerald-500',
        icon: 'Activity'
      };
    }
    if (role.includes('pharmacien') || role.includes('pharma')) {
      return { 
        color: 'text-teal-600 dark:text-teal-400', 
        bg: 'bg-teal-50 dark:bg-teal-900/20',
        borderTop: 'border-t-teal-500',
        icon: 'Pill'
      };
    }
    if (role.includes('it_specialist')) {
       return { 
        color: 'text-indigo-600 dark:text-indigo-400', 
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        borderTop: 'border-t-indigo-500',
        icon: 'Code'
      };
    }
    if (role.includes('gestionnaire')) {
       return { 
        color: 'text-amber-600 dark:text-amber-400', 
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        borderTop: 'border-t-amber-500',
        icon: 'Briefcase'
      };
    }
    return { 
      color: 'text-slate-600 dark:text-slate-400', 
      bg: 'bg-slate-50 dark:bg-slate-800',
      borderTop: 'border-t-slate-400',
      icon: 'User'
    };
  };

  const theme = getRoleTheme(user.role);
  // Génération des initiales (sécurité si user.name est vide)
  const initials = (user.name || user.nomComplet || '?').charAt(0).toUpperCase();

  const getGradientBg = () => {
    const role = user.role?.toLowerCase() || '';
    if (role.includes('docteur') || role.includes('medecin')) return 'from-blue-50 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20';
    if (role.includes('admin')) return 'from-purple-50 via-white to-purple-50/50 dark:from-purple-950/30 dark:via-slate-900 dark:to-purple-950/20';
    if (role.includes('infirmiere') || role.includes('nurse')) return 'from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20';
    if (role.includes('pharmacien') || role.includes('pharma')) return 'from-teal-50 via-white to-teal-50/50 dark:from-teal-950/30 dark:via-slate-900 dark:to-teal-950/20';
    if (role.includes('gestionnaire')) return 'from-amber-50 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20';
    return 'from-slate-50 via-white to-slate-50/50 dark:from-slate-950/30 dark:via-slate-900 dark:to-slate-950/20';
  };

  const getBorderColor = () => {
    const role = user.role?.toLowerCase() || '';
    if (role.includes('docteur') || role.includes('medecin')) return 'border-blue-100 dark:border-blue-900/50';
    if (role.includes('admin')) return 'border-purple-100 dark:border-purple-900/50';
    if (role.includes('infirmiere') || role.includes('nurse')) return 'border-emerald-100 dark:border-emerald-900/50';
    if (role.includes('pharmacien') || role.includes('pharma')) return 'border-teal-100 dark:border-teal-900/50';
    if (role.includes('gestionnaire')) return 'border-amber-100 dark:border-amber-900/50';
    return 'border-slate-200 dark:border-slate-800';
  };

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className={`
        group relative bg-gradient-to-br ${getGradientBg()} border ${getBorderColor()} rounded-2xl
        shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden
        ${theme.borderTop} border-t-4
        ${!isActive ? 'opacity-75 grayscale-[0.5]' : ''}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {!isActive && (
        <div className="absolute top-3 right-3 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border border-slate-200 dark:border-slate-700">
          Inactif
        </div>
      )}

      <div className="p-6 flex-1">
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            {user.avatar ? (
              <Image 
                src={user.avatar} 
                alt={user.name} 
                className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-slate-100 dark:border-slate-700" 
              />
            ) : (
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm ${theme.bg} ${theme.color}`}>
                {initials}
              </div>
            )}
            {/* Indicateur de statut en ligne/actif */}
            <div className={`absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full border-[3px] border-white dark:border-slate-900 ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate" title={user.name || user.nomComplet}>
              {user.name || user.nomComplet}
            </h3>
            <div className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${theme.bg} ${theme.color}`}>
              <Icon name={theme.icon} size={12} />
              <span className="truncate">{user.role}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 relative z-10">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
               <Icon name="Mail" size={14} />
             </div>
             <span className="truncate font-medium" title={user.email}>{user.email}</span>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
               <Icon name="Building2" size={14} />
             </div>
             <span className="truncate font-medium">{user.department || user.nom_etablissement || 'Général'}</span>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
               <Icon name="Phone" size={14} />
             </div>
             <span className="truncate font-medium">{user.phone || user.telephone || 'N/A'}</span>
          </motion.div>
        </div>
      </div>

      <div className="relative px-4 py-3 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center z-10">
        <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex flex-col">
          <span>Dernière connexion</span>
          <span className="text-slate-600 dark:text-slate-300 font-semibold">{user.lastLogin || 'Jamais'}</span>
        </div>

        <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          {/* Bouton Toggle Status */}
          {onToggleStatus && (
            <PermissionGuard requiredPermission="user_edit">
              <button 
                  onClick={(e) => { e.stopPropagation(); onToggleStatus(user); }}
                  className={`p-2 rounded-lg transition-colors ${
                  isActive 
                      ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20' 
                      : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                  }`}
                  title={isActive ? "Désactiver le compte" : "Activer le compte"}
                  disabled={!hasPermission('user_edit')}
              >
                  <Icon name={isActive ? "UserX" : "UserCheck"} size={16} />
              </button>
            </PermissionGuard>
          )}

          <PermissionGuard requiredPermission="user_edit">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-500 hover:text-primary dark:hover:text-blue-400" 
              onClick={(e) => { e.stopPropagation(); onEdit(user); }}
              title="Éditer"
              disabled={!hasPermission('user_edit')}
            >
              <Icon name="Edit2" size={16} />
            </Button>
          </PermissionGuard>

          <PermissionGuard requiredPermission="user_delete">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => { e.stopPropagation(); onDelete(user); }} 
              className="h-8 w-8 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              title="Supprimer l'utilisateur"
              disabled={!hasPermission('user_delete')}
            >
              <Icon name="Trash2" size={16} />
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </motion.div>
  );
};

export default UserCard;