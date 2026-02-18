import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';

const UserListTable = ({ users, onEdit, onDelete, onToggleStatus }) => {
  const { hasPermission } = usePermissions();
  
  const getRoleBadge = (role) => {
    switch(role) {
        case 'admin': 
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"><Icon name="Shield" size={10} /> Admin</span>;
        case 'docteur': 
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"><Icon name="Stethoscope" size={10} /> Médecin</span>;
        case 'infirmiere': 
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><Icon name="Activity" size={10} /> Infirmier</span>;
        case 'pharmacien': 
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"><Icon name="Pill" size={10} /> Pharmacien</span>;
        case 'gestionnaire': 
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Icon name="Briefcase" size={10} /> Gestion</span>;
        case 'it_specialist':
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"><Icon name="Code" size={10} /> IT</span>;
        default: 
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">{role}</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-left">
            <tr>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Utilisateur</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Rôle</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Statut</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.isArray(users) && users.map((user) => {
              if (!user || typeof user !== 'object') return null;
              return (
                <tr key={user.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${user.status !== 'Active' ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold overflow-hidden border border-slate-200 dark:border-slate-700">
                        {user.avatar ? <Image src={user.avatar} className="w-full h-full object-cover" /> : (typeof user.name === 'string' && user.name) ? user.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors">{user.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{user.department || 'Général'}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                    {getRoleBadge(user.role)}
                </td>
                <td className="py-4 px-6">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate max-w-[200px]" title={user.email}>
                            <Icon name="Mail" size={12} className="text-slate-400" /> {user.email}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Icon name="Phone" size={12} className="text-slate-400" /> {user.phone || 'N/A'}
                        </span>
                    </div>
                </td>
                <td className="py-4 px-6 text-center">
                    {user.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Actif
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactif
                        </span>
                    )}
                </td>
                <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        
                        {/* Bouton Toggle Status */}
                        {onToggleStatus && (
                            <PermissionGuard requiredPermission="user_edit">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleStatus(user); }}
                                    className={`p-2 rounded-lg transition-colors ${
                                        user.status === 'Active'
                                        ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                                        : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                    }`}
                                    title={user.status === 'Active' ? "Désactiver" : "Activer"}
                                    disabled={!hasPermission('user_edit')}
                                >
                                    <Icon name={user.status === 'Active' ? "UserX" : "UserCheck"} size={16} />
                                </button>
                            </PermissionGuard>
                        )}

                        <PermissionGuard requiredPermission="user_edit">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-500 hover:text-primary dark:hover:text-blue-400" 
                                onClick={(e) => { e.stopPropagation(); onEdit(user); }}
                                disabled={!hasPermission('user_edit')}
                            >
                                <Icon name="Edit2" size={16} />
                            </Button>
                        </PermissionGuard>
                        
                        <PermissionGuard requiredPermission="user_delete">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20" 
                                onClick={(e) => { e.stopPropagation(); onDelete(user); }}
                                disabled={!hasPermission('user_delete')}
                            >
                                <Icon name="Trash2" size={16} />
                            </Button>
                        </PermissionGuard>
                    </div>
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

export default UserListTable;