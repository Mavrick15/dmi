import '#start/validator'
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import transmit from '@adonisjs/transmit/services/main'

// --- IMPORTS DES CONTRÔLEURS ---
const AuthController = () => import('#controllers/auth_controller')
const DashboardController = () => import('#controllers/dashboard_controller')
const PatientsController = () => import('#controllers/patients_controller')
const PharmacyController = () => import('#controllers/pharmacy_controller')
const FinanceController = () => import('#controllers/finance_controller')
const SuppliersController = () => import('#controllers/suppliers_controller')
const UsersController = () => import('#controllers/users_controller')
const RendezVousController = () => import('#controllers/rendez_vous_controller')
const EtablissementsController = () => import('#controllers/etablissements_controller')
const DepartmentsController = () => import('#controllers/departments_controller')
const DocumentsController = () => import('#controllers/documents_controller')
const ConsultationController = () => import('#controllers/consultation_controller')
const AuditLogsController = () => import('#controllers/audit_logs_controller')
const PermissionsController = () => import('#controllers/permissions_controller')
const AdminStatsController = () => import('#controllers/admin_stats_controller')
const OmnisearchController = () => import('#controllers/omnisearch_controller')
const StatsController = () => import('#controllers/stats_controller')
const ExportController = () => import('#controllers/export_controller')
const WebhookController = () => import('#controllers/webhook_controller')
const NotificationsController = () => import('#controllers/notifications_controller')
const ClinicalTemplatesController = () => import('#controllers/clinical_templates_controller')
const QuickNotesController = () => import('#controllers/quick_notes_controller')
const Cim10Controller = () => import('#controllers/cim10_controller')
const KnowledgeBasesController = () => import('#controllers/knowledge_bases_controller')
const PaymentMethodsController = () => import('#controllers/payment_methods_controller')
const CommonSymptomsController = () => import('#controllers/common_symptoms_controller')
const CommonExamsController = () => import('#controllers/common_exams_controller')
const AnalysesController = () => import('#controllers/analyses_controller')
const ResultatsAnalyseController = () => import('#controllers/resultats_analyse_controller')
const UploadsController = () => import('#controllers/uploads_controller')

// --- ACTIVATION DU TEMPS RÉEL (SSE) ---
transmit.registerRoutes()

// --- API V1 ---
router
  .group(() => {
    router
      .group(() => {
        router.get('/avatars/:file', [UploadsController, 'serve'])
        router.get('/documents/:file', [UploadsController, 'serve'])
        router.get('/:folder/:file', [UploadsController, 'serve'])
      })
      .prefix('uploads')
      .use(middleware.rateLimit({ maxRequests: 200, windowMs: 60 * 1000 })) // 200 req/min (images fréquemment chargées)

    // --- AUTHENTIFICATION (Public) ---
    router
      .group(() => {
        router
          .post('/register', [AuthController, 'register'])
          .use(middleware.rateLimit({ maxRequests: 5, windowMs: 15 * 60 * 1000 })) // 5 tentatives / 15 min
        router
          .post('/login', [AuthController, 'login'])
          .use(middleware.rateLimit({ maxRequests: 10, windowMs: 15 * 60 * 1000 })) // 10 tentatives / 15 min
        router
          .post('/refresh', [AuthController, 'refresh'])
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 tentatives / minute
        router
          .post('/forgot-password', [AuthController, 'forgotPassword'])
          .use(middleware.rateLimit({ maxRequests: 3, windowMs: 60 * 60 * 1000 })) // 3 tentatives / heure
        router
          .post('/reset-password', [AuthController, 'resetPassword'])
          .use(middleware.rateLimit({ maxRequests: 5, windowMs: 60 * 60 * 1000 })) // 5 tentatives / heure
      })
      .prefix('auth')

    // --- ROUTES PROTÉGÉES ---
    router
      .group(() => {
        // Auth & Profil
        router.post('/auth/logout', [AuthController, 'logout'])
        router.get('/auth/me', [AuthController, 'me'])
        router
          .patch('/auth/profile', [AuthController, 'updateProfile'])
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 }))
        router
          .post('/auth/change-password', [AuthController, 'changePassword'])
          .use(middleware.rateLimit({ maxRequests: 5, windowMs: 15 * 60 * 1000 })) // 5 / 15 min

        // Gestion de sécurité (Admin uniquement)
        router
          .post('/auth/unlock/:userId', [AuthController, 'unlockAccount'])
          .use(middleware.permission(['user_manage']))
        router
          .get('/auth/security-status/:email', [AuthController, 'getSecurityStatus'])
          .use(middleware.permission(['user_manage']))

        // Dashboard : vue d'ensemble pour admin/gestionnaires, métriques pour console clinique (médecins)
        router
          .get('/dashboard', [DashboardController, 'index'])
          .use(middleware.permission(['dashboard_view', 'clinical_view']))
          .use(middleware.rateLimit({ maxRequests: 60, windowMs: 60 * 1000 })) // 60 req/min

        // Recherche Globale (accessible à tous les utilisateurs authentifiés)
        router
          .get('/search/global', [OmnisearchController, 'globalSearch'])
          .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min (recherche fréquente)
        router
          .get('/search/autocomplete', [OmnisearchController, 'autocomplete'])
          .use(middleware.rateLimit({ maxRequests: 150, windowMs: 60 * 1000 })) // 150 req/min (autocomplete très fréquent)

        // --- PATIENTS ---
        router
          .get('/patients', [PatientsController, 'index'])
          .use(middleware.permission(['patient_view']))
          .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
        router
          .get('/patients/stats', [PatientsController, 'stats'])
          .use(middleware.permission(['patient_view']))
          .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
        router
          .get('/patients/:id', [PatientsController, 'show'])
          .use(middleware.permission(['patient_view']))
          .use(middleware.rateLimit({ maxRequests: 150, windowMs: 60 * 1000 })) // 150 req/min (consultation fréquente)

        router
          .post('/patients', [PatientsController, 'store'])
          .use(middleware.permission(['patient_create']))
          .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
        router
          .put('/patients/:id', [PatientsController, 'update'])
          .use(middleware.permission(['patient_edit']))
          .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min
        router
          .delete('/patients/:id', [PatientsController, 'destroy'])
          .use(middleware.permission(['patient_delete']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

        // --- DOCUMENTS ---
        router
          .get('/documents', [DocumentsController, 'indexAll'])
          .use(middleware.permission(['document_view']))
          .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
        router
          .get('/documents/stats', [DocumentsController, 'stats'])
          .use(middleware.permission(['document_view']))
          .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
        router
          .get('/documents/search', [DocumentsController, 'searchFullText'])
          .use(middleware.permission(['document_view']))
          .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
        router
          .get('/patients/:patientId/documents', [DocumentsController, 'index'])
          .use(middleware.permission(['document_view']))
          .use(middleware.rateLimit({ maxRequests: 150, windowMs: 60 * 1000 })) // 150 req/min
        router
          .post('/documents', [DocumentsController, 'store'])
          .use(middleware.permission(['document_upload']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
        router
          .get('/documents/:id/preview', [DocumentsController, 'preview'])
          .use(middleware.permission(['document_view']))
          .use(middleware.rateLimit({ maxRequests: 150, windowMs: 60 * 1000 })) // 150 req/min
        router
          .get('/documents/:id/download', [DocumentsController, 'download'])
          .use(middleware.permission(['document_view']))
          .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
        router
          .post('/documents/:id/sign', [DocumentsController, 'sign'])
          .use(middleware.permission(['document_sign']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
        router
          .delete('/documents/:id', [DocumentsController, 'destroy'])
          .use(middleware.permission(['document_delete']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

        // Nouvelles routes Phase 1-3
        router
          .get('/documents/:id/versions', [DocumentsController, 'getVersions'])
          .use(middleware.permission(['document_view']))
          .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
        router
          .post('/documents/:id/versions/restore', [DocumentsController, 'restoreVersion'])
          .use(middleware.permission(['document_upload']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
        router
          .patch('/documents/:id/tags', [DocumentsController, 'updateTags'])
          .use(middleware.permission(['document_upload']))
          .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
        router
          .post('/documents/:id/share', [DocumentsController, 'share'])
          .use(middleware.permission(['document_view']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
        router
          .post('/documents/:id/revoke-access', [DocumentsController, 'revokeAccess'])
          .use(middleware.permission(['document_view']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
        router
          .post('/documents/:id/comments', [DocumentsController, 'addComment'])
          .use(middleware.permission(['document_view']))
          .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min
        router
          .get('/documents/:id/comments', [DocumentsController, 'getComments'])
          .use(middleware.permission(['document_view']))
          .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
        router
          .post('/documents/:id/approvals', [DocumentsController, 'createApprovalWorkflow'])
          .use(middleware.permission(['document_upload']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
        router
          .post('/documents/:id/approvals/process', [DocumentsController, 'processApproval'])
          .use(middleware.permission(['document_upload']))
          .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
        router
          .post('/documents/:id/archive', [DocumentsController, 'toggleArchive'])
          .use(middleware.permission(['document_delete']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
        router
          .post('/documents/:id/watermark', [DocumentsController, 'addWatermark'])
          .use(middleware.permission(['document_upload']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
        router
          .post('/documents/export', [DocumentsController, 'exportBulk'])
          .use(middleware.permission(['document_view']))
          .use(middleware.rateLimit({ maxRequests: 10, windowMs: 60 * 1000 })) // 10 req/min (export lourd)
        router
          .post('/documents/:id/view', [DocumentsController, 'trackView'])
          .use(middleware.permission(['document_view']))
          .use(middleware.rateLimit({ maxRequests: 200, windowMs: 60 * 1000 })) // 200 req/min (tracking fréquent)

        // --- RENDEZ-VOUS ---
        router
          .get('/appointments', [RendezVousController, 'index'])
          .use(middleware.permission(['appointment_view']))
          .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
        router
          .get('/appointments/:id', [RendezVousController, 'show'])
          .use(middleware.permission(['appointment_view']))
          .use(middleware.rateLimit({ maxRequests: 150, windowMs: 60 * 1000 })) // 150 req/min
        router
          .post('/appointments', [RendezVousController, 'store'])
          .use(middleware.permission(['appointment_create']))
          .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
        router
          .patch('/appointments/:id/status', [RendezVousController, 'updateStatus'])
          .use(middleware.permission(['appointment_edit']))
          .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min
        router
          .patch('/appointments/:id', [RendezVousController, 'update'])
          .use(middleware.permission(['appointment_edit']))
          .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min
        router
          .delete('/appointments/:id', [RendezVousController, 'destroy'])
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
          .use(middleware.permission(['appointment_delete']))
        router
          .get('/doctors', [RendezVousController, 'medecins'])
          .use(middleware.permission(['appointment_view']))

        // --- CONSULTATIONS ---
        router
          .group(() => {
            // Voir les consultations - nécessite clinical_view
            router
              .get('/', [ConsultationController, 'index'])
              .use(middleware.permission(['clinical_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min

            // Créer des consultations - nécessite consultation_create
            router
              .post('/', [ConsultationController, 'store'])
              .use(middleware.permission(['consultation_create']))
              .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min

            // Modifier des consultations - nécessite consultation_edit
            router
              .put('/:id', [ConsultationController, 'update'])
              .use(middleware.permission(['consultation_edit']))
              .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
          })
          .prefix('consultations')

        // --- ANALYSES MÉDICALES ---
        router
          .group(() => {
            // Statistiques des analyses - DOIT être AVANT /:id (route spécifique avant route générale)
            router
              .get('/stats', [AnalysesController, 'stats'])
              .use(middleware.permission(['analyses_view']))
              .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min

            // Lister les analyses - nécessite analyses_view
            router
              .get('/', [AnalysesController, 'index'])
              .use(middleware.permission(['analyses_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min

            // Créer une analyse - nécessite analyses_create
            router
              .post('/', [AnalysesController, 'store'])
              .use(middleware.permission(['analyses_create']))
              .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min

            // Voir une analyse - nécessite analyses_view (DOIT être APRÈS /stats)
            router
              .get('/:id', [AnalysesController, 'show'])
              .use(middleware.permission(['analyses_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min

            // Modifier une analyse - nécessite analyses_edit
            router
              .put('/:id', [AnalysesController, 'update'])
              .use(middleware.permission(['analyses_edit']))
              .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min

            // Annuler une analyse - nécessite analyses_cancel
            router
              .patch('/:id/cancel', [AnalysesController, 'cancel'])
              .use(middleware.permission(['analyses_cancel']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

            // Supprimer une analyse - nécessite analyses_delete
            router
              .delete('/:id', [AnalysesController, 'destroy'])
              .use(middleware.permission(['analyses_delete']))
              .use(middleware.rateLimit({ maxRequests: 10, windowMs: 60 * 1000 })) // 10 req/min

            // Résultats d'une analyse
            router
              .group(() => {
                // Lister les résultats d'une analyse
                router
                  .get('/', [ResultatsAnalyseController, 'index'])
                  .use(middleware.permission(['resultats_view']))
                  .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 }))

                // Créer des résultats pour une analyse
                router
                  .post('/', [ResultatsAnalyseController, 'store'])
                  .use(middleware.permission(['resultats_create']))
                  .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 }))
              })
              .prefix('/:analyseId/resultats')
          })
          .prefix('analyses')

        // --- RÉSULTATS D'ANALYSES (routes globales) ---
        router
          .group(() => {
            // Modifier un résultat
            router
              .put('/:id', [ResultatsAnalyseController, 'update'])
              .use(middleware.permission(['resultats_edit']))
              .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 }))

            // Valider un résultat
            router
              .patch('/:id/validate', [ResultatsAnalyseController, 'validate'])
              .use(middleware.permission(['resultats_validate']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 }))
          })
          .prefix('analyses/resultats')

        // --- CLINICAL TOOLS ---
        router
          .group(() => {
            // Templates de consultation
            router
              .get('/templates', [ClinicalTemplatesController, 'index'])
              .use(middleware.permission(['clinical_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .post('/templates', [ClinicalTemplatesController, 'store'])
              .use(middleware.permission(['clinical_write']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
            router
              .put('/templates/:id', [ClinicalTemplatesController, 'update'])
              .use(middleware.permission(['clinical_write']))
              .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
            router
              .delete('/templates/:id', [ClinicalTemplatesController, 'destroy'])
              .use(middleware.permission(['clinical_write']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

            // Notes rapides
            router
              .get('/quick-notes', [QuickNotesController, 'index'])
              .use(middleware.permission(['clinical_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .post('/quick-notes', [QuickNotesController, 'store'])
              .use(middleware.permission(['clinical_write']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
            router
              .post('/quick-notes/:id/use', [QuickNotesController, 'use'])
              .use(middleware.permission(['clinical_view']))
              .use(middleware.rateLimit({ maxRequests: 200, windowMs: 60 * 1000 })) // 200 req/min (utilisation fréquente)
            router
              .put('/quick-notes/:id', [QuickNotesController, 'update'])
              .use(middleware.permission(['clinical_write']))
              .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
            router
              .delete('/quick-notes/:id', [QuickNotesController, 'destroy'])
              .use(middleware.permission(['clinical_write']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

            // Codes CIM-10
            router
              .get('/cim10', [Cim10Controller, 'search'])
              .use(middleware.permission(['clinical_view']))
              .use(middleware.rateLimit({ maxRequests: 150, windowMs: 60 * 1000 })) // 150 req/min (recherche fréquente)
            router
              .get('/cim10/categories', [Cim10Controller, 'categories'])
              .use(middleware.permission(['clinical_view']))
              .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min
            router
              .get('/cim10/:id', [Cim10Controller, 'show'])
              .use(middleware.permission(['clinical_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .post('/cim10/:id/use', [Cim10Controller, 'use'])
              .use(middleware.permission(['clinical_view']))
              .use(middleware.rateLimit({ maxRequests: 200, windowMs: 60 * 1000 })) // 200 req/min (utilisation fréquente)

            // Base de connaissances clinique
            router
              .get('/knowledge', [KnowledgeBasesController, 'index'])
              .use(middleware.permission(['clinical_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .get('/knowledge/:id', [KnowledgeBasesController, 'show'])
              .use(middleware.permission(['clinical_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .post('/knowledge', [KnowledgeBasesController, 'store'])
              .use(middleware.permission(['settings_manage']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
            router
              .put('/knowledge/:id', [KnowledgeBasesController, 'update'])
              .use(middleware.permission(['settings_manage']))
              .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
            router
              .delete('/knowledge/:id', [KnowledgeBasesController, 'destroy'])
              .use(middleware.permission(['settings_manage']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

            // Symptômes communs
            router
              .get('/symptoms', [CommonSymptomsController, 'index'])
              .use(middleware.permission(['clinical_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .post('/symptoms/:id/use', [CommonSymptomsController, 'incrementUsage'])
              .use(middleware.permission(['clinical_view']))
              .use(middleware.rateLimit({ maxRequests: 200, windowMs: 60 * 1000 })) // 200 req/min

            // Examens communs
            router
              .get('/exams', [CommonExamsController, 'index'])
              .use(middleware.permission(['clinical_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .post('/exams/:id/use', [CommonExamsController, 'incrementUsage'])
              .use(middleware.permission(['clinical_view']))
              .use(middleware.rateLimit({ maxRequests: 200, windowMs: 60 * 1000 })) // 200 req/min
          })
          .prefix('clinical')

        // --- PHARMACIE (Routes reorganisées) ---
        router
          .group(() => {
            // 1. Lecture (Accessible au staff médical pour vérifier les stocks)
            router
              .get('/stats', [PharmacyController, 'stats'])
              .use(middleware.permission(['inventory_view']))
              .use(middleware.rateLimit({ maxRequests: 60, windowMs: 60 * 1000 })) // 60 req/min
            router
              .get('/inventory', [PharmacyController, 'inventory'])
              .use(middleware.permission(['inventory_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .get('/medications/:id/details', [PharmacyController, 'details'])
              .use(middleware.permission(['inventory_view', 'consultation_create']))
              .use(middleware.rateLimit({ maxRequests: 150, windowMs: 60 * 1000 })) // 150 req/min
            router
              .get('/alerts', [PharmacyController, 'alerts'])
              .use(middleware.permission(['inventory_view']))
              .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min
            router
              .get('/search', [PharmacyController, 'search'])
              .use(middleware.permission(['inventory_view', 'consultation_create']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .get('/analytics', [PharmacyController, 'predictiveAnalysis'])
              .use(middleware.permission(['inventory_view']))
              .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
            router
              .get('/orders/pending', [PharmacyController, 'pendingOrders'])
              .use(middleware.permission(['inventory_view']))
              .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min
            router
              .get('/orders/recent', [PharmacyController, 'recentOrders'])
              .use(middleware.permission(['inventory_view']))
              .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min
            router
              .get('/orders/:id', [PharmacyController, 'showOrder'])
              .use(middleware.permission(['inventory_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min

            // Prescriptions
            router
              .get('/prescriptions/pending', [PharmacyController, 'pendingPrescriptions'])
              .use(middleware.permission(['inventory_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min

            // 2. Écriture / Gestion Stocks
            router.group(() => {
              // Médicaments CRUD
              router
                .post('/medications', [PharmacyController, 'store'])
                .use(middleware.permission(['medication_create']))
                .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
              router
                .put('/medications/:id', [PharmacyController, 'update'])
                .use(middleware.permission(['medication_edit']))
                .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
              router
                .delete('/medications/:id', [PharmacyController, 'destroy'])
                .use(middleware.permission(['medication_delete']))
                .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

              // Commandes & Mouvements (Routes ajoutées)
              router
                .post('/orders', [PharmacyController, 'createOrder'])
                .use(middleware.permission(['order_create']))
                .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
              router
                .post('/orders/:id/receive', [PharmacyController, 'receiveOrder'])
                .use(middleware.permission(['order_receive']))
                .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
              router
                .post('/inventory/adjust', [PharmacyController, 'adjustStock'])
                .use(middleware.permission(['inventory_manage']))
                .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min

              router
                .patch('/prescriptions/:id/deliver', [
                  PharmacyController,
                  'markPrescriptionDelivered',
                ])
                .use(middleware.permission(['inventory_manage']))
                .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min
              router
                .patch('/prescriptions/:id', [PharmacyController, 'updatePrescription'])
                .use(middleware.permission(['inventory_manage']))
                .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min
              router
                .patch('/prescriptions/:id/cancel', [PharmacyController, 'cancelPrescription'])
                .use(middleware.permission(['inventory_manage']))
                .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min
            })
          })
          .prefix('pharmacy')

        // --- FOURNISSEURS ---
        router
          .group(() => {
            router
              .get('/', [SuppliersController, 'index'])
              .use(middleware.permission(['inventory_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .get('/:id', [SuppliersController, 'show'])
              .use(middleware.permission(['inventory_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .post('/', [SuppliersController, 'store'])
              .use(middleware.permission(['inventory_manage']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
            router
              .put('/:id', [SuppliersController, 'update'])
              .use(middleware.permission(['inventory_manage']))
              .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
            router
              .delete('/:id', [SuppliersController, 'destroy'])
              .use(middleware.permission(['inventory_manage']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
          })
          .prefix('suppliers')

        // --- FINANCE ---
        router
          .group(() => {
            // Vue d'ensemble et consultations - nécessite billing_view
            router
              .get('/overview', [FinanceController, 'overview'])
              .use(middleware.permission(['billing_view']))
              .use(middleware.rateLimit({ maxRequests: 60, windowMs: 60 * 1000 })) // 60 req/min
            // Exporter une facture en PDF - DOIT être AVANT /invoices/:id
            router
              .get('/invoices/:id/pdf', [FinanceController, 'exportPdf'])
              .use(middleware.permission(['billing_view']))
              .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min

            // Récupérer une facture par ID - doit être AVANT /invoices (route spécifique avant route générale)
            router
              .get('/invoices/:id', [FinanceController, 'show'])
              .use(middleware.permission(['billing_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .get('/invoices', [FinanceController, 'invoices'])
              .use(middleware.permission(['billing_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .get('/outstanding', [FinanceController, 'outstanding'])
              .use(middleware.permission(['billing_view']))
              .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min
            router
              .get('/chart', [FinanceController, 'chart'])
              .use(middleware.permission(['billing_view']))
              .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min
            router
              .get('/history', [FinanceController, 'history'])
              .use(middleware.permission(['billing_view']))
              .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min

            // Création de factures - nécessite billing_create
            router
              .post('/invoices', [FinanceController, 'store'])
              .use(middleware.permission(['billing_create']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

            // Modification de factures - nécessite finance_manage
            router
              .put('/invoices/:id', [FinanceController, 'update'])
              .use(middleware.permission(['finance_manage']))
              .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min

            // Traitement des paiements - nécessite payment_process
            router
              .post('/invoices/:id/payment', [FinanceController, 'recordPayment'])
              .use(middleware.permission(['payment_process']))
              .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min

            // Remboursement - nécessite finance_manage
            router
              .post('/invoices/:id/refund', [FinanceController, 'refund'])
              .use(middleware.permission(['finance_manage']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

            // Enregistrer une dépense - nécessite finance_manage
            router
              .post('/expenses', [FinanceController, 'recordExpense'])
              .use(middleware.permission(['finance_manage']))
              .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min

            // Plan de paiement - nécessite finance_manage
            router
              .post('/invoices/:id/payment-plan', [FinanceController, 'createPaymentPlan'])
              .use(middleware.permission(['finance_manage']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

            // Demandes d'assurance - nécessite finance_manage
            router
              .post('/invoices/:id/insurance-claim', [FinanceController, 'createInsuranceClaim'])
              .use(middleware.permission(['finance_manage']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
            router
              .put('/insurance-claims/:claimId', [FinanceController, 'updateInsuranceClaim'])
              .use(middleware.permission(['finance_manage']))
              .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min

            // Méthodes de paiement
            router
              .get('/payment-methods', [PaymentMethodsController, 'index'])
              .use(middleware.permission(['billing_view']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .get('/payment-methods/stats', [PaymentMethodsController, 'stats'])
              .use(middleware.permission(['billing_view']))
              .use(middleware.rateLimit({ maxRequests: 50, windowMs: 60 * 1000 })) // 50 req/min
          })
          .prefix('finance')

        // --- ADMINISTRATION & USERS ---
        router
          .get('/users', [UsersController, 'index'])
          .use(middleware.permission(['user_view']))
          .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
        router
          .get('/users/doctors', [UsersController, 'doctorsForShare'])
          .use(middleware.permission(['document_view']))
          .use(middleware.rateLimit({ maxRequests: 60, windowMs: 60 * 1000 })) // 60 req/min
        router
          .get('/users/:id', [UsersController, 'show'])
          .use(middleware.permission(['user_view']))
          .use(middleware.rateLimit({ maxRequests: 150, windowMs: 60 * 1000 })) // 150 req/min

        // Actions Admin strictes
        router
          .post('/users', [UsersController, 'store'])
          .use(middleware.permission(['user_create']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
        router
          .put('/users/:id', [UsersController, 'update'])
          .use(middleware.permission(['user_edit']))
          .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
        router
          .delete('/users/:id', [UsersController, 'destroy'])
          .use(middleware.permission(['user_delete']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

        // Gestion des permissions utilisateurs - nécessite admin
        router
          .post('/users/:id/grant-permission', [UsersController, 'grantPermission'])
          .use(middleware.permission(['admin']))
          .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
        router
          .post('/users/:id/revoke-permission', [UsersController, 'revokePermission'])
          .use(middleware.permission(['admin']))
          .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min

        // Gestion des sessions - nécessite admin
        router
          .post('/users/:id/expire-session', [UsersController, 'expireSession'])
          .use(middleware.permission(['admin']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

        // Liste blanche IP - nécessite admin
        router
          .post('/ip-whitelist', [UsersController, 'updateIpWhitelist'])
          .use(middleware.permission(['admin']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

        router
          .get('/establishments', [EtablissementsController, 'index'])
          .use(
            middleware.permission([
              'settings_manage',
              'appointment_view',
              'patient_view',
              'billing_view',
            ])
          )
          .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
        router
          .get('/establishments/stats', [EtablissementsController, 'stats'])
          .use(middleware.permission(['settings_manage']))
          .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
        router
          .get('/establishments/:id', [EtablissementsController, 'show'])
          .use(middleware.permission(['settings_manage']))
          .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
        router
          .post('/establishments', [EtablissementsController, 'store'])
          .use(middleware.permission(['settings_manage']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
        router
          .put('/establishments/:id', [EtablissementsController, 'update'])
          .use(middleware.permission(['settings_manage']))
          .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
        router
          .delete('/establishments/:id', [EtablissementsController, 'destroy'])
          .use(middleware.permission(['settings_manage']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

        // --- DÉPARTEMENTS --- (liste : dashboard, console clinique, labo pour modal prescription)
        router
          .get('/departments', [DepartmentsController, 'index'])
          .use(middleware.permission(['dashboard_view', 'clinical_view', 'analyses_view']))
          .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
        router
          .get('/departments/:id', [DepartmentsController, 'show'])
          .use(middleware.permission(['settings_manage']))
          .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
        router
          .post('/departments', [DepartmentsController, 'store'])
          .use(middleware.permission(['settings_manage']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
        router
          .put('/departments/:id', [DepartmentsController, 'update'])
          .use(middleware.permission(['settings_manage']))
          .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min
        router
          .delete('/departments/:id', [DepartmentsController, 'destroy'])
          .use(middleware.permission(['settings_manage']))
          .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min

        router
          .get('/admin/stats', [AdminStatsController, 'overview'])
          .use(middleware.permission(['dashboard_view']))
          .use(middleware.rateLimit({ maxRequests: 30, windowMs: 60 * 1000 })) // 30 req/min

        // Créer un log d'audit
        router
          .post('/audit', [AuditLogsController, 'store'])
          .use(middleware.rateLimit({ maxRequests: 200, windowMs: 60 * 1000 })) // 200 req/min (actions fréquentes)

        // Récupérer les logs d'audit
        router
          .get('/audit', [AuditLogsController, 'index'])
          .use(middleware.permission(['audit_view']))
          .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min

        // --- PERMISSIONS ---
        // Route publique pour que chaque utilisateur récupère ses propres permissions
        router
          .get('/permissions/me', [PermissionsController, 'getMyPermissions'])
          .use(middleware.auth())

        // Routes admin uniquement
        router
          .group(() => {
            router.get('/available', [PermissionsController, 'availablePermissions'])
            router.get('/roles/:role', [PermissionsController, 'getRolePermissions'])
            router.put('/roles/:role', [PermissionsController, 'updateRolePermissions'])
            router.get('/all', [PermissionsController, 'getAllRolePermissions'])

            // CRUD pour les permissions
            router.post('/', [PermissionsController, 'create'])
            router.put('/:id', [PermissionsController, 'update'])
            router.delete('/:id', [PermissionsController, 'delete'])
          })
          .prefix('permissions')
          .use(middleware.permission(['permission_manage']))

        // --- STATISTIQUES AVANCÉES ---
        router
          .group(() => {
            router.get('/overview', [StatsController, 'overview'])
            router.get('/period', [StatsController, 'period'])
            router.get('/top-doctors', [StatsController, 'topDoctors'])
            router.get('/revenue', [StatsController, 'revenue'])
            router.get('/departments', [StatsController, 'departments'])
          })
          .prefix('stats')
          .use(middleware.permission(['dashboard_view']))

        // --- EXPORTS ---
        router
          .group(() => {
            router
              .get('/patients', [ExportController, 'exportPatients'])
              .use(middleware.permission(['patient_view']))
            router
              .get('/consultations', [ExportController, 'exportConsultations'])
              .use(middleware.permission(['clinical_view']))
            router
              .get('/invoices', [ExportController, 'exportInvoices'])
              .use(middleware.permission(['billing_view']))
            router
              .get('/users', [ExportController, 'exportUsers'])
              .use(middleware.permission(['user_view']))
            router
              .get('/establishments', [ExportController, 'exportEstablishments'])
              .use(middleware.permission(['settings_manage']))
            router
              .get('/audit', [ExportController, 'exportAudit'])
              .use(middleware.permission(['audit_view']))
          })
          .prefix('export')

        // --- WEBHOOKS ---
        router
          .group(() => {
            router
              .post('/', [WebhookController, 'register'])
              .use(middleware.permission(['settings_manage']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
            router
              .get('/', [WebhookController, 'index'])
              .use(middleware.permission(['settings_manage']))
              .use(middleware.rateLimit({ maxRequests: 100, windowMs: 60 * 1000 })) // 100 req/min
            router
              .delete('/', [WebhookController, 'delete'])
              .use(middleware.permission(['settings_manage']))
              .use(middleware.rateLimit({ maxRequests: 20, windowMs: 60 * 1000 })) // 20 req/min
          })
          .prefix('webhooks')

        // --- NOTIFICATIONS ---
        // Accessibles à tous les utilisateurs authentifiés (pas de permission spécifique requise)
        router
          .group(() => {
            router.get('/', [NotificationsController, 'index'])
            router.get('/unread-count', [NotificationsController, 'unreadCount'])
            router.patch('/:id/read', [NotificationsController, 'markAsRead'])
            router.patch('/read-all', [NotificationsController, 'markAllAsRead'])
            router.patch('/mark-multiple', [NotificationsController, 'markMultipleAsRead'])
            router.delete('/archive-read', [NotificationsController, 'archiveAllRead']) // Archiver toutes les notifications lues
            router.delete('/:id', [NotificationsController, 'archive'])
            router
              .post('/test', [NotificationsController, 'createTestNotifications']) // Route de test pour créer des notifications
              .use(middleware.permission(['settings_manage'])) // Seuls les admins peuvent créer des notifications de test
          })
          .prefix('notifications')
      })
      .use(middleware.auth())
      .use(middleware.security()) // Middleware de sécurité appliqué à toutes les routes protégées
  })
  .prefix('api/v1')

// --- HEALTH CHECKS (Public) ---
const HealthController = () => import('#controllers/health_controller')
router.get('/', [HealthController, 'index'])
router.get('/health', [HealthController, 'detailed'])
router.get('/health/live', [HealthController, 'liveness'])
router.get('/health/ready', [HealthController, 'readiness'])
