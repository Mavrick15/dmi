import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const EmergencyConsultationPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const emergencyContacts = [
    { id: 1, name: "Dr. Rodriguez", role: "Urgentiste", phone: "+1 555 0123", status: "available", avatarAlt: "MR" },
    { id: 2, name: "Dr. Chen", role: "Cardiologue", phone: "+1 555 0124", status: "busy", avatarAlt: "SC" },
    { id: 3, name: "Dr. Wilson", role: "Chirurgien", phone: "+1 555 0125", status: "available", avatarAlt: "JW" }
  ];

  const recentPatients = [
    { id: 1, name: "Emma Thompson", age: 34, condition: "Douleur Thoracique", priority: "high", mrn: "MRN-001" },
    { id: 2, name: "Robert Johnson", age: 67, condition: "Dyspnée", priority: "critical", mrn: "MRN-002" },
    { id: 3, name: "Maria Garcia", age: 28, condition: "Choc Anaphylactique", priority: "medium", mrn: "MRN-003" }
  ];

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
      case 'high': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      default: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Emergency Banner */}
      <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white p-5 rounded-2xl shadow-lg shadow-rose-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center animate-pulse">
            <Icon name="AlertTriangle" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Mode Urgence Activé</h3>
            <p className="text-sm text-rose-100">Accès prioritaire aux données critiques</p>
          </div>
        </div>
      </div>

      {/* Quick Patient Search */}
      <div className="glass-panel rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Patient</h3>
        
        <Input
          type="search"
          placeholder="Rechercher (Nom, ID, Tél)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4 bg-slate-50 dark:bg-slate-950 border-white/20 dark:border-white/10"
        />

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Récents</h4>
          {Array.isArray(recentPatients) && recentPatients.map((patient) => {
            if (!patient || typeof patient !== 'object') return null;
            return (
            <div
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className={`
                p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between
                ${selectedPatient?.id === patient.id 
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary' 
                  : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
              `}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="font-bold text-slate-900 dark:text-white truncate">{patient.name}</h5>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityStyles(patient.priority)}`}>
                    {patient.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {patient.age} ans • {patient.condition}
                </p>
              </div>
              <Icon name="ChevronRight" size={16} className="text-slate-400" />
            </div>
            );
          }).filter(Boolean)}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="glass-panel rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Contacts Garde</h3>
        
        <div className="space-y-3">
          {Array.isArray(emergencyContacts) && emergencyContacts.map((contact) => {
            if (!contact || typeof contact !== 'object') return null;
            return (
            <div key={contact.id} className="flex items-center gap-3 p-3 glass-surface rounded-xl">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                  {contact.avatarAlt}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${contact.status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{contact.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{contact.role}</p>
              </div>
              
              <Button variant="outline" size="icon" className="rounded-full w-8 h-8 border-white/20 dark:border-white/10">
                <Icon name="Phone" size={14} />
              </Button>
            </div>
            );
          }).filter(Boolean)}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="destructive"
            fullWidth
            iconName="PhoneCall"
            iconPosition="left"
            className="bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20"
          >
            Appeler SAMU (15)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyConsultationPanel;