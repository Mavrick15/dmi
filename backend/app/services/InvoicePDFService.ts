import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type Facture from '#models/Facture'
import { DateTime } from 'luxon'

/**
 * Service de génération de PDF pour les factures
 * Format moderne et professionnel
 */
export class InvoicePDFService {
  /**
   * Génère un PDF de facture au format professionnel
   */
  static async generateInvoicePDF(facture: Facture): Promise<Uint8Array> {
    // Créer un nouveau document PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // Format A4
    
    // Charger les polices
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    const { width, height } = page.getSize()
    const margin = 50
    
    // Couleurs
    const black = rgb(0, 0, 0)
    const darkGray = rgb(0.3, 0.3, 0.3)
    const mediumGray = rgb(0.5, 0.5, 0.5)
    const lightGray = rgb(0.9, 0.9, 0.9)
    const tableHeaderGray = rgb(0.95, 0.95, 0.95)
    
    let yPosition = height - margin
    
    // ========================================
    // 1. EN-TÊTE : "Invoice" + Logo
    // ========================================
    page.drawText('Invoice', {
      x: margin,
      y: yPosition,
      size: 32,
      font: boldFont,
      color: black
    })
    
    // Logo/Icône (simple carré avec initiales)
    const logoSize = 50
    const logoX = width - margin - logoSize
    page.drawRectangle({
      x: logoX,
      y: yPosition - 10,
      width: logoSize,
      height: logoSize,
      color: darkGray
    })
    
    page.drawText('OC', {
      x: logoX + 12,
      y: yPosition + 8,
      size: 18,
      font: boldFont,
      color: rgb(1, 1, 1)
    })
    
    yPosition -= 80
    
    // ========================================
    // 2. INFORMATIONS DE LA FACTURE (En-tête)
    // ========================================
    const invoiceInfoY = yPosition
    
    // Numéro de facture
    page.drawText('Invoice number', {
      x: margin,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: darkGray
    })
    
    page.drawText(facture.numeroFacture, {
      x: margin + 120,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: black
    })
    
    yPosition -= 18
    
    // Date d'émission
    page.drawText('Date of issue', {
      x: margin,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: darkGray
    })
    
    page.drawText(facture.dateEmission?.toFormat('MMMM dd, yyyy', { locale: 'en' }) || 'N/A', {
      x: margin + 120,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: black
    })
    
    yPosition -= 18
    
    // Date d'échéance
    page.drawText('Date due', {
      x: margin,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: darkGray
    })
    
    page.drawText(facture.dateEcheance?.toFormat('MMMM dd, yyyy', { locale: 'en' }) || 'N/A', {
      x: margin + 120,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: black
    })
    
    yPosition -= 50
    
    // ========================================
    // 3. SECTION ÉMETTEUR (Cursor) ET DESTINATAIRE (Bill to)
    // ========================================
    const twoColumnsY = yPosition
    
    // COLONNE GAUCHE : Émetteur (OpenClinic)
    page.drawText('Cursor', {
      x: margin,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: black
    })
    
    yPosition -= 20
    
    const etablissementInfo = [
      'OpenClinic',
      '1st street 6482, Malemba, Matete',
      'Kinshasa',
      'Congo - Kinshasa',
      '+243 XX XXX XXXX',
      'contact@openclinic.cd'
    ]
    
    for (const line of etablissementInfo) {
      page.drawText(line, {
        x: margin,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: darkGray
      })
      yPosition -= 15
    }
    
    // COLONNE DROITE : Destinataire (Patient)
    yPosition = twoColumnsY
    const rightColX = width / 2 + 20
    
    page.drawText('Bill to', {
      x: rightColX,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: black
    })
    
    yPosition -= 20
    
    const patientInfo = [
      facture.patient?.user?.nomComplet || 'Patient inconnu',
      facture.patient?.user?.adresse || '1st street 6482, Malemba, Matete',
      'Kinshasa',
      'Congo - Kinshasa',
      facture.patient?.user?.email || 'patient@email.com'
    ]
    
    for (const line of patientInfo) {
      page.drawText(line, {
        x: rightColX,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: darkGray
      })
      yPosition -= 15
    }
    
    yPosition = Math.min(yPosition, twoColumnsY - 110) - 40
    
    // ========================================
    // 4. MONTANT DÛ (En gros et bien visible)
    // ========================================
    const montantDu = facture.montantTotal - facture.montantPaye
    const dateEcheance = facture.dateEcheance?.toFormat('MMMM dd, yyyy', { locale: 'en' }) || 'N/A'
    
    page.drawText(`$${montantDu.toFixed(2)} USD due ${dateEcheance}`, {
      x: margin,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: black
    })
    
    yPosition -= 50
    
    // ========================================
    // 5. TABLEAU DES SERVICES
    // ========================================
    
    // En-tête du tableau avec fond gris
    const tableHeaderY = yPosition
    const tableHeaderHeight = 25
    const rowHeight = 35
    
    page.drawRectangle({
      x: margin,
      y: tableHeaderY - tableHeaderHeight,
      width: width - 2 * margin,
      height: tableHeaderHeight,
      color: tableHeaderGray
    })
    
    // Ligne de bordure sous l'en-tête
    page.drawLine({
      start: { x: margin, y: tableHeaderY - tableHeaderHeight },
      end: { x: width - margin, y: tableHeaderY - tableHeaderHeight },
      thickness: 1,
      color: mediumGray
    })
    
    // Colonnes du tableau
    const descCol = margin + 10
    const qtyCol = width - margin - 250
    const priceCol = width - margin - 150
    const amountCol = width - margin - 70
    
    // En-têtes de colonnes
    page.drawText('Description', {
      x: descCol,
      y: tableHeaderY - 17,
      size: 10,
      font: boldFont,
      color: darkGray
    })
    
    page.drawText('Qty', {
      x: qtyCol,
      y: tableHeaderY - 17,
      size: 10,
      font: boldFont,
      color: darkGray
    })
    
    page.drawText('Unit price', {
      x: priceCol,
      y: tableHeaderY - 17,
      size: 10,
      font: boldFont,
      color: darkGray
    })
    
    page.drawText('Amount', {
      x: amountCol,
      y: tableHeaderY - 17,
      size: 10,
      font: boldFont,
      color: darkGray
    })
    
    yPosition = tableHeaderY - tableHeaderHeight - 20
    
    // Lignes du tableau
    const services = this.getFactureServices(facture)
    
    for (const service of services) {
      // Description (avec retour à la ligne si nécessaire)
      const maxDescWidth = qtyCol - descCol - 20
      const descLines = this.wrapText(service.description, maxDescWidth, 9, regularFont)
      
      page.drawText(descLines[0], {
        x: descCol,
        y: yPosition,
        size: 9,
        font: regularFont,
        color: darkGray
      })
      
      if (descLines[1]) {
        page.drawText(descLines[1], {
          x: descCol,
          y: yPosition - 12,
          size: 9,
          font: regularFont,
          color: mediumGray
        })
      }
      
      // Quantité
      page.drawText(service.quantity.toString(), {
        x: qtyCol + 10,
        y: yPosition,
        size: 9,
        font: regularFont,
        color: darkGray
      })
      
      // Prix unitaire
      page.drawText(`$${service.unitPrice.toFixed(2)}`, {
        x: priceCol,
        y: yPosition,
        size: 9,
        font: regularFont,
        color: darkGray
      })
      
      // Montant
      page.drawText(`$${service.amount.toFixed(2)}`, {
        x: amountCol,
        y: yPosition,
        size: 9,
        font: regularFont,
        color: darkGray
      })
      
      yPosition -= rowHeight
      
      // Ligne de séparation
      page.drawLine({
        start: { x: margin, y: yPosition + 15 },
        end: { x: width - margin, y: yPosition + 15 },
        thickness: 0.5,
        color: lightGray
      })
    }
    
    yPosition -= 30
    
    // ========================================
    // 6. TOTAUX (Alignés à droite)
    // ========================================
    const totalsLabelX = width - margin - 200
    const totalsValueX = width - margin - 70
    
    // Sous-total
    page.drawText('Subtotal', {
      x: totalsLabelX,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: darkGray
    })
    
    page.drawText(`$${facture.montantTotal.toFixed(2)}`, {
      x: totalsValueX,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: darkGray
    })
    
    yPosition -= 18
    
    // Total
    page.drawText('Total', {
      x: totalsLabelX,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: darkGray
    })
    
    page.drawText(`$${facture.montantTotal.toFixed(2)}`, {
      x: totalsValueX,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: darkGray
    })
    
    yPosition -= 25
    
    // Amount due (en gras)
    page.drawText('Amount due', {
      x: totalsLabelX,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: black
    })
    
    page.drawText(`$${montantDu.toFixed(2)} USD`, {
      x: totalsValueX - 10,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: black
    })
    
    // ========================================
    // 7. PIED DE PAGE
    // ========================================
    const footerY = 60
    
    page.drawText('OpenClinic', {
      x: margin,
      y: footerY + 10,
      size: 9,
      font: regularFont,
      color: mediumGray
    })
    
    page.drawText('US EIN 87-4436547', {
      x: margin,
      y: footerY - 5,
      size: 9,
      font: regularFont,
      color: mediumGray
    })
    
    // Numéro de page
    page.drawText(`Page 1 of 1`, {
      x: width - margin - 60,
      y: footerY - 5,
      size: 8,
      font: regularFont,
      color: mediumGray
    })
    
    // Sérialiser le PDF en Uint8Array
    const pdfBytes = await pdfDoc.save()
    return pdfBytes
  }
  
  /**
   * Récupère les services de la facture
   */
  private static getFactureServices(facture: Facture) {
    const services = []
    
    // Service principal : Consultation
    if (facture.consultation) {
      const dateDebut = facture.dateEmission?.toFormat('MMM dd', { locale: 'en' }) || ''
      const dateFin = facture.dateEcheance?.toFormat('MMM dd, yyyy', { locale: 'en' }) || ''
      
      services.push({
        description: `Consultation médicale - ${dateDebut} - ${dateFin}`,
        quantity: 1,
        unitPrice: facture.montantTotal,
        amount: facture.montantTotal
      })
    } else if (facture.analyses && facture.analyses.length > 0) {
      // Services : Analyses
      for (const analyse of facture.analyses) {
        services.push({
          description: `Analyse ${analyse.typeAnalyse || 'médicale'} - ${analyse.numeroAnalyse || ''}`,
          quantity: 1,
          unitPrice: facture.montantTotal / facture.analyses.length,
          amount: facture.montantTotal / facture.analyses.length
        })
      }
    } else {
      // Service générique
      const dateDebut = facture.dateEmission?.toFormat('MMM dd', { locale: 'en' }) || ''
      const dateFin = facture.dateEcheance?.toFormat('MMM dd, yyyy', { locale: 'en' }) || ''
      
      services.push({
        description: `Service médical - ${dateDebut} - ${dateFin}`,
        quantity: 1,
        unitPrice: facture.montantTotal,
        amount: facture.montantTotal
      })
    }
    
    return services
  }
  
  /**
   * Découpe un texte pour qu'il tienne dans une largeur donnée
   */
  private static wrapText(text: string, maxWidth: number, fontSize: number, font: any): string[] {
    // Estimation simple : ~0.5 * fontSize par caractère
    const avgCharWidth = fontSize * 0.5
    const maxChars = Math.floor(maxWidth / avgCharWidth)
    
    if (text.length <= maxChars) {
      return [text]
    }
    
    // Couper au dernier espace avant maxChars
    let cutPoint = maxChars
    for (let i = maxChars; i >= 0; i--) {
      if (text[i] === ' ') {
        cutPoint = i
        break
      }
    }
    
    return [
      text.substring(0, cutPoint),
      text.substring(cutPoint + 1)
    ]
  }
}
