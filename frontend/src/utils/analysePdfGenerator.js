import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Génère et télécharge un PDF professionnel des résultats d'analyse
 * @param {Object} analyse - Données de l'analyse
 * @param {Array} resultats - Résultats de l'analyse
 * @param {Object} patient - Infos du patient
 * @param {Object} medecin - Infos du médecin prescripteur
 */
export const generateAnalyseResultsPDF = (analyse, resultats = [], patient = null, medecin = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
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

  // --- TITRE DOCUMENT ---
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text("RÉSULTATS D'ANALYSE MÉDICALE", pageWidth / 2, 60, { align: 'center' });
  
  let currentY = 70;

  // --- INFORMATIONS ANALYSE ---
  doc.setDrawColor(200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, currentY, pageWidth - 30, 35, 3, 3, 'FD');
  
  currentY += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text("Informations de l'analyse", 20, currentY);
  
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50);
  doc.text(`Numéro d'analyse: ${analyse.numeroAnalyse || 'N/A'}`, 20, currentY);
  
  currentY += 6;
  doc.text(`Type: ${analyse.typeAnalyse?.replace('_', ' ').toUpperCase() || 'N/A'}`, 20, currentY);
  
  currentY += 6;
  if (analyse.datePrescription) {
    const datePresc = format(new Date(analyse.datePrescription), 'dd MMMM yyyy à HH:mm', { locale: fr });
    doc.text(`Date de prescription: ${datePresc}`, 20, currentY);
  }
  
  currentY += 6;
  if (analyse.laboratoire) {
    doc.text(`Laboratoire: ${analyse.laboratoire}`, 20, currentY);
  }

  currentY += 15;

  // --- INFORMATIONS PATIENT ---
  if (patient) {
    doc.setDrawColor(200);
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(15, currentY, (pageWidth - 30) / 2, 30, 3, 3, 'FD');
    
    let patientY = currentY + 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text("Patient", 20, patientY);
    
    patientY += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`${patient.name || 'N/A'}`, 20, patientY);
    
    patientY += 6;
    if (patient.numeroPatient) {
      doc.text(`N°: ${patient.numeroPatient}`, 20, patientY);
    }
    
    patientY += 6;
    if (patient.dateNaissance) {
      const birthDate = format(new Date(patient.dateNaissance), 'dd/MM/yyyy', { locale: fr });
      doc.text(`Né(e) le: ${birthDate}`, 20, patientY);
    }
  }

  // --- INFORMATIONS MÉDECIN ---
  if (medecin) {
    const medecinX = 15 + (pageWidth - 30) / 2;
    doc.setDrawColor(200);
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(medecinX, currentY, (pageWidth - 30) / 2, 30, 3, 3, 'FD');
    
    let medecinY = currentY + 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text("Médecin prescripteur", medecinX + 5, medecinY);
    
    medecinY += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`${medecin.name || medecin.nomComplet || 'N/A'}`, medecinX + 5, medecinY);
    
    medecinY += 6;
    if (medecin.specialite) {
      doc.text(`Spécialité: ${medecin.specialite}`, medecinX + 5, medecinY);
    }
  }

  currentY += 40;

  // --- RÉSULTATS ---
  if (resultats && resultats.length > 0) {
    // Vérifier si on a besoin d'une nouvelle page
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text("Résultats", 15, currentY);
    currentY += 10;

    // Tableau des résultats
    const tableData = resultats.map(r => {
      const interpretation = r.interpretation === 'normal' ? 'Normal' :
                            r.interpretation === 'anormal_bas' ? 'Bas' :
                            r.interpretation === 'anormal_haut' ? 'Haut' :
                            r.interpretation === 'critique' ? 'CRITIQUE' : 'N/A';
      
      const normale = r.valeurNormaleMin !== null && r.valeurNormaleMax !== null
        ? `${r.valeurNormaleMin} - ${r.valeurNormaleMax}`
        : 'N/A';

      return [
        r.parametre || 'N/A',
        `${r.valeur || 'N/A'} ${r.unite || ''}`,
        normale,
        interpretation
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Paramètre', 'Valeur', 'Valeurs normales', 'Interprétation']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'left',
        fontSize: 10
      },
      bodyStyles: { 
        fontSize: 9,
        textColor: 50
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 40, halign: 'center' }
      },
      margin: { left: 15, right: 15 },
      styles: { 
        cellPadding: 4
      },
      didParseCell: function (data) {
        // Colorier les résultats critiques
        if (data.column.index === 3 && data.cell.text[0] === 'CRITIQUE') {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 3 && data.cell.text[0] === 'Haut') {
          data.cell.styles.textColor = [245, 158, 11];
        }
        if (data.column.index === 3 && data.cell.text[0] === 'Bas') {
          data.cell.styles.textColor = [245, 158, 11];
        }
      }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // Commentaires sur les résultats
    const resultatsAvecCommentaires = resultats.filter(r => r.commentaire);
    if (resultatsAvecCommentaires.length > 0) {
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text("Commentaires", 15, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      resultatsAvecCommentaires.forEach(r => {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`${r.parametre}:`, 20, currentY);
        currentY += 6;
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(r.commentaire, pageWidth - 40);
        doc.text(splitText, 25, currentY);
        currentY += (splitText.length * 5) + 5;
      });
    }

    // Informations de validation
    const resultatsValides = resultats.filter(r => r.validePar);
    if (resultatsValides.length > 0) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100);
      const premierResultat = resultatsValides[0];
      if (premierResultat.dateValidation) {
        const dateValidation = format(new Date(premierResultat.dateValidation), 'dd MMMM yyyy à HH:mm', { locale: fr });
        doc.text(`Résultats validés le ${dateValidation}`, 15, currentY);
      }
    }
  } else {
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150);
    doc.text("Aucun résultat disponible pour le moment.", 15, currentY);
  }

  // --- PIED DE PAGE ---
  const footerY = pageHeight - 30;
  
  // Ligne de séparation
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(15, footerY, pageWidth - 15, footerY);
  
  // Mentions légales
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'normal');
  doc.text("Ce document est confidentiel et destiné uniquement au patient et au médecin prescripteur.", pageWidth / 2, footerY + 8, { align: 'center' });
  doc.text("Toute reproduction ou diffusion non autorisée est interdite.", pageWidth / 2, footerY + 13, { align: 'center' });
  
  // Date d'édition
  const dateEdition = format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr });
  doc.text(`Édité le ${dateEdition}`, pageWidth - 15, footerY + 18, { align: 'right' });
  
  // ID Unique de traçabilité
  const uniqueId = `ANL-${analyse.numeroAnalyse || analyse.id}-${Date.now().toString(36).toUpperCase()}`;
  doc.text(uniqueId, 15, footerY + 18);

  // Générer le blob et télécharger
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = `Resultats_Analyse_${analyse.numeroAnalyse || analyse.id}_${format(new Date(), 'yyyy-MM-dd', { locale: fr })}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(pdfUrl);
};

