import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import { formatMonthYearInBusinessTimezone } from '../../../utils/dateTime';

const PrivacyInfo = () => {
  const [showModal, setShowModal] = useState(false);

  const privacyInfo = {
    title: 'Politique de Confidentialité',
    sections: [
      {
        icon: 'Shield',
        title: 'Protection des Données',
        content: 'Toutes les données médicales sont cryptées en transit et au repos selon les normes HIPAA et RGPD. Nous utilisons un chiffrement AES-256 pour garantir la sécurité maximale.'
      },
      {
        icon: 'LockKeyhole',
        title: 'Accès Sécurisé',
        content: 'L\'accès aux données est strictement contrôlé par authentification multi-facteurs (MFA) et basé sur les rôles. Seuls les professionnels autorisés peuvent accéder aux informations pertinentes.'
      },
      {
        icon: 'EyeOff',
        title: 'Confidentialité Médicale',
        content: 'Nous respectons le secret médical et la confidentialité des dossiers patients. Aucune donnée n\'est partagée avec des tiers sans consentement explicite.'
      },
      {
        icon: 'FileCheck',
        title: 'Conformité Réglementaire',
        content: 'Notre plateforme est conforme aux réglementations en vigueur : RGPD (Europe), HIPAA (États-Unis), et lois locales sur la protection des données de santé.'
      },
      {
        icon: 'Database',
        title: 'Stockage des Données',
        content: 'Les données sont stockées dans des centres de données certifiés avec sauvegarde automatique quotidienne. La rétention des données suit les exigences légales.'
      },
      {
        icon: 'UserCheck',
        title: 'Droits des Patients',
        content: 'Les patients ont le droit d\'accéder, de rectifier, de supprimer leurs données personnelles et de s\'opposer à leur traitement, conformément au RGPD.'
      },
      {
        icon: 'Activity',
        title: 'Audit et Traçabilité',
        content: 'Toutes les actions sur les données sont enregistrées dans des logs d\'audit sécurisés pour garantir la traçabilité et la conformité.'
      },
      {
        icon: 'AlertTriangle',
        title: 'Notification des Violations',
        content: 'En cas de violation de données, nous notifierons les autorités compétentes et les personnes concernées dans les délais légaux (72h pour le RGPD).'
      }
    ]
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="hover:text-white cursor-pointer transition-colors relative z-10"
      >
        Confidentialité
      </button>

      {showModal && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
            style={{ zIndex: 99999, position: 'fixed' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-xl bg-white/50 dark:bg-white/10 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden flex flex-col"
              style={{ zIndex: 100000, position: 'relative' }}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <Icon name="Shield" size={24} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {privacyInfo.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Dernière mise à jour : {formatMonthYearInBusinessTimezone(new Date())}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                >
                  <Icon name="X" size={18} className="text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {privacyInfo.sections.map((section, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl border border-white/20 dark:border-white/10 glass-surface hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <Icon name={section.icon} size={18} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                            {section.title}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {section.content}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer Info */}
                <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
                  <div className="flex items-start gap-3">
                    <Icon name="Info" size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        Contact pour questions sur la confidentialité
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        Email : privacy@openclinic.cd | Téléphone : +243 XXX XXX XXX
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default PrivacyInfo;

