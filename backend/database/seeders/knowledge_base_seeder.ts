import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import KnowledgeBase from '../../app/models/knowledge_base.js'

export default class extends BaseSeeder {
  async run() {
    // Protocoles - Enrichi avec beaucoup plus de protocoles
    const protocols = [
      {
        type: 'protocols' as const,
        title: 'Protocole Hypertension Artérielle',
        category: 'Cardiologie',
        lastUpdated: '2025-10-25',
        description: 'Prise en charge complète de l\'hypertension artérielle selon les dernières recommandations ESC/ESH 2023. Évaluation initiale, traitement médicamenteux, suivi.',
        tags: ['HTA', 'Cardiologie', 'Traitement'],
        urgency: 'standard' as const,
        actif: true,
        ordreAffichage: 1
      },
      {
        type: 'protocols' as const,
        title: 'Gestion Diabète Type 2',
        category: 'Endocrinologie',
        lastUpdated: '2025-10-28',
        description: 'Protocole de suivi et traitement du diabète de type 2 avec algorithme thérapeutique. Surveillance glycémique, complications, éducation thérapeutique.',
        tags: ['Diabète', 'Endocrinologie', 'Suivi'],
        urgency: 'priority' as const,
        actif: true,
        ordreAffichage: 2
      },
      {
        type: 'protocols' as const,
        title: 'Urgences Respiratoires',
        category: 'Pneumologie',
        lastUpdated: '2025-10-30',
        description: 'Protocole d\'urgence pour la prise en charge des détresses respiratoires aiguës. Évaluation, oxygénothérapie, ventilation non invasive.',
        tags: ['Urgence', 'Respiratoire', 'Pneumologie'],
        urgency: 'urgent' as const,
        actif: true,
        ordreAffichage: 3
      },
      {
        type: 'protocols' as const,
        title: 'Protocole Insuffisance Cardiaque',
        category: 'Cardiologie',
        lastUpdated: '2025-11-01',
        description: 'Prise en charge de l\'insuffisance cardiaque chronique selon les recommandations ESC. Classification NYHA, traitement médicamenteux, suivi.',
        tags: ['Cardiologie', 'Insuffisance cardiaque', 'Traitement'],
        urgency: 'priority' as const,
        actif: true,
        ordreAffichage: 4
      },
      {
        type: 'protocols' as const,
        title: 'Protocole Asthme',
        category: 'Pneumologie',
        lastUpdated: '2025-10-15',
        description: 'Prise en charge de l\'asthme selon GINA. Traitement de fond, traitement de crise, éducation du patient.',
        tags: ['Asthme', 'Pneumologie', 'Traitement'],
        urgency: 'standard' as const,
        actif: true,
        ordreAffichage: 5
      },
      {
        type: 'protocols' as const,
        title: 'Protocole Bronchopneumopathie Chronique Obstructive',
        category: 'Pneumologie',
        lastUpdated: '2025-09-20',
        description: 'Prise en charge de la BPCO selon GOLD. Classification, traitement bronchodilatateur, réhabilitation respiratoire.',
        tags: ['BPCO', 'Pneumologie', 'Traitement'],
        urgency: 'standard' as const,
        actif: true,
        ordreAffichage: 6
      },
      {
        type: 'protocols' as const,
        title: 'Protocole Hyperthyroïdie',
        category: 'Endocrinologie',
        lastUpdated: '2025-10-10',
        description: 'Diagnostic et traitement de l\'hyperthyroïdie. Bilan thyroïdien, traitement médicamenteux, chirurgie si nécessaire.',
        tags: ['Hyperthyroïdie', 'Endocrinologie', 'Traitement'],
        urgency: 'priority' as const,
        actif: true,
        ordreAffichage: 7
      },
      {
        type: 'protocols' as const,
        title: 'Protocole Hypothyroïdie',
        category: 'Endocrinologie',
        lastUpdated: '2025-10-12',
        description: 'Diagnostic et traitement de l\'hypothyroïdie. Substitution par L-thyroxine, suivi biologique.',
        tags: ['Hypothyroïdie', 'Endocrinologie', 'Traitement'],
        urgency: 'standard' as const,
        actif: true,
        ordreAffichage: 8
      },
      {
        type: 'protocols' as const,
        title: 'Protocole Insuffisance Rénale Chronique',
        category: 'Néphrologie',
        lastUpdated: '2025-09-25',
        description: 'Prise en charge de l\'insuffisance rénale chronique. Classification KDIGO, ralentissement de la progression, préparation dialyse.',
        tags: ['Néphrologie', 'Insuffisance rénale', 'Traitement'],
        urgency: 'priority' as const,
        actif: true,
        ordreAffichage: 9
      },
      {
        type: 'protocols' as const,
        title: 'Protocole Anémie Ferriprive',
        category: 'Hématologie',
        lastUpdated: '2025-10-05',
        description: 'Diagnostic et traitement de l\'anémie ferriprive. Bilan martial, supplémentation en fer, recherche étiologique.',
        tags: ['Anémie', 'Hématologie', 'Traitement'],
        urgency: 'standard' as const,
        actif: true,
        ordreAffichage: 10
      },
      {
        type: 'protocols' as const,
        title: 'Protocole Épilepsie',
        category: 'Neurologie',
        lastUpdated: '2025-09-30',
        description: 'Prise en charge de l\'épilepsie. Classification des crises, choix du traitement antiépileptique, suivi.',
        tags: ['Épilepsie', 'Neurologie', 'Traitement'],
        urgency: 'priority' as const,
        actif: true,
        ordreAffichage: 11
      },
      {
        type: 'protocols' as const,
        title: 'Protocole Accident Vasculaire Cérébral',
        category: 'Neurologie',
        lastUpdated: '2025-10-20',
        description: 'Prise en charge de l\'AVC en urgence. Thrombolyse, thrombectomie, prévention secondaire.',
        tags: ['AVC', 'Neurologie', 'Urgence'],
        urgency: 'urgent' as const,
        actif: true,
        ordreAffichage: 12
      },
      {
        type: 'protocols' as const,
        title: 'Protocole Dépression',
        category: 'Psychiatrie',
        lastUpdated: '2025-10-18',
        description: 'Diagnostic et traitement de la dépression. Échelles d\'évaluation, traitement antidépresseur, psychothérapie.',
        tags: ['Dépression', 'Psychiatrie', 'Traitement'],
        urgency: 'priority' as const,
        actif: true,
        ordreAffichage: 13
      },
      {
        type: 'protocols' as const,
        title: 'Protocole Infection Urinaire',
        category: 'Urologie',
        lastUpdated: '2025-10-22',
        description: 'Diagnostic et traitement des infections urinaires. Cystite simple, pyélonéphrite, antibiothérapie adaptée.',
        tags: ['Infection urinaire', 'Urologie', 'Traitement'],
        urgency: 'standard' as const,
        actif: true,
        ordreAffichage: 14
      },
      {
        type: 'protocols' as const,
        title: 'Protocole Pneumonie Communautaire',
        category: 'Pneumologie',
        lastUpdated: '2025-10-25',
        description: 'Diagnostic et traitement de la pneumonie acquise en communauté. Score de CURB-65, antibiothérapie probabiliste.',
        tags: ['Pneumonie', 'Pneumologie', 'Infectiologie'],
        urgency: 'urgent' as const,
        actif: true,
        ordreAffichage: 15
      }
    ]

    // Médicaments - Enrichi avec beaucoup plus de médicaments
    const medications = [
      {
        type: 'medications' as const,
        name: 'Amlodipine',
        category: 'Antihypertenseur',
        dosage: '5-10mg/jour',
        contraindications: 'Hypersensibilité, choc cardiogénique',
        interactions: 'Simvastatine, Ciclosporine',
        sideEffects: 'Œdèmes périphériques, céphalées',
        actif: true,
        ordreAffichage: 1
      },
      {
        type: 'medications' as const,
        name: 'Metformine',
        category: 'Antidiabétique',
        dosage: '500-2000mg/jour',
        contraindications: 'Insuffisance rénale sévère, acidose métabolique',
        interactions: 'Produits de contraste iodés',
        sideEffects: 'Troubles digestifs, acidose lactique (rare)',
        actif: true,
        ordreAffichage: 2
      },
      {
        type: 'medications' as const,
        name: 'Paracétamol',
        category: 'Antalgique',
        dosage: '500mg-1g toutes les 6h',
        contraindications: 'Insuffisance hépatique sévère',
        interactions: 'Anticoagulants oraux (si forte dose)',
        sideEffects: 'Rares réactions allergiques',
        actif: true,
        ordreAffichage: 3
      },
      {
        type: 'medications' as const,
        name: 'Ibuprofène',
        category: 'Anti-inflammatoire non stéroïdien',
        dosage: '200-400mg x3/jour',
        contraindications: 'Ulcère gastroduodénal actif, insuffisance rénale sévère',
        interactions: 'Anticoagulants, diurétiques, IEC',
        sideEffects: 'Troubles digestifs, insuffisance rénale, réactions cutanées',
        actif: true,
        ordreAffichage: 4
      },
      {
        type: 'medications' as const,
        name: 'Amoxicilline',
        category: 'Antibiotique',
        dosage: '1g x3/jour',
        contraindications: 'Hypersensibilité aux pénicillines',
        interactions: 'Contraceptifs oraux, anticoagulants',
        sideEffects: 'Troubles digestifs, réactions allergiques, candidose',
        actif: true,
        ordreAffichage: 5
      },
      {
        type: 'medications' as const,
        name: 'Amoxicilline-Acide Clavulanique',
        category: 'Antibiotique',
        dosage: '1g x3/jour',
        contraindications: 'Hypersensibilité aux pénicillines, antécédent d\'hépatite',
        interactions: 'Contraceptifs oraux, anticoagulants',
        sideEffects: 'Troubles digestifs, hépatite, diarrhée',
        actif: true,
        ordreAffichage: 6
      },
      {
        type: 'medications' as const,
        name: 'Ceftriaxone',
        category: 'Antibiotique',
        dosage: '1-2g/jour en IV ou IM',
        contraindications: 'Hypersensibilité aux céphalosporines',
        interactions: 'Anticoagulants, diurétiques de l\'anse',
        sideEffects: 'Réactions allergiques, troubles digestifs, phlébite',
        actif: true,
        ordreAffichage: 7
      },
      {
        type: 'medications' as const,
        name: 'Ciprofloxacine',
        category: 'Antibiotique',
        dosage: '500mg x2/jour',
        contraindications: 'Hypersensibilité aux fluoroquinolones, grossesse, allaitement',
        interactions: 'Antiacides, théophylline, warfarine',
        sideEffects: 'Troubles digestifs, tendinopathie, photosensibilisation',
        actif: true,
        ordreAffichage: 8
      },
      {
        type: 'medications' as const,
        name: 'Atenolol',
        category: 'Bêta-bloquant',
        dosage: '25-100mg/jour',
        contraindications: 'Asthme sévère, bloc auriculo-ventriculaire, insuffisance cardiaque décompensée',
        interactions: 'Insuline, antidiabétiques oraux, vérapamil',
        sideEffects: 'Bradycardie, hypotension, fatigue, troubles du sommeil',
        actif: true,
        ordreAffichage: 9
      },
      {
        type: 'medications' as const,
        name: 'Lisinopril',
        category: 'Inhibiteur de l\'enzyme de conversion',
        dosage: '5-40mg/jour',
        contraindications: 'Grossesse, sténose bilatérale des artères rénales',
        interactions: 'Diurétiques, AINS, lithium',
        sideEffects: 'Toux sèche, hypotension, hyperkaliémie, angio-œdème',
        actif: true,
        ordreAffichage: 10
      },
      {
        type: 'medications' as const,
        name: 'Furosémide',
        category: 'Diurétique de l\'anse',
        dosage: '20-80mg/jour',
        contraindications: 'Anurie, insuffisance rénale terminale',
        interactions: 'Digitaliques, lithium, AINS',
        sideEffects: 'Hypovolémie, hypokaliémie, hyponatrémie, ototoxicité',
        actif: true,
        ordreAffichage: 11
      },
      {
        type: 'medications' as const,
        name: 'Atorvastatine',
        category: 'Hypolipémiant',
        dosage: '10-80mg/jour',
        contraindications: 'Maladie hépatique active, grossesse',
        interactions: 'Ciclosporine, macrolides, antifongiques azolés',
        sideEffects: 'Myalgies, rhabdomyolyse, troubles hépatiques',
        actif: true,
        ordreAffichage: 12
      },
      {
        type: 'medications' as const,
        name: 'Oméprazole',
        category: 'Inhibiteur de la pompe à protons',
        dosage: '20-40mg/jour',
        contraindications: 'Hypersensibilité',
        interactions: 'Clopidogrel, warfarine, phénytoïne',
        sideEffects: 'Troubles digestifs, céphalées, carence en vitamine B12',
        actif: true,
        ordreAffichage: 13
      },
      {
        type: 'medications' as const,
        name: 'Tramadol',
        category: 'Antalgique opioïde',
        dosage: '50-100mg x4/jour',
        contraindications: 'Intoxication alcoolique aiguë, traitement par IMAO',
        interactions: 'IMAO, antidépresseurs, benzodiazépines',
        sideEffects: 'Nausées, vomissements, somnolence, dépendance',
        actif: true,
        ordreAffichage: 14
      },
      {
        type: 'medications' as const,
        name: 'Morphine',
        category: 'Antalgique opioïde',
        dosage: '5-20mg x4/jour',
        contraindications: 'Insuffisance respiratoire, occlusion intestinale',
        interactions: 'Benzodiazépines, alcool, autres opioïdes',
        sideEffects: 'Dépression respiratoire, nausées, constipation, dépendance',
        actif: true,
        ordreAffichage: 15
      },
      {
        type: 'medications' as const,
        name: 'Insuline Glargine',
        category: 'Antidiabétique',
        dosage: 'Dose individuelle selon glycémie',
        contraindications: 'Hypoglycémie',
        interactions: 'Bêta-bloquants, alcool, corticostéroïdes',
        sideEffects: 'Hypoglycémie, réactions au site d\'injection',
        actif: true,
        ordreAffichage: 16
      },
      {
        type: 'medications' as const,
        name: 'Glibenclamide',
        category: 'Antidiabétique oral',
        dosage: '2.5-15mg/jour',
        contraindications: 'Insuffisance rénale sévère, acidocétose',
        interactions: 'AINS, bêta-bloquants, alcool',
        sideEffects: 'Hypoglycémie, prise de poids, troubles digestifs',
        actif: true,
        ordreAffichage: 17
      },
      {
        type: 'medications' as const,
        name: 'Lévothyroxine',
        category: 'Hormone thyroïdienne',
        dosage: '25-200μg/jour',
        contraindications: 'Infarctus aigu du myocarde, thyrotoxicose',
        interactions: 'Fer, calcium, cholestyramine',
        sideEffects: 'Palpitations, insomnie, perte de poids si surdosage',
        actif: true,
        ordreAffichage: 18
      },
      {
        type: 'medications' as const,
        name: 'Warfarine',
        category: 'Anticoagulant',
        dosage: 'Dose adaptée selon INR',
        contraindications: 'Hémorragie active, grossesse',
        interactions: 'Nombreux médicaments, alcool, vitamine K',
        sideEffects: 'Hémorragies, nécrose cutanée, interactions multiples',
        actif: true,
        ordreAffichage: 19
      },
      {
        type: 'medications' as const,
        name: 'Aspirine',
        category: 'Antiagrégant plaquettaire',
        dosage: '75-100mg/jour',
        contraindications: 'Ulcère gastroduodénal actif, hémophilie',
        interactions: 'Anticoagulants, AINS, méthotrexate',
        sideEffects: 'Troubles digestifs, hémorragies, réactions allergiques',
        actif: true,
        ordreAffichage: 20
      }
    ]

    // Diagnostics - Enrichi avec beaucoup plus de diagnostics CIM-10
    const diagnostics = [
      {
        type: 'diagnostics' as const,
        code: 'I10',
        name: 'Hypertension Essentielle',
        criteria: 'PAS ≥140 mmHg et/ou PAD ≥90 mmHg',
        examinations: 'ECG, Fond d\'œil, Créatininémie, Protéinurie',
        differential: 'HTA secondaire, Syndrome métabolique',
        actif: true,
        ordreAffichage: 1
      },
      {
        type: 'diagnostics' as const,
        code: 'E11',
        name: 'Diabète Type 2',
        criteria: 'Glycémie à jeun ≥1.26 g/L ou HbA1c ≥6.5%',
        examinations: 'HbA1c, Microalbuminurie, Fond d\'œil',
        differential: 'Diabète type 1, MODY, Diabète secondaire',
        actif: true,
        ordreAffichage: 2
      },
      {
        type: 'diagnostics' as const,
        code: 'E10',
        name: 'Diabète Type 1',
        criteria: 'Glycémie élevée avec cétose, nécessité d\'insuline',
        examinations: 'Glycémie, HbA1c, Ac anti-GAD, Ac anti-IA2',
        differential: 'Diabète type 2, MODY, Diabète secondaire',
        actif: true,
        ordreAffichage: 3
      },
      {
        type: 'diagnostics' as const,
        code: 'I50',
        name: 'Insuffisance Cardiaque',
        criteria: 'Symptômes (dyspnée, fatigue) + signes (œdèmes, crépitants)',
        examinations: 'BNP/NT-proBNP, Échocardiographie, Radiographie thorax',
        differential: 'BPCO, Embolie pulmonaire, Pneumonie',
        actif: true,
        ordreAffichage: 4
      },
      {
        type: 'diagnostics' as const,
        code: 'I21',
        name: 'Infarctus du Myocarde',
        criteria: 'Douleur thoracique + élévation troponine + modifications ECG',
        examinations: 'Troponine, ECG, Échocardiographie, Coronarographie',
        differential: 'Angor instable, Embolie pulmonaire, Dissection aortique',
        actif: true,
        ordreAffichage: 5
      },
      {
        type: 'diagnostics' as const,
        code: 'J44',
        name: 'Bronchopneumopathie Chronique Obstructive',
        criteria: 'Dyspnée chronique + obstruction bronchique (VEMS/CV < 70%)',
        examinations: 'EFR, Radiographie thorax, Gazométrie artérielle',
        differential: 'Asthme, Insuffisance cardiaque, Bronchectasies',
        actif: true,
        ordreAffichage: 6
      },
      {
        type: 'diagnostics' as const,
        code: 'J45',
        name: 'Asthme',
        criteria: 'Dyspnée paroxystique + sibilants + réversibilité à la spirométrie',
        examinations: 'EFR avec test de réversibilité, Tests allergologiques',
        differential: 'BPCO, Insuffisance cardiaque, Embolie pulmonaire',
        actif: true,
        ordreAffichage: 7
      },
      {
        type: 'diagnostics' as const,
        code: 'J18',
        name: 'Pneumonie',
        criteria: 'Fièvre + toux + signes auscultatoires + opacité radiologique',
        examinations: 'Radiographie thorax, NFS, CRP, Hémocultures',
        differential: 'Bronchite, Embolie pulmonaire, Cancer bronchique',
        actif: true,
        ordreAffichage: 8
      },
      {
        type: 'diagnostics' as const,
        code: 'N39',
        name: 'Infection Urinaire',
        criteria: 'Leucocyturie + bactériurie significative',
        examinations: 'ECBU, NFS, CRP',
        differential: 'Vaginite, Prostatite, Pyélonéphrite',
        actif: true,
        ordreAffichage: 9
      },
      {
        type: 'diagnostics' as const,
        code: 'N10',
        name: 'Pyélonéphrite Aiguë',
        criteria: 'Fièvre + douleur lombaire + leucocyturie + bactériurie',
        examinations: 'ECBU, NFS, CRP, Échographie rénale',
        differential: 'Cystite, Colique néphrétique, Appendicite',
        actif: true,
        ordreAffichage: 10
      },
      {
        type: 'diagnostics' as const,
        code: 'E03',
        name: 'Hypothyroïdie',
        criteria: 'TSH élevée + T4 libre basse',
        examinations: 'TSH, T4 libre, T3 libre, Ac anti-TPO',
        differential: 'Hypothyroïdie secondaire, Syndrome de maladie non thyroïdienne',
        actif: true,
        ordreAffichage: 11
      },
      {
        type: 'diagnostics' as const,
        code: 'E05',
        name: 'Hyperthyroïdie',
        criteria: 'TSH basse + T4 libre élevée',
        examinations: 'TSH, T4 libre, T3 libre, Ac anti-récepteur TSH',
        differential: 'Thyrotoxicose factice, Goitre multinodulaire toxique',
        actif: true,
        ordreAffichage: 12
      },
      {
        type: 'diagnostics' as const,
        code: 'I63',
        name: 'Accident Vasculaire Cérébral',
        criteria: 'Déficit neurologique focal d\'apparition brutale',
        examinations: 'Scanner cérébral, IRM, Doppler des troncs supra-aortiques',
        differential: 'Migraine avec aura, Épilepsie, Tumeur cérébrale',
        actif: true,
        ordreAffichage: 13
      },
      {
        type: 'diagnostics' as const,
        code: 'G40',
        name: 'Épilepsie',
        criteria: 'Crises épileptiques récurrentes',
        examinations: 'EEG, IRM cérébrale, Bilan métabolique',
        differential: 'Syncope, Crise de panique, Pseudocrises',
        actif: true,
        ordreAffichage: 14
      },
      {
        type: 'diagnostics' as const,
        code: 'F32',
        name: 'Épisode Dépressif',
        criteria: 'Humeur dépressive + perte d\'intérêt + symptômes associés ≥ 2 semaines',
        examinations: 'Échelles d\'évaluation (HAD, MADRS), Bilan thyroïdien',
        differential: 'Trouble bipolaire, Dépression réactionnelle, Hypothyroïdie',
        actif: true,
        ordreAffichage: 15
      },
      {
        type: 'diagnostics' as const,
        code: 'D50',
        name: 'Anémie Ferriprive',
        criteria: 'Anémie microcytaire hypochrome + ferritine basse',
        examinations: 'NFS, Ferritine, Transferrine, Bilan martial',
        differential: 'Anémie des maladies chroniques, Thalassémie, Anémie sidéroblastique',
        actif: true,
        ordreAffichage: 16
      },
      {
        type: 'diagnostics' as const,
        code: 'N18',
        name: 'Insuffisance Rénale Chronique',
        criteria: 'DFG < 60 ml/min/1.73m² pendant ≥ 3 mois',
        examinations: 'Créatininémie, DFG, Protéinurie, Échographie rénale',
        differential: 'Insuffisance rénale aiguë, Obstruction urinaire',
        actif: true,
        ordreAffichage: 17
      },
      {
        type: 'diagnostics' as const,
        code: 'K25',
        name: 'Ulcère Gastroduodénal',
        criteria: 'Douleur épigastrique + lésion à l\'endoscopie',
        examinations: 'Endoscopie digestive haute, Test Helicobacter pylori',
        differential: 'Gastrite, Reflux gastro-œsophagien, Cancer gastrique',
        actif: true,
        ordreAffichage: 18
      },
      {
        type: 'diagnostics' as const,
        code: 'K21',
        name: 'Reflux Gastro-Œsophagien',
        criteria: 'Pyrosis + régurgitations acides',
        examinations: 'Endoscopie digestive haute, pH-métrie œsophagienne',
        differential: 'Ulcère gastroduodénal, Œsophagite infectieuse, Cancer œsophagien',
        actif: true,
        ordreAffichage: 19
      },
      {
        type: 'diagnostics' as const,
        code: 'M79',
        name: 'Fibromyalgie',
        criteria: 'Douleurs diffuses + points douloureux + fatigue chronique',
        examinations: 'Bilan rhumatologique, Bilan thyroïdien',
        differential: 'Polyarthrite rhumatoïde, Hypothyroïdie, Dépression',
        actif: true,
        ordreAffichage: 20
      }
    ]

    // Procédures - Enrichi avec beaucoup plus de procédures
    const procedures = [
      {
        type: 'procedures' as const,
        title: 'Ponction Lombaire',
        category: 'Neurologie',
        indication: 'Suspicion de méningite, hémorragie sous-arachnoïdienne',
        contraindications: 'HTIC, troubles de la coagulation, infection locale',
        steps: [
          'Position du patient (décubitus latéral ou assis)',
          'Repérage L3-L4 ou L4-L5',
          'Anesthésie locale',
          'Ponction avec aiguille de Quincke',
          'Mesure de la pression d\'ouverture',
          'Prélèvement de 3-5 tubes',
          'Pansement compressif'
        ],
        complications: 'Céphalées post-ponction, hématome, infection',
        tags: ['Neurologie', 'Urgence', 'Diagnostic'],
        actif: true,
        ordreAffichage: 1
      },
      {
        type: 'procedures' as const,
        title: 'Sutures Cutanées',
        category: 'Chirurgie',
        indication: 'Plaies cutanées nécessitant une fermeture',
        contraindications: 'Infection active, morsure animale récente',
        steps: [
          'Nettoyage et désinfection de la plaie',
          'Anesthésie locale si nécessaire',
          'Choix du fil selon la localisation',
          'Points séparés ou surjet',
          'Pansement stérile',
          'Rendez-vous de contrôle à 7-10 jours'
        ],
        complications: 'Infection, déhiscence, cicatrice hypertrophique',
        tags: ['Chirurgie', 'Urgence', 'Soins'],
        actif: true,
        ordreAffichage: 2
      },
      {
        type: 'procedures' as const,
        title: 'Intubation Orotrachéale',
        category: 'Réanimation',
        indication: 'Détresse respiratoire, protection des voies aériennes',
        contraindications: 'Traumatisme facial sévère, obstruction laryngée',
        steps: [
          'Préoxygénation',
          'Positionnement de la tête (reniflage)',
          'Laryngoscopie directe',
          'Visualisation des cordes vocales',
          'Introduction de la sonde',
          'Vérification de la position (capnographie)',
          'Fixation et surveillance'
        ],
        complications: 'Lésions dentaires, intubation œsophagienne, spasme laryngé',
        tags: ['Réanimation', 'Urgence', 'Critique'],
        actif: true,
        ordreAffichage: 3
      },
      {
        type: 'procedures' as const,
        title: 'Cathétérisme Vésical',
        category: 'Urologie',
        indication: 'Rétention urinaire, mesure de la diurèse, prélèvement stérile',
        contraindications: 'Traumatisme urétral, infection urinaire active',
        steps: [
          'Asepsie rigoureuse',
          'Lubrification du cathéter',
          'Introduction douce dans l\'urètre',
          'Vérification de l\'écoulement urinaire',
          'Fixation du cathéter',
          'Surveillance des signes d\'infection'
        ],
        complications: 'Infection urinaire, lésion urétrale, hématurie',
        tags: ['Urologie', 'Soins', 'Urgence'],
        actif: true,
        ordreAffichage: 4
      },
      {
        type: 'procedures' as const,
        title: 'Ponction Veineuse Périphérique',
        category: 'Soins',
        indication: 'Administration de médicaments, perfusions, prélèvements',
        contraindications: 'Phlébite, lymphœdème, brûlure sur le site',
        steps: [
          'Choix du site (avant-bras, main)',
          'Garrot veineux',
          'Désinfection cutanée',
          'Ponction veineuse',
          'Retrait du garrot',
          'Fixation du cathéter',
          'Vérification du bon fonctionnement'
        ],
        complications: 'Phlébite, hématome, infection, extravasation',
        tags: ['Soins', 'Urgence', 'Technique'],
        actif: true,
        ordreAffichage: 5
      },
      {
        type: 'procedures' as const,
        title: 'Ponction Artérielle',
        category: 'Réanimation',
        indication: 'Gazométrie artérielle, surveillance tensionnelle invasive',
        contraindications: 'Troubles de la coagulation, infection locale, syndrome de Raynaud',
        steps: [
          'Test d\'Allen pour vérifier la collatéralité',
          'Repérage de l\'artère radiale',
          'Anesthésie locale',
          'Ponction artérielle',
          'Prélèvement ou mise en place du cathéter',
          'Compression prolongée après retrait'
        ],
        complications: 'Hématome, thrombose artérielle, ischémie distale',
        tags: ['Réanimation', 'Urgence', 'Diagnostic'],
        actif: true,
        ordreAffichage: 6
      },
      {
        type: 'procedures' as const,
        title: 'Réduction de Fracture',
        category: 'Traumatologie',
        indication: 'Fracture déplacée nécessitant une réduction',
        contraindications: 'Fracture ouverte, lésion vasculaire associée',
        steps: [
          'Anesthésie locale ou générale',
          'Traction et contre-traction',
          'Réduction de la fracture',
          'Vérification radiologique',
          'Immobilisation (plâtre, attelle)',
          'Contrôle radiologique post-réduction'
        ],
        complications: 'Échec de réduction, lésion nerveuse, syndrome des loges',
        tags: ['Traumatologie', 'Urgence', 'Chirurgie'],
        actif: true,
        ordreAffichage: 7
      },
      {
        type: 'procedures' as const,
        title: 'Aspiration Trachéale',
        category: 'Réanimation',
        indication: 'Encombrement bronchique, patient intubé',
        contraindications: 'Lésion trachéale, saignement actif',
        steps: [
          'Préoxygénation',
          'Introduction de la sonde d\'aspiration',
          'Aspiration lors du retrait',
          'Durée < 15 secondes',
          'Rinçage de la sonde',
          'Surveillance de la saturation'
        ],
        complications: 'Hypoxie, lésion muqueuse, bradycardie',
        tags: ['Réanimation', 'Soins', 'Urgence'],
        actif: true,
        ordreAffichage: 8
      },
      {
        type: 'procedures' as const,
        title: 'Pose de Sonde Nasogastrique',
        category: 'Gastro-entérologie',
        indication: 'Décompression gastrique, nutrition entérale, administration médicamenteuse',
        contraindications: 'Fracture de la base du crâne, obstruction nasale',
        steps: [
          'Mesure de la longueur nécessaire',
          'Lubrification de la sonde',
          'Introduction par voie nasale',
          'Vérification de la position (aspiration, auscultation)',
          'Fixation de la sonde',
          'Radiographie de contrôle si doute'
        ],
        complications: 'Fausse route, perforation œsophagienne, épistaxis',
        tags: ['Gastro-entérologie', 'Soins', 'Nutrition'],
        actif: true,
        ordreAffichage: 9
      },
      {
        type: 'procedures' as const,
        title: 'Ponction Pleurale',
        category: 'Pneumologie',
        indication: 'Épanchement pleural, diagnostic, drainage',
        contraindications: 'Troubles de la coagulation sévères, infection cutanée',
        steps: [
          'Repérage échographique ou radiologique',
          'Anesthésie locale',
          'Ponction avec aiguille ou trocart',
          'Aspiration du liquide',
          'Analyse du liquide pleural',
          'Pansement compressif'
        ],
        complications: 'Pneumothorax, hémothorax, infection, douleur',
        tags: ['Pneumologie', 'Urgence', 'Diagnostic'],
        actif: true,
        ordreAffichage: 10
      },
      {
        type: 'procedures' as const,
        title: 'Réanimation Cardio-Pulmonaire',
        category: 'Réanimation',
        indication: 'Arrêt cardiaque, arrêt respiratoire',
        contraindications: 'Aucune en situation d\'urgence vitale',
        steps: [
          'Vérification de la conscience et de la respiration',
          'Appel des secours',
          'Massage cardiaque externe (30 compressions)',
          'Ventilation (2 insufflations)',
          'Défibrillation si disponible',
          'Poursuite jusqu\'à l\'arrivée des secours'
        ],
        complications: 'Fractures costales, lésions viscérales',
        tags: ['Réanimation', 'Urgence', 'Critique'],
        actif: true,
        ordreAffichage: 11
      },
      {
        type: 'procedures' as const,
        title: 'Pose de Plâtre',
        category: 'Traumatologie',
        indication: 'Immobilisation de fracture, entorse sévère',
        contraindications: 'Fracture ouverte, syndrome des loges',
        steps: [
          'Protection cutanée (bande de coton)',
          'Application des bandes plâtrées',
          'Modelage du plâtre',
          'Surveillance de la circulation distale',
          'Conseils au patient',
          'Rendez-vous de contrôle'
        ],
        complications: 'Compression, escarres, allergie au plâtre',
        tags: ['Traumatologie', 'Chirurgie', 'Soins'],
        actif: true,
        ordreAffichage: 12
      },
      {
        type: 'procedures' as const,
        title: 'Biopsie Cutanée',
        category: 'Dermatologie',
        indication: 'Lésion cutanée suspecte, diagnostic histologique',
        contraindications: 'Infection locale, troubles de la coagulation',
        steps: [
          'Anesthésie locale',
          'Prélèvement de la lésion',
          'Hémostase',
          'Suture si nécessaire',
          'Envoi en anatomopathologie',
          'Pansement'
        ],
        complications: 'Hémorragie, infection, cicatrice',
        tags: ['Dermatologie', 'Diagnostic', 'Chirurgie'],
        actif: true,
        ordreAffichage: 13
      },
      {
        type: 'procedures' as const,
        title: 'Lavage Gastrique',
        category: 'Toxicologie',
        indication: 'Intoxication médicamenteuse récente (< 1h)',
        contraindications: 'Produits caustiques, troubles de la conscience sans intubation',
        steps: [
          'Intubation si troubles de la conscience',
          'Introduction de la sonde gastrique',
          'Lavage avec sérum physiologique',
          'Récupération du liquide de lavage',
          'Administration de charbon activé',
          'Surveillance'
        ],
        complications: 'Fausse route, perforation, aspiration',
        tags: ['Toxicologie', 'Urgence', 'Soins'],
        actif: true,
        ordreAffichage: 14
      },
      {
        type: 'procedures' as const,
        title: 'Incision et Drainage d\'Abcès',
        category: 'Chirurgie',
        indication: 'Abcès collecté, nécessité de drainage',
        contraindications: 'Cellulite non collectée, troubles de la coagulation',
        steps: [
          'Anesthésie locale',
          'Incision de l\'abcès',
          'Évacuation du pus',
          'Curetage de la cavité',
          'Mise en place d\'une mèche si nécessaire',
          'Pansement',
          'Antibiothérapie si indiquée'
        ],
        complications: 'Récurrence, cicatrice, infection',
        tags: ['Chirurgie', 'Urgence', 'Soins'],
        actif: true,
        ordreAffichage: 15
      }
    ]

    // Directives - Enrichi avec beaucoup plus de directives
    const guidelines = [
      {
        type: 'guidelines' as const,
        title: 'Directive Antalgie Post-Opératoire',
        category: 'Anesthésie',
        lastUpdated: '2025-09-15',
        description: 'Recommandations pour la gestion de la douleur post-opératoire selon l\'échelle EVA.',
        content: {
          evaluation: 'Évaluation systématique avec EVA toutes les 4h',
          palier1: 'Paracétamol 1g x4/jour + AINS si pas de contre-indication',
          palier2: 'Ajout de tramadol ou codéine si EVA > 4',
          palier3: 'Morphine IV en PCA si EVA > 6',
          surveillance: 'Surveillance des effets secondaires (nausées, sédation)'
        },
        tags: ['Anesthésie', 'Douleur', 'Post-opératoire'],
        urgency: 'priority' as const,
        actif: true,
        ordreAffichage: 1
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Antibiothérapie Probabiliste',
        category: 'Infectiologie',
        lastUpdated: '2025-10-20',
        description: 'Guide pour le choix de l\'antibiothérapie probabiliste selon le site d\'infection.',
        content: {
          pneumonie: 'Amoxicilline-acide clavulanique ou ceftriaxone',
          urinaire: 'Ciprofloxacine ou ceftriaxone selon gravité',
          cutanee: 'Amoxicilline-acide clavulanique ou clindamycine',
          intraabdominale: 'Ceftriaxone + métronidazole',
          duree: 'Réévaluation à 48-72h avec adaptation selon antibiogramme'
        },
        tags: ['Infectiologie', 'Antibiotiques', 'Urgence'],
        urgency: 'urgent' as const,
        actif: true,
        ordreAffichage: 2
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Prévention Thromboembolique',
        category: 'Médecine Interne',
        lastUpdated: '2025-08-10',
        description: 'Stratégie de prévention des événements thromboemboliques veineux.',
        content: {
          evaluation: 'Score de Padua ou Caprini selon contexte',
          prevention: 'HBPM ou héparine non fractionnée selon risque',
          duree: 'Durée adaptée au type de chirurgie et facteurs de risque',
          surveillance: 'Surveillance plaquettes si HBPM prolongée'
        },
        tags: ['Médecine Interne', 'Prévention', 'Thrombose'],
        urgency: 'standard' as const,
        actif: true,
        ordreAffichage: 3
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Gestion de l\'Hypertension Artérielle',
        category: 'Cardiologie',
        lastUpdated: '2025-10-25',
        description: 'Recommandations pour le diagnostic et le traitement de l\'hypertension artérielle.',
        content: {
          diagnostic: 'PAS ≥140 mmHg et/ou PAD ≥90 mmHg à plusieurs reprises',
          evaluation: 'Bilan rénal, cardiaque, ophtalmologique',
          traitement: 'Mesures hygiéno-diététiques puis traitement médicamenteux si nécessaire',
          objectifs: 'PAS < 140 mmHg et PAD < 90 mmHg (ou < 130/80 si diabète)',
          suivi: 'Contrôle tensionnel régulier, adaptation du traitement'
        },
        tags: ['Cardiologie', 'HTA', 'Traitement'],
        urgency: 'priority' as const,
        actif: true,
        ordreAffichage: 4
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Prise en Charge du Diabète Type 2',
        category: 'Endocrinologie',
        lastUpdated: '2025-10-28',
        description: 'Recommandations pour le suivi et le traitement du diabète de type 2.',
        content: {
          diagnostic: 'Glycémie à jeun ≥1.26 g/L ou HbA1c ≥6.5%',
          objectifs: 'HbA1c < 7%, PAS < 140 mmHg, LDL < 1 g/L',
          traitement: 'Mesures hygiéno-diététiques, metformine en première intention',
          suivi: 'HbA1c tous les 3-6 mois, fond d\'œil annuel, microalbuminurie annuelle',
          complications: 'Surveillance rétinopathie, néphropathie, neuropathie'
        },
        tags: ['Endocrinologie', 'Diabète', 'Traitement'],
        urgency: 'priority' as const,
        actif: true,
        ordreAffichage: 5
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Prise en Charge de l\'Asthme',
        category: 'Pneumologie',
        lastUpdated: '2025-10-15',
        description: 'Recommandations GINA pour la prise en charge de l\'asthme.',
        content: {
          diagnostic: 'Symptômes + obstruction bronchique réversible',
          traitement: 'Traitement de fond selon sévérité, traitement de crise',
          objectifs: 'Contrôle de l\'asthme, prévention des exacerbations',
          education: 'Éducation du patient, technique d\'inhalation, plan d\'action',
          suivi: 'Réévaluation régulière, adaptation du traitement'
        },
        tags: ['Pneumologie', 'Asthme', 'Traitement'],
        urgency: 'standard' as const,
        actif: true,
        ordreAffichage: 6
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Prise en Charge de l\'Insuffisance Cardiaque',
        category: 'Cardiologie',
        lastUpdated: '2025-11-01',
        description: 'Recommandations ESC pour la prise en charge de l\'insuffisance cardiaque.',
        content: {
          diagnostic: 'BNP/NT-proBNP élevé + signes cliniques + échocardiographie',
          traitement: 'IEC/ARA2, bêta-bloquants, diurétiques, antialdostérones',
          objectifs: 'Amélioration des symptômes, réduction des hospitalisations',
          education: 'Éducation thérapeutique, autosurveillance, observance',
          suivi: 'Suivi régulier, adaptation du traitement, réhabilitation cardiaque'
        },
        tags: ['Cardiologie', 'Insuffisance cardiaque', 'Traitement'],
        urgency: 'priority' as const,
        actif: true,
        ordreAffichage: 7
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Prévention Cardiovasculaire',
        category: 'Cardiologie',
        lastUpdated: '2025-09-20',
        description: 'Stratégies de prévention primaire et secondaire des événements cardiovasculaires.',
        content: {
          evaluation: 'Score de risque cardiovasculaire (SCORE2)',
          prevention: 'Arrêt du tabac, activité physique, alimentation équilibrée',
          traitement: 'Statines si LDL élevé, antiagrégants si indiqué',
          objectifs: 'LDL selon risque, PAS < 140 mmHg, HbA1c < 7% si diabète',
          suivi: 'Évaluation annuelle du risque cardiovasculaire'
        },
        tags: ['Cardiologie', 'Prévention', 'Risque cardiovasculaire'],
        urgency: 'standard' as const,
        actif: true,
        ordreAffichage: 8
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Prise en Charge de l\'AVC',
        category: 'Neurologie',
        lastUpdated: '2025-10-20',
        description: 'Recommandations pour la prise en charge aiguë et la prévention secondaire de l\'AVC.',
        content: {
          aigu: 'Thrombolyse si < 4h30, thrombectomie si < 6h',
          diagnostic: 'Scanner cérébral, IRM, Doppler des troncs supra-aortiques',
          prevention: 'Antiagrégants, statines, contrôle tensionnel',
          reeducation: 'Rééducation précoce, orthophonie, kinésithérapie',
          suivi: 'Suivi neurologique, prévention secondaire'
        },
        tags: ['Neurologie', 'AVC', 'Urgence'],
        urgency: 'urgent' as const,
        actif: true,
        ordreAffichage: 9
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Prise en Charge de l\'Épilepsie',
        category: 'Neurologie',
        lastUpdated: '2025-09-30',
        description: 'Recommandations pour le diagnostic et le traitement de l\'épilepsie.',
        content: {
          diagnostic: 'Crises épileptiques récurrentes, EEG, IRM cérébrale',
          traitement: 'Traitement antiépileptique selon type de crise',
          objectifs: 'Contrôle des crises, amélioration de la qualité de vie',
          education: 'Éducation du patient et de l\'entourage, conduite',
          suivi: 'Suivi neurologique régulier, adaptation du traitement'
        },
        tags: ['Neurologie', 'Épilepsie', 'Traitement'],
        urgency: 'priority' as const,
        actif: true,
        ordreAffichage: 10
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Prise en Charge de la Dépression',
        category: 'Psychiatrie',
        lastUpdated: '2025-10-18',
        description: 'Recommandations pour le diagnostic et le traitement de la dépression.',
        content: {
          diagnostic: 'Échelles d\'évaluation (HAD, MADRS), critères DSM-5',
          traitement: 'Antidépresseurs, psychothérapie, association si nécessaire',
          objectifs: 'Rémission des symptômes, prévention des rechutes',
          education: 'Éducation du patient, observance du traitement',
          suivi: 'Suivi régulier, adaptation du traitement, prévention du suicide'
        },
        tags: ['Psychiatrie', 'Dépression', 'Traitement'],
        urgency: 'priority' as const,
        actif: true,
        ordreAffichage: 11
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Prise en Charge de l\'Anémie Ferriprive',
        category: 'Hématologie',
        lastUpdated: '2025-10-05',
        description: 'Recommandations pour le diagnostic et le traitement de l\'anémie ferriprive.',
        content: {
          diagnostic: 'Anémie microcytaire hypochrome + ferritine basse',
          traitement: 'Supplémentation en fer, recherche étiologique',
          objectifs: 'Correction de l\'anémie, normalisation du bilan martial',
          education: 'Alimentation riche en fer, observance du traitement',
          suivi: 'Contrôle NFS et ferritine après 3 mois de traitement'
        },
        tags: ['Hématologie', 'Anémie', 'Traitement'],
        urgency: 'standard' as const,
        actif: true,
        ordreAffichage: 12
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Prise en Charge de l\'Insuffisance Rénale Chronique',
        category: 'Néphrologie',
        lastUpdated: '2025-09-25',
        description: 'Recommandations KDIGO pour la prise en charge de l\'insuffisance rénale chronique.',
        content: {
          diagnostic: 'DFG < 60 ml/min/1.73m² pendant ≥ 3 mois',
          traitement: 'Ralentissement de la progression, préparation dialyse si nécessaire',
          objectifs: 'Préserver la fonction rénale, prévenir les complications',
          education: 'Éducation thérapeutique, régime adapté',
          suivi: 'Suivi néphrologique régulier, adaptation du traitement'
        },
        tags: ['Néphrologie', 'Insuffisance rénale', 'Traitement'],
        urgency: 'priority' as const,
        actif: true,
        ordreAffichage: 13
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Prise en Charge de l\'Infection Urinaire',
        category: 'Urologie',
        lastUpdated: '2025-10-22',
        description: 'Recommandations pour le diagnostic et le traitement des infections urinaires.',
        content: {
          diagnostic: 'Leucocyturie + bactériurie significative',
          traitement: 'Antibiothérapie adaptée selon germe et localisation',
          objectifs: 'Éradication de l\'infection, prévention des récidives',
          education: 'Mesures d\'hygiène, hydratation',
          suivi: 'Contrôle ECBU après traitement si pyélonéphrite'
        },
        tags: ['Urologie', 'Infection urinaire', 'Traitement'],
        urgency: 'standard' as const,
        actif: true,
        ordreAffichage: 14
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Prise en Charge de la Pneumonie Communautaire',
        category: 'Pneumologie',
        lastUpdated: '2025-10-25',
        description: 'Recommandations pour le diagnostic et le traitement de la pneumonie acquise en communauté.',
        content: {
          diagnostic: 'Fièvre + toux + signes auscultatoires + opacité radiologique',
          evaluation: 'Score de CURB-65 pour évaluer la gravité',
          traitement: 'Antibiothérapie probabiliste selon gravité',
          objectifs: 'Guérison, prévention des complications',
          suivi: 'Réévaluation à 48-72h, adaptation selon antibiogramme'
        },
        tags: ['Pneumologie', 'Pneumonie', 'Infectiologie'],
        urgency: 'urgent' as const,
        actif: true,
        ordreAffichage: 15
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Prise en Charge de l\'Hyperthyroïdie',
        category: 'Endocrinologie',
        lastUpdated: '2025-10-10',
        description: 'Recommandations pour le diagnostic et le traitement de l\'hyperthyroïdie.',
        content: {
          diagnostic: 'TSH basse + T4 libre élevée, Ac anti-récepteur TSH',
          traitement: 'Antithyroïdiens de synthèse, iode radioactif, chirurgie',
          objectifs: 'Normalisation de la fonction thyroïdienne',
          education: 'Éducation du patient, surveillance des effets secondaires',
          suivi: 'Suivi endocrinologique régulier, adaptation du traitement'
        },
        tags: ['Endocrinologie', 'Hyperthyroïdie', 'Traitement'],
        urgency: 'priority' as const,
        actif: true,
        ordreAffichage: 16
      },
      {
        type: 'guidelines' as const,
        title: 'Directive Prise en Charge de l\'Hypothyroïdie',
        category: 'Endocrinologie',
        lastUpdated: '2025-10-12',
        description: 'Recommandations pour le diagnostic et le traitement de l\'hypothyroïdie.',
        content: {
          diagnostic: 'TSH élevée + T4 libre basse',
          traitement: 'Substitution par L-thyroxine, dose adaptée',
          objectifs: 'Normalisation de la TSH, amélioration des symptômes',
          education: 'Prise à jeun, interactions médicamenteuses',
          suivi: 'Contrôle TSH après 6-8 semaines, adaptation de la dose'
        },
        tags: ['Endocrinologie', 'Hypothyroïdie', 'Traitement'],
        urgency: 'standard' as const,
        actif: true,
        ordreAffichage: 17
      }
    ]

    // Insérer toutes les données
    const allData = [...protocols, ...medications, ...diagnostics, ...procedures, ...guidelines]

    for (const data of allData) {
      // Convertir lastUpdated en DateTime si c'est une string
      const dataToCreate: any = { ...data }
      if ('lastUpdated' in dataToCreate && dataToCreate.lastUpdated && typeof dataToCreate.lastUpdated === 'string') {
        dataToCreate.lastUpdated = DateTime.fromISO(dataToCreate.lastUpdated)
      }

      // Vérifier si l'entrée existe déjà (par type + title/name + code)
      const query = KnowledgeBase.query().where('type', data.type)
      
      if ('title' in data && data.title) {
        query.where('title', data.title)
      } else if ('name' in data && data.name) {
        query.where('name', data.name)
      }
      if ('code' in data && data.code) {
        query.where('code', data.code)
      }
      
      const existing = await query.first()

      if (!existing) {
        await KnowledgeBase.create(dataToCreate)
      }
    }
  }
}

