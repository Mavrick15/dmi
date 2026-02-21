import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import { formatMonthYearInBusinessTimezone } from '../../../utils/dateTime';

const TermsInfo = () => {
  const [showModal, setShowModal] = useState(false);

  const termsInfo = {
    title: 'Conditions d\'Utilisation',
    sections: [
      {
        icon: 'FileText',
        title: 'Acceptation des Conditions',
        content: 'En accédant et en utilisant cette plateforme, vous reconnaissez avoir lu, compris et accepté d\'être lié par ces conditions d\'utilisation. Si vous n\'acceptez pas ces conditions, vous ne devez pas utiliser la plateforme.'
      },
      {
        icon: 'User',
        title: 'Utilisation Autorisée',
        content: 'L\'accès est strictement réservé aux professionnels de santé autorisés (médecins, infirmiers, pharmaciens, gestionnaires). Chaque utilisateur doit posséder des identifiants valides et un rôle approprié. Toute utilisation non autorisée est strictement interdite et peut entraîner des poursuites judiciaires.'
      },
      {
        icon: 'Shield',
        title: 'Responsabilités de l\'Utilisateur',
        content: 'Vous êtes responsable de : (1) La confidentialité de vos identifiants de connexion, (2) Toutes les actions effectuées sous votre compte, (3) Le respect des protocoles médicaux et des réglementations en vigueur, (4) La protection des données auxquelles vous avez accès.'
      },
      {
        icon: 'AlertCircle',
        title: 'Utilisations Interdites',
        content: 'Il est strictement interdit de : (1) Utiliser la plateforme à des fins frauduleuses ou illégales, (2) Contourner ou désactiver les mesures de sécurité, (3) Partager vos identifiants avec des tiers, (4) Accéder à des données sans autorisation, (5) Modifier, copier ou extraire des données sans autorisation, (6) Utiliser des robots ou scripts automatisés.'
      },
      {
        icon: 'LockKeyhole',
        title: 'Sécurité des Comptes',
        content: 'Vous devez immédiatement notifier l\'administrateur en cas de perte, vol ou utilisation non autorisée de vos identifiants. Nous nous réservons le droit de suspendre ou de fermer tout compte en cas de violation de ces conditions.'
      },
      {
        icon: 'Database',
        title: 'Propriété Intellectuelle',
        content: 'Tous les contenus, logos, marques et logiciels de la plateforme sont la propriété exclusive d\'OpenClinic. Toute reproduction, distribution ou utilisation non autorisée est interdite.'
      },
      {
        icon: 'XCircle',
        title: 'Limitation de Responsabilité',
        content: 'La plateforme est fournie "en l\'état". Nous ne garantissons pas l\'absence d\'erreurs ou d\'interruptions. Nous ne serons pas responsables des dommages indirects résultant de l\'utilisation ou de l\'impossibilité d\'utiliser la plateforme.'
      },
      {
        icon: 'Gavel',
        title: 'Résiliation',
        content: 'Nous nous réservons le droit de suspendre ou de résilier votre accès à tout moment, sans préavis, en cas de violation de ces conditions. Vous pouvez également demander la résiliation de votre compte à tout moment.'
      },
      {
        icon: 'FileEdit',
        title: 'Modifications des Conditions',
        content: 'Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prendront effet dès leur publication. Il est de votre responsabilité de consulter régulièrement ces conditions.'
      },
      {
        icon: 'Scale',
        title: 'Droit Applicable',
        content: 'Ces conditions sont régies par les lois en vigueur dans votre juridiction. Tout litige sera soumis à la compétence exclusive des tribunaux compétents.'
      }
    ]
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="hover:text-white cursor-pointer transition-colors relative z-10"
      >
        Conditions
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
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
                    <Icon name="FileText" size={24} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {termsInfo.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Version en vigueur : {formatMonthYearInBusinessTimezone(new Date())}
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
                  {termsInfo.sections.map((section, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl border border-white/20 dark:border-white/10 glass-surface hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
                          <Icon name={section.icon} size={18} className="text-indigo-600 dark:text-indigo-400" />
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
                <div className="mt-6 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-start gap-3">
                    <Icon name="Info" size={18} className="text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 mb-1">
                        Questions sur les conditions d'utilisation ?
                      </p>
                      <p className="text-xs text-indigo-700 dark:text-indigo-400">
                        Contact : legal@openclinic.cd | Téléphone : +243 XXX XXX XXX
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

export default TermsInfo;

