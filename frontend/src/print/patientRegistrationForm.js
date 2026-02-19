/**
 * Template d'impression / PDF : formulaire d'admission patient.
 * Génère le HTML du formulaire complet pour impression ou conversion en PDF.
 * Utilisé par PatientRegistrationModal via printPatientRegistrationForm().
 */

const esc = (s) => (s ?? '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const formatDatePrint = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const MARITAL_LABELS = {
  '': '—',
  celibataire: 'Célibataire',
  marie: 'Marié(e)',
  divorce: 'Divorcé(e)',
  veuf: 'Veuf(ve)',
  pacs: 'PACS',
  concubinage: 'Concubinage',
};

const LANGUAGE_LABELS = {
  li: 'Lingala',
  fr: 'Français',
  en: 'Anglais',
  ar: 'Arabe',
  es: 'Espagnol',
  pt: 'Portugais',
};

/**
 * Construit le HTML complet du formulaire patient (pour impression / PDF).
 * @param {Object} formData - Données du formulaire (même structure que PatientRegistrationModal)
 * @returns {string} HTML complet du document
 */
export function getPatientRegistrationPrintHtml(formData) {
  const data = formData || {};
  const genderLabel = data.gender === 'masculin' ? 'Homme' : 'Femme';
  const maritalLabel = MARITAL_LABELS[data.maritalStatus] ?? '—';
  const langLabel = LANGUAGE_LABELS[data.language] ?? '—';
  const allergies = Array.isArray(data.allergies) ? data.allergies : [];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Formulaire patient - ${esc(data.firstName)} ${esc(data.lastName)}</title>
  <style>
    body { font-family: system-ui, sans-serif; font-size: 11px; line-height: 1.45; color: #1e293b; padding: 20px 24px; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 16px; margin: 0 0 4px 0; color: #0f172a; border-bottom: 2px solid #0ea5e9; padding-bottom: 6px; }
    .meta { font-size: 10px; color: #64748b; margin-bottom: 18px; }
    .block { margin-bottom: 18px; break-inside: avoid; }
    .block-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #0ea5e9; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
    .row { display: flex; margin-bottom: 6px; }
    .label { min-width: 160px; color: #475569; font-weight: 500; }
    .value { flex: 1; }
    .textarea { white-space: pre-wrap; background: #f8fafc; padding: 8px; border-radius: 6px; margin-top: 4px; font-size: 10px; }
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>Formulaire d'admission patient</h1>
  <p class="meta">Document à remettre au patient — ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

  <div class="block">
    <div class="block-title">1. Identité</div>
    <div class="row"><span class="label">Prénom</span><span class="value">${esc(data.firstName)}</span></div>
    <div class="row"><span class="label">Nom</span><span class="value">${esc(data.lastName)}</span></div>
    <div class="row"><span class="label">Date de naissance</span><span class="value">${formatDatePrint(data.dateOfBirth)}</span></div>
    <div class="row"><span class="label">Sexe</span><span class="value">${genderLabel}</span></div>
    <div class="row"><span class="label">Lieu de naissance</span><span class="value">${esc(data.placeOfBirth) || '—'}</span></div>
  </div>

  <div class="block">
    <div class="block-title">2. Contact</div>
    <div class="row"><span class="label">Téléphone</span><span class="value">${esc(data.phone) || '—'}</span></div>
    <div class="row"><span class="label">Email</span><span class="value">${esc(data.email) || '—'}</span></div>
    <div class="row"><span class="label">Adresse</span><span class="value">${esc(data.address) || '—'}</span></div>
    <div class="row"><span class="label">Code postal / Ville / Pays</span><span class="value">${esc(data.postalCode)} ${esc(data.city)} ${esc(data.country)}</span></div>
  </div>

  <div class="block">
    <div class="block-title">3. Contact d'urgence</div>
    <div class="row"><span class="label">Nom</span><span class="value">${esc(data.emergencyContact) || '—'}</span></div>
    <div class="row"><span class="label">Téléphone</span><span class="value">${esc(data.emergencyPhone) || '—'}</span></div>
    <div class="row"><span class="label">Relation</span><span class="value">${esc(data.emergencyRelation) || '—'}</span></div>
  </div>

  <div class="block">
    <div class="block-title">4. Informations professionnelles</div>
    <div class="row"><span class="label">Profession</span><span class="value">${esc(data.profession) || '—'}</span></div>
    <div class="row"><span class="label">Situation familiale</span><span class="value">${maritalLabel}</span></div>
    <div class="row"><span class="label">Langue préférée</span><span class="value">${langLabel}</span></div>
  </div>

  <div class="block">
    <div class="block-title">5. Assurance</div>
    <div class="row"><span class="label">Type d'assurance</span><span class="value">${esc(data.insurance) || '—'}</span></div>
    <div class="row"><span class="label">N° Sécu / Assurance</span><span class="value">${esc(data.insuranceNumber) || '—'}</span></div>
  </div>

  <div class="block">
    <div class="block-title">6. Informations médicales</div>
    <div class="row"><span class="label">Groupe sanguin</span><span class="value">${esc(data.bloodType) || 'Non renseigné'}</span></div>
    <div class="row"><span class="label">Donneur d'organes</span><span class="value">${data.organDonor ? 'Oui' : 'Non'}</span></div>
    <div class="row"><span class="label">Allergies</span><span class="value">${allergies.length > 0 ? esc(allergies.join(', ')) : 'Aucune'}</span></div>
    ${data.medicalHistory ? `<div class="row"><span class="label">Antécédents personnels</span></div><div class="textarea">${esc(data.medicalHistory)}</div>` : ''}
    ${data.familyHistory ? `<div class="row" style="margin-top:8px"><span class="label">Antécédents familiaux</span></div><div class="textarea">${esc(data.familyHistory)}</div>` : ''}
    ${data.currentMedications ? `<div class="row" style="margin-top:8px"><span class="label">Médicaments actuels</span></div><div class="textarea">${esc(data.currentMedications)}</div>` : ''}
    ${data.vaccinations ? `<div class="row" style="margin-top:8px"><span class="label">Vaccinations</span></div><div class="textarea">${esc(data.vaccinations)}</div>` : ''}
    ${data.disabilities ? `<div class="row" style="margin-top:8px"><span class="label">Handicaps / limitations</span></div><div class="textarea">${esc(data.disabilities)}</div>` : ''}
  </div>

  <div class="block">
    <div class="block-title">7. Consentements</div>
    <div class="row"><span class="value">☐ Consentement aux soins et exactitude des informations</span><span>${data.consentTreatment ? '☑' : '☐'}</span></div>
    <div class="row"><span class="value">☐ Acceptation du traitement des données (RGPD)</span><span>${data.consentData ? '☑' : '☐'}</span></div>
  </div>

  <div class="footer">OpenClinic — Formulaire d'admission patient — À remettre au patient.</div>
</body>
</html>`;
}

/**
 * Ouvre une fenêtre d'impression avec le formulaire patient et déclenche l'impression.
 * @param {Object} formData - Données du formulaire
 * @param {{ onPopupBlocked?: () => void }} options - onPopupBlocked appelé si la fenêtre est bloquée
 */
export function printPatientRegistrationForm(formData, options = {}) {
  const html = getPatientRegistrationPrintHtml(formData);
  const win = window.open('', '_blank');
  if (!win) {
    options.onPopupBlocked?.();
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.onafterprint = () => win.close();
  }, 300);
}
