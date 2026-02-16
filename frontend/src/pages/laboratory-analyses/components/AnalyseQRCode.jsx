import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from '../../../components/ui/QRCode';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';

const AnalyseQRCode = ({ analyse }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!analyse || !analyse.numeroAnalyse) return null;

  // Données à encoder dans le QR code
  const qrData = JSON.stringify({
    type: 'analyse',
    id: analyse.id,
    numero: analyse.numeroAnalyse,
    patient: analyse.patient?.numeroPatient || analyse.patientId,
    typeAnalyse: analyse.typeAnalyse,
    date: analyse.datePrescription
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        iconName="QrCode"
        onClick={() => setIsOpen(true)}
        title="Afficher le QR code"
      />

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon name="QrCode" size={20} className="text-white" />
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              QR Code - {analyse.numeroAnalyse}
            </span>
          </div>
        }
        size="md"
      >
        <div className="space-y-6">
          {/* Informations */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Numéro</p>
                <p className="font-mono font-semibold text-slate-900 dark:text-white">{analyse.numeroAnalyse}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Type</p>
                <p className="font-semibold text-slate-900 dark:text-white capitalize">
                  {analyse.typeAnalyse?.replace('_', ' ')}
                </p>
              </div>
              {analyse.patient && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Patient</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{analyse.patient.numeroPatient}</p>
                </div>
              )}
              {analyse.laboratoire && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Laboratoire</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{analyse.laboratoire}</p>
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <QRCode value={qrData} size={200} />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
              Scannez ce code pour accéder rapidement aux informations de l'analyse
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Utilisation :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Imprimez ce QR code et collez-le sur l'échantillon</li>
                  <li>Scannez-le pour identifier rapidement l'analyse</li>
                  <li>Le code contient toutes les informations essentielles</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AnalyseQRCode;

