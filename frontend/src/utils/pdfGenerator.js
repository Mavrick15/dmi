import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <--- CORRECTION : Import nommé
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Génère et ouvre une ordonnance PDF dans un nouvel onglet
 * @param {Object} consultation - Données de la consultation (médicaments, traitements, etc.)
 * @param {Object} patient - Infos du patient
 * @param {String} doctorName - Nom du médecin prescripteur
 */
export const generatePrescriptionPDF = (consultation, patient, doctorName) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // --- EN-TÊTE CLINIQUE ---
  // Logo (Simulation texte)
  doc.setFontSize(22);
  doc.setTextColor(41, 128, 185); // Bleu MediCore
  doc.setFont('helvetica', 'bold');
  doc.text("MediCore Clinic", 15, 20);
  
  // Coordonnées Clinique
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text("123 Avenue de la Santé, 75000 Paris", 15, 28);
  doc.text("Tél: +33 1 23 45 67 89 | Email: contact@medicore.cd", 15, 33);
  doc.text("N° Agrément: 98765432100015", 15, 38);
  
  // Ligne de séparation décorative
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(15, 45, pageWidth - 15, 45);

  // --- INFOS DOCTEUR (Droite) ---
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dr. ${doctorName || 'Médecin Traitant'}`, pageWidth - 15, 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80);
  doc.text("Médecine Générale & Spécialisée", pageWidth - 15, 30, { align: 'right' });

  // --- DATE ET LIEU ---
  const dateStr = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(`Fait à Kinshasa, le ${dateStr}`, pageWidth - 15, 60, { align: 'right' });

  // --- CADRE PATIENT ---
  doc.setDrawColor(200);
  doc.setFillColor(248, 250, 252); // Gris très clair
  doc.roundedRect(15, 55, 100, 25, 3, 3, 'FD');
  
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text("Patient(e) :", 20, 62);
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(`${patient.name}`, 20, 70);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  // Gestion de l'affichage de l'âge/naissance
  const birthInfo = patient.birthDate || patient.dateNaissance;
  const ageInfo = patient.age ? `(${patient.age} ans)` : '';
  doc.text(`Né(e) le : ${birthInfo || 'N/A'} ${ageInfo}`, 20, 77);

  // --- TITRE DU DOCUMENT ---
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text("ORDONNANCE", pageWidth / 2, 100, { align: 'center', charSpace: 2 });
  
  // Curseur vertical courant
  let currentY = 115;

  // --- 1. MÉDICAMENTS (Tableau) ---
  if (consultation.medications && consultation.medications.length > 0) {
    const tableData = consultation.medications.map(med => [
        med.name,
        med.dosage || '-',
        med.frequency || '-',
        med.duration || '-'
    ]);

    // CORRECTION ICI : Utilisation de la fonction importée au lieu de doc.autoTable
    autoTable(doc, {
        startY: currentY,
        head: [['Médicament', 'Dosage', 'Posologie', 'Durée']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: 255, 
            fontStyle: 'bold',
            halign: 'left'
        },
        styles: { 
            fontSize: 10, 
            cellPadding: 4,
            textColor: 50
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            2: { cellWidth: 60 }
        },
        margin: { left: 15, right: 15 }
    });
    
    // Récupération de la position Y finale (compatible avec la fonction externe)
    currentY = doc.lastAutoTable.finalY + 15;
  } else {
      // Ligne vide si pas de médocs (pour le visuel)
      currentY += 10;
  }

  // --- 2. EXAMENS DEMANDÉS ---
  if (consultation.requestedExams && consultation.requestedExams.length > 0) {
      // Vérifier si on a besoin d'une nouvelle page
      if (currentY > 240) { doc.addPage(); currentY = 20; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("Examens à réaliser :", 15, currentY);
      currentY += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      consultation.requestedExams.forEach(exam => {
          doc.text(`• ${exam}`, 20, currentY);
          currentY += 6;
      });
      currentY += 10;
  }

  // --- 3. INSTRUCTIONS / CONSEILS ---
  if (consultation.treatment) {
      if (currentY > 230) { doc.addPage(); currentY = 20; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("Conseils & Instructions :", 15, currentY);
      currentY += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(consultation.treatment, pageWidth - 30);
      doc.text(splitText, 20, currentY);
      
      currentY += (splitText.length * 5) + 15;
  }

  // --- PIED DE PAGE & SIGNATURE ---
  const footerY = 260; // Fixe en bas de page (A4 fait 297mm de haut)
  
  // Ligne de signature
  doc.setDrawColor(100);
  doc.setLineWidth(0.1);
  doc.line(130, footerY, 190, footerY); 
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text("Signature et Cachet", 145, footerY + 5);

  // Footer Légal
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Ce document est valide uniquement s'il est présenté original.", pageWidth / 2, 285, { align: 'center' });
  
  // ID Unique de traçabilité
  const uniqueId = `REF-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`;
  doc.text(uniqueId, pageWidth - 15, 290, { align: 'right' });

  // Ouvrir dans un nouvel onglet
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};

/**
 * Génère et ouvre un PDF complet de consultation
 * @param {Object} consultation - Données complètes de la consultation
 * @param {Object} patient - Infos du patient
 * @param {String} doctorName - Nom du médecin
 * @param {Number} duration - Durée de la consultation en minutes
 */
export const generateConsultationPDF = (consultation, patient, doctorName, duration = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let currentY = 20;
  
  // --- EN-TÊTE CLINIQUE ---
  doc.setFontSize(22);
  doc.setTextColor(41, 128, 185);
  doc.setFont('helvetica', 'bold');
  doc.text("MediCore Clinic", 15, currentY);
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text("123 Avenue de la Santé, 75000 Paris", 15, currentY + 8);
  doc.text("Tél: +33 1 23 45 67 89 | Email: contact@medicore.cd", 15, currentY + 13);
  doc.text("N° Agrément: 98765432100015", 15, currentY + 18);
  
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(15, currentY + 25, pageWidth - 15, currentY + 25);
  
  currentY += 35;
  
  // --- TITRE ---
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text("COMPTE-RENDU DE CONSULTATION", pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;
  
  // --- INFOS DOCTEUR ET DATE ---
  const dateStr = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(`Dr. ${doctorName || 'Médecin Traitant'}`, pageWidth - 15, currentY, { align: 'right' });
  doc.text(`Fait à Kinshasa, le ${dateStr}`, pageWidth - 15, currentY + 5, { align: 'right' });
  if (duration) {
    doc.text(`Durée: ${duration} minutes`, pageWidth - 15, currentY + 10, { align: 'right' });
  }
  currentY += 15;
  
  // --- INFORMATIONS PATIENT ---
  doc.setDrawColor(200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, currentY, pageWidth - 30, 30, 3, 3, 'FD');
  
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text("Patient(e) :", 20, currentY + 8);
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(`${patient.name || 'N/A'}`, 20, currentY + 16);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  const birthInfo = patient.birthDate || patient.dateNaissance;
  const ageInfo = patient.age ? `(${patient.age} ans)` : '';
  doc.text(`Né(e) le : ${birthInfo || 'N/A'} ${ageInfo}`, 20, currentY + 24);
  
  if (patient.numeroPatient) {
    doc.text(`N° Patient: ${patient.numeroPatient}`, pageWidth - 20, currentY + 16, { align: 'right' });
  }
  
  currentY += 40;
  
  // --- MOTIF DE CONSULTATION ---
  if (consultation.chiefComplaint) {
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Motif de consultation", 15, currentY);
    currentY += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const complaintText = doc.splitTextToSize(consultation.chiefComplaint, pageWidth - 30);
    doc.text(complaintText, 20, currentY);
    currentY += (complaintText.length * 5) + 10;
  }
  
  // --- SYMPTÔMES ---
  if (consultation.symptoms && consultation.symptoms.length > 0) {
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Symptômes associés", 15, currentY);
    currentY += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(consultation.symptoms.join(', '), 20, currentY);
    currentY += 10;
  }
  
  // --- CONSTANTES VITALES ---
  if (consultation.vitalSigns && Object.values(consultation.vitalSigns).some(v => v)) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Constantes vitales", 15, currentY);
    currentY += 8;
    
    const vitals = [];
    if (consultation.vitalSigns.temperature) vitals.push(`Température: ${consultation.vitalSigns.temperature}°C`);
    if (consultation.vitalSigns.bloodPressure) vitals.push(`Tension: ${consultation.vitalSigns.bloodPressure} mmHg`);
    if (consultation.vitalSigns.heartRate) vitals.push(`FC: ${consultation.vitalSigns.heartRate} bpm`);
    if (consultation.vitalSigns.respiratoryRate) vitals.push(`FR: ${consultation.vitalSigns.respiratoryRate} /min`);
    if (consultation.vitalSigns.oxygenSaturation) vitals.push(`SpO2: ${consultation.vitalSigns.oxygenSaturation}%`);
    
    if (vitals.length > 0) {
      const vitalsTable = vitals.map(v => [v.split(':')[0] + ':', v.split(':')[1]]);
      autoTable(doc, {
        startY: currentY,
        body: vitalsTable,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 80 }
        },
        margin: { left: 20, right: 15 }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }
  }
  
  // --- EXAMEN CLINIQUE ---
  if (consultation.examination) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Examen clinique", 15, currentY);
    currentY += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const examText = doc.splitTextToSize(consultation.examination, pageWidth - 30);
    doc.text(examText, 20, currentY);
    currentY += (examText.length * 5) + 10;
  }
  
  // --- DIAGNOSTIC ---
  if (consultation.diagnosis) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Diagnostic", 15, currentY);
    currentY += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const diagText = doc.splitTextToSize(consultation.diagnosis, pageWidth - 30);
    doc.text(diagText, 20, currentY);
    currentY += (diagText.length * 5) + 5;
    
    if (consultation.diagnosisCode) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80);
      doc.text(`Code CIM-10: ${consultation.diagnosisCode}`, 20, currentY);
      currentY += 10;
    }
  }
  
  // --- PRESCRIPTION ---
  if ((consultation.medications && consultation.medications.length > 0) || 
      (consultation.requestedExams && consultation.requestedExams.length > 0) ||
      consultation.treatment) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Prescription", 15, currentY);
    currentY += 8;
    
    // Médicaments
    if (consultation.medications && consultation.medications.length > 0) {
      const medTableData = consultation.medications.map(med => [
        med.name,
        med.dosage || '-',
        med.frequency || '-',
        med.duration || '-'
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Médicament', 'Dosage', 'Posologie', 'Durée']],
        body: medTableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          2: { cellWidth: 60 }
        },
        margin: { left: 20, right: 15 }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }
    
    // Examens
    if (consultation.requestedExams && consultation.requestedExams.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("Examens à réaliser :", 20, currentY);
      currentY += 8;
      
      doc.setFont('helvetica', 'normal');
      consultation.requestedExams.forEach(exam => {
        doc.text(`• ${exam}`, 25, currentY);
        currentY += 6;
      });
      currentY += 5;
    }
    
    // Traitement/Conseils
    if (consultation.treatment) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("Conseils & Instructions :", 20, currentY);
      currentY += 8;
      
      doc.setFont('helvetica', 'normal');
      const treatmentText = doc.splitTextToSize(consultation.treatment, pageWidth - 40);
      doc.text(treatmentText, 25, currentY);
      currentY += (treatmentText.length * 5) + 10;
    }
  }
  
  // --- SUIVI ---
  if (consultation.followUp || consultation.consultationNotes) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Suivi & Notes", 15, currentY);
    currentY += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    if (consultation.followUp) {
      const followUpText = doc.splitTextToSize(consultation.followUp, pageWidth - 30);
      doc.text(followUpText, 20, currentY);
      currentY += (followUpText.length * 5) + 5;
    }
    
    if (consultation.consultationNotes) {
      const notesText = doc.splitTextToSize(consultation.consultationNotes, pageWidth - 30);
      doc.text(notesText, 20, currentY);
      currentY += (notesText.length * 5) + 10;
    }
  }
  
  // --- PIED DE PAGE ---
  const footerY = 280;
  doc.setDrawColor(100);
  doc.setLineWidth(0.1);
  doc.line(130, footerY, 190, footerY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text("Signature et Cachet", 145, footerY + 5);
  
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Document confidentiel - Usage médical uniquement", pageWidth / 2, 290, { align: 'center' });
  
  const uniqueId = `CONS-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`;
  doc.text(uniqueId, pageWidth - 15, 290, { align: 'right' });
  
  // Ouvrir dans un nouvel onglet
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};

/**
 * Génère et télécharge une facture PDF
 * @param {Object} invoice - Données de la facture
 * @param {Object} patient - Infos du patient (peut être dans invoice.patient)
 * @returns {Blob} Blob du PDF pour téléchargement
 */
export const generateInvoicePDF = (invoice, patient = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const patientData = patient || invoice.patient || {};
  
  // --- EN-TÊTE CLINIQUE ---
  doc.setFontSize(22);
  doc.setTextColor(41, 128, 185); // Bleu MediCore
  doc.setFont('helvetica', 'bold');
  doc.text("MediCore Clinic", 15, 20);
  
  // Coordonnées Clinique
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text("123 Avenue de la Santé, 75000 Paris", 15, 28);
  doc.text("Tél: +33 1 23 45 67 89 | Email: contact@medicore.cd", 15, 33);
  doc.text("N° Agrément: 98765432100015", 15, 38);
  
  // Ligne de séparation décorative
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(15, 45, pageWidth - 15, 45);

  // --- TITRE FACTURE ---
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text("FACTURE", pageWidth / 2, 65, { align: 'center' });
  
  // Numéro de facture et dates
  let currentY = 75;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${invoice.numeroFacture}`, pageWidth - 15, currentY, { align: 'right' });
  
  currentY += 8;
  if (invoice.dateEmission) {
    const emissionDate = format(new Date(invoice.dateEmission), 'dd MMMM yyyy', { locale: fr });
    doc.text(`Date d'émission : ${emissionDate}`, pageWidth - 15, currentY, { align: 'right' });
  }
  
  currentY += 8;
  if (invoice.dateEcheance) {
    const echeanceDate = format(new Date(invoice.dateEcheance), 'dd MMMM yyyy', { locale: fr });
    doc.text(`Date d'échéance : ${echeanceDate}`, pageWidth - 15, currentY, { align: 'right' });
  }

  currentY = 85;
  
  // --- INFORMATIONS PATIENT (Gauche) ---
  doc.setDrawColor(200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, currentY, 90, 35, 3, 3, 'FD');
  
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.setFont('helvetica', 'normal');
  doc.text("Facturé à :", 20, currentY + 7);
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  const patientName = patientData.name || patientData.user?.nomComplet || 'Patient inconnu';
  doc.text(patientName, 20, currentY + 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  if (patientData.numeroPatient) {
    doc.text(`N° Patient: ${patientData.numeroPatient}`, 20, currentY + 22);
  }
  if (patientData.email || patientData.user?.email) {
    doc.text(`Email: ${patientData.email || patientData.user?.email}`, 20, currentY + 28);
  }
  if (patientData.phone || patientData.user?.telephone) {
    doc.text(`Tél: ${patientData.phone || patientData.user?.telephone}`, 20, currentY + 34);
  }

  currentY = 130;

  // --- STATUT ---
  const statusLabels = {
    'payee': 'Payée',
    'en_attente': 'En attente',
    'en_retard': 'En retard',
    'annulee': 'Annulée'
  };
  const statusLabel = statusLabels[invoice.statut] || invoice.statut;
  const statusColors = {
    'payee': [34, 197, 94],
    'en_attente': [251, 191, 36],
    'en_retard': [239, 68, 68],
    'annulee': [100, 100, 100]
  };
  const statusColor = statusColors[invoice.statut] || [100, 100, 100];
  
  doc.setFillColor(...statusColor);
  doc.setDrawColor(...statusColor);
  doc.roundedRect(pageWidth - 50, currentY - 8, 35, 10, 2, 2, 'FD');
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(statusLabel, pageWidth - 32.5, currentY - 2, { align: 'center' });

  currentY += 15;

  // --- TABLEAU DES MONTANTS ---
  const montantPaye = invoice.montantPaye || 0;
  const montantRestant = invoice.montantTotal - montantPaye;
  
  const tableData = [
    ['Description', 'Montant'],
    ['Total HT', invoice.montantHt ? `€${Number(invoice.montantHt).toFixed(2)}` : '-'],
  ];
  
  if (invoice.tauxTva && invoice.tauxTva > 0) {
    tableData.push(['TVA', `${invoice.tauxTva}% - €${Number(invoice.montantTva || 0).toFixed(2)}`]);
  }
  
  if (invoice.remise && invoice.remise > 0) {
    tableData.push(['Remise', `€${Number(invoice.remise).toFixed(2)}`]);
  }
  
  tableData.push(['TOTAL TTC', `€${Number(invoice.montantTotal).toFixed(2)}`]);
  tableData.push(['Déjà payé', `€${Number(montantPaye).toFixed(2)}`]);
  tableData.push(['RESTE À PAYER', `€${Number(montantRestant).toFixed(2)}`]);

  autoTable(doc, {
    startY: currentY,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'striped',
    headStyles: { 
      fillColor: [41, 128, 185], 
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: { 
      fontSize: 10,
      textColor: 50
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 120 },
      1: { halign: 'right', cellWidth: 60 }
    },
    margin: { left: 15, right: 15 },
    styles: { 
      cellPadding: 5
    },
    didParseCell: function (data) {
      // Style pour la dernière ligne (RESTE À PAYER)
      if (data.row.index === tableData.length - 2 && data.column.index === 0) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 11;
        data.cell.styles.textColor = [239, 68, 68];
      }
      if (data.row.index === tableData.length - 2 && data.column.index === 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 11;
        data.cell.styles.textColor = [239, 68, 68];
        data.cell.styles.halign = 'right';
      }
    }
  });
  
  currentY = doc.lastAutoTable.finalY + 15;

  // --- NOTES ---
  if (invoice.notes) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text("Notes :", 15, currentY);
    currentY += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60);
    const notesText = doc.splitTextToSize(invoice.notes, pageWidth - 30);
    doc.text(notesText, 20, currentY);
    currentY += (notesText.length * 5) + 10;
  }

  // --- PIED DE PAGE ---
  const footerY = 260;
  
  // Ligne de séparation
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(15, footerY, pageWidth - 15, footerY);
  
  // Informations légales
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'italic');
  doc.text("Merci de votre confiance. Paiement à effectuer avant la date d'échéance.", pageWidth / 2, footerY + 10, { align: 'center' });
  
  // ID de référence
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text(`Réf: ${invoice.id}`, pageWidth - 15, 285, { align: 'right' });

  return doc;
};