import { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const ComplianceTraining = () => {
  const [selectedTab, setSelectedTab] = useState('modules');

  const trainingModules = [
    { id: 1, title: "Fondamentaux HIPAA", category: "Conformité", progress: 94, status: "active", mandatory: true },
    { id: 2, title: "Cybersécurité Base", category: "Sécurité", progress: 87, status: "active", mandatory: true },
    { id: 3, title: "Gestion Données", category: "Privacy", progress: 76, status: "urgent", mandatory: true }
  ];

  const staffProgress = [
    { id: 1, name: "Dr. Sarah Chen", role: "Médecin", progress: 100, status: "certified", avatar: "https://images.unsplash.com/photo-1734821375517-ca34fbe8089d" },
    { id: 2, name: "Maria Rodriguez", role: "Infirmière", progress: 85, status: "pending", avatar: "https://images.unsplash.com/photo-1592041828835-4216e6af4a78" }
  ];

  return (
    <div className="space-y-6">
      <div className="backdrop-blur-xl bg-white/50 dark:bg-white/10 rounded-3xl border border-white/20 dark:border-white/10 p-6 shadow-sm">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Formation & Certification</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Suivi de la conformité du personnel</p>
            </div>
            <div className="flex glass-surface p-1 rounded-xl">
                <button onClick={() => setSelectedTab('modules')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTab === 'modules' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Modules</button>
                <button onClick={() => setSelectedTab('staff')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTab === 'staff' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Personnel</button>
            </div>
        </div>

        {selectedTab === 'modules' && (
            <div className="space-y-4">
                {Array.isArray(trainingModules) && trainingModules.map(module => {
                  if (!module || typeof module !== 'object') return null;
                  return (
                    <div key={module.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{module.title}</h4>
                                    {module.mandatory && <span className="text-[10px] bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded uppercase font-bold">Obligatoire</span>}
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{module.category}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{module.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${module.progress >= 90 ? 'bg-emerald-500' : module.progress >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{width: `${module.progress}%`}}></div>
                        </div>
                    </div>
                  );
                }).filter(Boolean)}
            </div>
        )}

        {selectedTab === 'staff' && (
            <div className="space-y-3">
                {Array.isArray(staffProgress) && staffProgress.map(staff => {
                  if (!staff || typeof staff !== 'object') return null;
                  return (
                    <div key={staff.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                        <div className="flex items-center gap-3">
                            <Image src={staff.avatar} alt={staff.name} className="w-10 h-10 rounded-full object-cover" />
                            <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">{staff.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{staff.role}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <span className={`block text-xs font-bold ${staff.progress === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>{staff.progress}%</span>
                                <span className="text-[10px] text-slate-400">Score</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary"><Icon name="ChevronRight" size={16}/></Button>
                        </div>
                    </div>
                  );
                }).filter(Boolean)}
            </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceTraining;