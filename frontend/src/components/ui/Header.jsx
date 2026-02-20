import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import Button from './Button';
import PermissionGuard from '../PermissionGuard';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Image from '../AppImage';
import api from '../../lib/axios';
import { useNotifications, useUnreadCount, useNotificationMutations } from '../../hooks/useNotifications';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import { usePatientModal } from '../../contexts/PatientModalContext';
import MedicationDetailsModal from '../../pages/pharmacy-operations/components/MedicationDetailsModal';
import InvoiceDetailsModal from '../modals/InvoiceDetailsModal';
import AnalyseDetailsModal from '../../pages/laboratory-analyses/components/AnalyseDetailsModal';

const Header = () => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isClinicalMenuOpen, setIsClinicalMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // --- ÉTATS RECHERCHE GLOBALE ---
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);
  const searchContainerRef = useRef(null);

  // --- HISTORIQUE DES RECHERCHES ---
  const [searchHistory, setSearchHistory] = useState(() => {
    // Charger l'historique depuis localStorage au démarrage
    try {
      const saved = localStorage.getItem('searchHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // --- ÉTATS POUR MEDICATION DETAILS MODAL ---
  const [selectedMedicationForModal, setSelectedMedicationForModal] = useState(null);
  const [isMedicationDetailsModalOpen, setIsMedicationDetailsModalOpen] = useState(false);

  // --- ÉTATS POUR INVOICE DETAILS MODAL ---
  const [selectedInvoiceIdForModal, setSelectedInvoiceIdForModal] = useState(null);
  const [isInvoiceDetailsModalOpen, setIsInvoiceDetailsModalOpen] = useState(false);

  // --- ÉTATS POUR ANALYSE DETAILS MODAL ---
  const [selectedAnalyseForModal, setSelectedAnalyseForModal] = useState(null);
  const [isAnalyseDetailsModalOpen, setIsAnalyseDetailsModalOpen] = useState(false);

  // --- DÉTECTION DU SCROLL POUR L'OPACITÉ ---
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- NOTIFICATIONS DYNAMIQUES DU BACKEND ---
  const { data: notificationsData, isLoading: loadingNotifications, error: notificationsError } = useNotifications({ limit: 20 });
  const { data: unreadCountData, isLoading: loadingUnreadCount, refetch: refetchUnreadCount } = useUnreadCount();
  const { markAsRead, markAllAsRead: markAllAsReadMutation, archive, archiveAllRead } = useNotificationMutations();

  // Extraire les notifications et le count correctement
  const rawNotifications = Array.isArray(notificationsData?.data) ? notificationsData.data : [];

  // Calculer unreadCount de manière réactive avec useMemo
  const unreadCount = useMemo(() => {
    let count = 0;
    if (typeof unreadCountData === 'number') {
      count = unreadCountData;
    } else if (unreadCountData?.count !== undefined) {
      count = unreadCountData.count;
    } else if (unreadCountData?.data?.count !== undefined) {
      count = unreadCountData.data.count;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Header] unreadCountData:', unreadCountData, '-> unreadCount:', count);
    }

    return count;
  }, [unreadCountData]);

  // --- SYSTÈME DE PRIORITÉ POUR LES NOTIFICATIONS ---
  const getNotificationPriority = useCallback((notification) => {
    // Priorité 1: Critiques/Urgentes (le plus important)
    if (notification.type === 'critical' || notification.category === 'urgent' || notification.type === 'error') {
      return 1;
    }
    // Priorité 2: Warnings (important mais moins urgent)
    if (notification.type === 'warning' || notification.category === 'warning') {
      return 2;
    }
    // Priorité 3: Non lues (à voir)
    // Note: Pour les notifications partagées, cette vérification sera faite dans le composant avec l'utilisateur actuel
    const isRead = notification.isRead !== undefined ? notification.isRead : (notification.is_read || false);
    if (!isRead) {
      return 3;
    }
    // Priorité 4: Lues (moins prioritaire)
    return 4;
  }, []);

  // Trier et dédupliquer les notifications par priorité (avec useMemo pour éviter les recalculs)
  const notifications = useMemo(() => {
    if (!rawNotifications || rawNotifications.length === 0) {
      return [];
    }

    // 1. Dédupliquer par ID pour éviter les doublons
    const rawArray = Array.isArray(rawNotifications) ? rawNotifications : [];
    const seenIds = new Set();
    const uniqueNotifications = rawArray.filter(notification => {
      if (!notification || typeof notification !== 'object') return false;
      const id = notification.id || notification._id;
      if (!id) {
        // Si pas d'ID, utiliser un hash basé sur le contenu
        const contentHash = JSON.stringify({
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt || notification.created_at
        });
        if (seenIds.has(contentHash)) {
          return false;
        }
        seenIds.add(contentHash);
        return true;
      }
      if (seenIds.has(id)) {
        return false;
      }
      seenIds.add(id);
      return true;
    });

    // 2. Trier par priorité
    const uniqueArray = Array.isArray(uniqueNotifications) ? uniqueNotifications : [];
    return [...uniqueArray].sort((a, b) => {
      if (!a || typeof a !== 'object' || !b || typeof b !== 'object') return 0;
      const priorityA = getNotificationPriority(a);
      const priorityB = getNotificationPriority(b);
      // Trier par priorité croissante (1 = plus prioritaire)
      // Si même priorité, trier par date (plus récent en premier)
      if (priorityA === priorityB) {
        const dateA = new Date(a.createdAt || a.created_at || 0);
        const dateB = new Date(b.createdAt || b.created_at || 0);
        return dateB - dateA;
      }
      return priorityA - priorityB;
    });
  }, [rawNotifications, getNotificationPriority]);


  const location = useLocation();
  const navigate = useNavigate();
  const { theme, actualTheme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const { hasPermission, permissions, isLoading: permissionsLoading } = usePermissions();

  const moreMenuRef = useRef(null);
  const clinicalMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Définition des données utilisateur (dépend de user)
  const userName = user?.nomComplet || 'Utilisateur';
  const userRole = user?.role || 'visiteur';
  const userAvatar = user?.photoProfil || null;
  const userInitials = userName && typeof userName === 'string'
    ? userName.split(' ').map(n => n && n.length > 0 ? n[0] : '').filter(Boolean).join('').substring(0, 2).toUpperCase()
    : 'U';

  // Définition des variables dérivées - UNIQUEMENT basées sur les permissions du backend
  const canAddPatient = hasPermission(['patient_create']);
  const canStartUrgency = hasPermission(['consultation_create']);

  // Menu déroulant pour les services cliniques
  const clinicalMenuItems = useMemo(() => ([
    {
      path: '/console-clinique',
      label: 'Console Clinique',
      icon: 'Stethoscope',
      permission: 'clinical_view'
    },
    {
      path: '/analyses-laboratoire',
      label: 'Analyses Labo',
      icon: 'TestTube',
      permission: 'analyses_view'
    },
  ]).filter(item => {
    if (permissionsLoading) return false;
    return hasPermission(item.permission);
  }), [location.pathname, hasPermission, permissionsLoading]);

  // Navigation basée UNIQUEMENT sur les permissions gérées par le backend
  const primaryNavItems = useMemo(() => ([
    {
      path: '/tableau-de-bord',
      label: 'Tableau de bord',
      icon: 'LayoutDashboard',
      permission: 'dashboard_view' // Permission gérée par le backend
    },
    {
      path: '/agenda',
      label: 'Agenda',
      icon: 'CalendarDays',
      permission: 'agenda_view'
    },
    {
      path: '/gestion-patients',
      label: 'Patients',
      icon: 'Users',
      permission: 'patient_view'
    },
    {
      path: '/operations-pharmacie',
      label: 'Pharmacie',
      icon: 'Pill',
      permission: 'inventory_view'
    },
    {
      path: '/gestion-documents',
      label: 'Documents',
      icon: 'FileText',
      permission: 'document_view'
    },
  ]).filter(item => {
    // Vérifier UNIQUEMENT la permission (gérée par le backend)
    if (permissionsLoading) return false; // Masquer pendant le chargement
    return hasPermission(item.permission);
  }), [location.pathname, hasPermission, permissionsLoading]);

  const secondaryNavItems = useMemo(() => ([
    {
      path: '/centre-analytique',
      label: 'Analyses',
      icon: 'BarChart3',
      permission: 'audit_view'
    },
    {
      path: '/operations-financieres',
      label: 'Financier',
      icon: 'DollarSign',
      permission: 'billing_view'
    },
    {
      path: '/administration-utilisateurs',
      label: 'Administration',
      icon: 'Settings',
      permission: 'permission_manage'
    },
    {
      path: '/centre-integration',
      label: 'Intégrations',
      icon: 'Zap',
      permission: 'settings_manage'
    },
    {
      path: '/compagnon-mobile',
      label: 'Mobile',
      icon: 'Smartphone',
      permission: 'clinical_view'
    },
    {
      path: '/tableau-conformite',
      label: 'Conformité',
      icon: 'Shield',
      permission: 'audit_view'
    },
  ]).filter(item => {
    // Vérifier UNIQUEMENT la permission (gérée par le backend)
    if (permissionsLoading) return false; // Masquer pendant le chargement
    return hasPermission(item.permission);
  }), [location.pathname, hasPermission, permissionsLoading]);

  // --- LOGIQUE NOTIFICATIONS DYNAMIQUES ---
  const handleMarkAsRead = async (id) => {
    if (!id) return;
    try {
      await markAsRead.mutateAsync(id);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors du marquage de la notification comme lue:', error);
      }
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleArchiveNotification = (e, id) => {
    e.stopPropagation(); // Empêcher le clic de déclencher handleMarkAsRead
    archive.mutate(id);
  };
  // --- FIN LOGIQUE NOTIFICATIONS DYNAMIQUES ---


  // --- SYSTÈME DE PRIORITÉ POUR LES RÉSULTATS ---
  const getResultPriority = (result) => {
    if (result.type === 'Patient') return 1;
    if (result.type === 'Analyse') return 2;
    if (result.type === 'Médicament') return 3;
    if (result.type === 'Facture' || result.type === 'Document') return 4;
    if (result.type === 'Fournisseur' || result.type === 'Commande fournisseur') return 5;
    if (result.type === 'Staff') return 6;
    return 7;
  };

  // Fonction pour trier les résultats par priorité
  const sortResultsByPriority = (results) => {
    const resultsArray = Array.isArray(results) ? results : [];
    return [...resultsArray].sort((a, b) => {
      if (!a || typeof a !== 'object' || !b || typeof b !== 'object') return 0;
      const priorityA = getResultPriority(a);
      const priorityB = getResultPriority(b);
      // Trier par priorité croissante (1 = plus prioritaire)
      return priorityA - priorityB;
    });
  };

  // --- LOGIQUE DE RECHERCHE ASYNCHRONE ---
  const handleGlobalSearch = useCallback(async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get('/search/global', { params: { q: query } });
      if (response.data.success) {
        // Trier les résultats par priorité (Patients en premier)
        const dataArray = Array.isArray(response.data.data) ? response.data.data : [];
        const sortedResults = sortResultsByPriority(dataArray);
        setSearchResults(sortedResults);

        // Ajouter à l'historique si la recherche a des résultats
        if (sortedResults.length > 0) {
          const trimmedQuery = query.trim();
          setSearchHistory(prev => {
            // Éviter les doublons et garder seulement les 5 dernières recherches
            const prevArray = Array.isArray(prev) ? prev : [];
            const filtered = prevArray.filter(item => {
              if (!item || typeof item !== 'string') return false;
              return item.toLowerCase() !== trimmedQuery.toLowerCase();
            });
            const updated = [trimmedQuery, ...filtered].slice(0, 5);
            // Sauvegarder dans localStorage
            try {
              localStorage.setItem('searchHistory', JSON.stringify(updated));
            } catch (e) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Impossible de sauvegarder l\'historique:', e);
              }
            }
            return updated;
          });
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur recherche globale:", error);
      }
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Générer les suggestions d'auto-complétion (historique + base de données)
  useEffect(() => {
    if (searchQuery.length >= 2 && searchQuery.length < 3) {
      setSelectedSuggestionIndex(-1);

      // 1. Filtrer l'historique pour trouver des correspondances (instantané)
      const historyArray = Array.isArray(searchHistory) ? searchHistory : [];
      const historyMatches = historyArray.filter(item => {
        if (!item || typeof item !== 'string') return false;
        return item.toLowerCase().includes(searchQuery.toLowerCase());
      });

      // Afficher d'abord les résultats de l'historique (instantané)
      setAutocompleteSuggestions(historyMatches.slice(0, 5));

      // 2. Rechercher dans la base de données avec debounce
      const delayDebounceFn = setTimeout(async () => {
        try {
          const response = await api.get('/search/autocomplete', { params: { q: searchQuery } });
          if (response.data.success && response.data.data) {
            const dbSuggestions = response.data.data;

            // Combiner l'historique et les résultats de la DB, éviter les doublons
            const combined = [...historyMatches];
            const dbArray = Array.isArray(dbSuggestions) ? dbSuggestions : [];
            dbArray.forEach(suggestion => {
              if (!suggestion || typeof suggestion !== 'string') return;
              if (!combined.some(item => item && typeof item === 'string' && item.toLowerCase() === suggestion.toLowerCase())) {
                combined.push(suggestion);
              }
            });

            // Limiter à 5 suggestions au total
            setAutocompleteSuggestions(combined.slice(0, 5));
          } else {
            // Si pas de résultats DB, utiliser seulement l'historique
            setAutocompleteSuggestions(historyMatches.slice(0, 5));
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Erreur auto-complétion:', error);
          }
          // En cas d'erreur, utiliser seulement l'historique
          setAutocompleteSuggestions(historyMatches.slice(0, 5));
        }
      }, 200); // Debounce de 200ms pour éviter trop d'appels API

      return () => clearTimeout(delayDebounceFn);
    } else if (searchQuery.length >= 3) {
      setAutocompleteSuggestions([]);
    } else {
      setAutocompleteSuggestions([]);
    }
  }, [searchQuery, searchHistory]);

  // Débounce pour la recherche en direct
  useEffect(() => {
    if (isSearchOpen && searchQuery.length >= 3) {
      const delayDebounceFn = setTimeout(() => {
        handleGlobalSearch(searchQuery);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else if (searchQuery.length < 3) {
      setSearchResults([]);
    }
  }, [searchQuery, isSearchOpen, handleGlobalSearch]);

  // *** Gérer le focus et le clic extérieur de la recherche et des menus ***
  useEffect(() => {
    // 1. Focus quand la barre s'ouvre
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }

    // 2. Gestion du clic extérieur (pour fermer les résultats et les menus)
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) setIsMoreMenuOpen(false);
      if (clinicalMenuRef.current && !clinicalMenuRef.current.contains(event.target)) setIsClinicalMenuOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) setIsNotificationsOpen(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) setIsProfileMenuOpen(false);

      // Fermer la recherche globale au clic en dehors (barre + résultats)
      if (isSearchOpen && searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setSearchResults([]);
        setSearchQuery('');
        setAutocompleteSuggestions([]);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);


  // --- LOGIQUE DE NAVIGATION ---

  const isActivePath = (path) => location?.pathname === path;
  const handleNavigation = (path) => {
    navigate(path);
    setIsMoreMenuOpen(false);
    setIsClinicalMenuOpen(false);
  };
  const handleLogout = () => { signOut(); };
  const handleSearchSubmit = (e) => { e?.preventDefault(); /* La recherche est gérée par le debounce */ };

  const { openPatientModal, openPatientRegistrationModal } = usePatientModal();

  const handleSearchResultClick = async (result) => {
    // Si c'est un patient, ouvrir le modal de détail
    if (result.type === 'Patient' && result.id) {
      openPatientModal(result.id);
      setIsSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    } else if (result.type === 'Médicament' && result.id) {
      // Si c'est un médicament, ouvrir le modal au lieu de naviguer
      try {
        // Charger les détails complets du médicament via l'endpoint details
        const response = await api.get(`/pharmacy/medications/${result.id}/details`);
        if (response.data.success && response.data.data.medicament) {
          // Extraire le médicament de la réponse (la structure est { medicament: {...}, movements: [...] })
          setSelectedMedicationForModal(response.data.data.medicament);
          setIsMedicationDetailsModalOpen(true);
          setIsSearchOpen(false);
          setSearchQuery('');
          setSearchResults([]);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors du chargement du médicament:', error);
        }
        // En cas d'erreur, essayer de récupérer depuis l'inventaire
        try {
          const inventoryResponse = await api.get('/pharmacy/inventory', {
            params: { search: result.id, limit: 100 }
          });
          if (inventoryResponse.data.success && Array.isArray(inventoryResponse.data.data) && inventoryResponse.data.data.length > 0) {
            // Trouver le médicament par ID dans les résultats
            const inventoryArray = Array.isArray(inventoryResponse.data.data) ? inventoryResponse.data.data : [];
            const foundMedication = inventoryArray.find(m => m && m.id === result.id);
            if (foundMedication) {
              setSelectedMedicationForModal(foundMedication);
              setIsMedicationDetailsModalOpen(true);
              setIsSearchOpen(false);
              setSearchQuery('');
              setSearchResults([]);
            } else {
              showToast('Médicament introuvable', 'error');
              if (result.route) {
                navigate(result.route);
                setIsSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
              }
            }
          } else {
            showToast('Erreur lors du chargement du médicament', 'error');
            if (result.route) {
              navigate(result.route);
              setIsSearchOpen(false);
              setSearchQuery('');
              setSearchResults([]);
            }
          }
        } catch (fallbackError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Erreur fallback:', fallbackError);
          }
          showToast('Erreur lors du chargement du médicament', 'error');
          if (result.route) {
            navigate(result.route);
            setIsSearchOpen(false);
            setSearchQuery('');
            setSearchResults([]);
          }
        }
      }
    } else if (result.type === 'Facture' && result.id) {
      // Si c'est une facture, ouvrir le modal au lieu de naviguer
      setSelectedInvoiceIdForModal(result.id);
      setIsInvoiceDetailsModalOpen(true);
      setIsSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    } else if (result.type === 'Analyse' && result.id) {
      // Si c'est une analyse, ouvrir le modal au lieu de naviguer
      try {
        const response = await api.get(`/analyses/${result.id}`);
        if (response.data.success) {
          setSelectedAnalyseForModal(response.data.data);
          setIsAnalyseDetailsModalOpen(true);
          setIsSearchOpen(false);
          setSearchQuery('');
          setSearchResults([]);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors du chargement de l\'analyse:', error);
        }
        showToast('Erreur lors du chargement de l\'analyse', 'error');
        // En cas d'erreur, naviguer vers la route par défaut
        if (result.route) {
          navigate(result.route);
          setIsSearchOpen(false);
          setSearchQuery('');
          setSearchResults([]);
        }
      }
    } else {
      // Pour les autres types, navigation normale
      if (result.route) {
        navigate(result.route);
      }
      setIsSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleNewPatient = () => openPatientRegistrationModal();
  const handleEmergencyConsultation = () => navigate('/console-clinique?mode=urgence');
  const getThemeIcon = () => actualTheme === 'light' ? 'Sun' : actualTheme === 'dark' ? 'Moon' : 'Monitor';
  const getThemeLabel = () => theme === 'light' ? 'Mode Clair' : theme === 'dark' ? 'Mode Sombre' : theme === 'auto' ? 'Mode Auto (jour/nuit)' : 'Mode Système';


  const menuVariants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }, exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: 'easeIn' } } };

  // --- COMPOSANT DE RÉSULTATS OPTIMISÉ (Inline pour la compatibilité) ---
  const SearchResultsOverlay = () => {
    if (!isSearchOpen) return null;

    return (
      <motion.div
        variants={menuVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute top-full right-0 mt-2 w-[380px] sm:w-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
        ref={searchResultsRef}
      >
        <div className="max-h-80 overflow-y-auto custom-scrollbar p-3">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-primary bg-slate-50/50 dark:bg-slate-800/30">
              <Icon name="Loader2" size={24} className="animate-spin text-primary mb-2" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement…</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Icon name="SearchX" size={22} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Aucun résultat pour « {searchQuery} »</p>
            </div>
          ) : (
            searchResults.map((result, index) => (
              <motion.button
                key={index}
                onClick={() => handleSearchResultClick(result)}
                className="w-full flex items-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left mb-1 last:mb-0"
                whileHover={{ x: 2 }}
              >
                <div className={`p-2 rounded-xl mr-3 flex-shrink-0 ${result.type === 'Patient' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : result.type === 'Analyse' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
                      : result.type === 'Médicament' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : result.type === 'Facture' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                          : result.type === 'Fournisseur' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                            : result.type === 'Commande fournisseur' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                              : result.type === 'Document' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  }`}>
                  <Icon name={result.icon} size={16} />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{result.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{result.subtitle}</p>
                </div>
                <span className='text-[10px] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 ml-2 flex-shrink-0'>{result.type}</span>
              </motion.button>
            ))
          )}
        </div>
      </motion.div>
    )
  };


  const headerContent = (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        width: '100%'
      }}
      className={`backdrop-blur-2xl transition-all duration-500 ease-out
        ${isScrolled
          ? 'bg-white/50 dark:bg-slate-950/50 border-b border-white/25 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] rounded-b-2xl'
          : 'bg-white/30 dark:bg-slate-950/30 border-b border-white/20 dark:border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] rounded-b-2xl'
        }`}
    >
      <div className="w-full flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Section Gauche (Logo & Nav) */}
        <div className="flex items-center space-x-6">
          {/* ... (Logo) ... */}
          <motion.div className="flex items-center space-x-3 cursor-pointer" whileHover={{ scale: 1.02 }} onClick={() => navigate('/tableau-de-bord')}>
            <div className="relative flex items-center justify-center w-11 h-11 bg-primary rounded-2xl shadow-lg shadow-primary/25 overflow-hidden ring-1 ring-white/20">
              {/* Icône croix médicale avec serpent */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white relative z-10">
                {/* Cercle de fond */}
                <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.15)" />
                {/* Croix médicale */}
                <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white" />
                {/* Serpent qui entoure le + (spirale autour du centre) */}
                <path
                  d="M8 8 Q10 6.5, 12 8.5 Q14 6.5, 16 8.5 Q16.5 10.5, 14.5 11.5 Q16.5 13, 16 15 Q14 17, 12 15.5 Q10 17, 8 15 Q7.5 13, 9.5 11.5 Q7.5 10, 8 8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinecap="round"
                  className="text-white"
                />
                {/* Tête du serpent (en haut à gauche) */}
                <ellipse cx="8" cy="8" rx="1.4" ry="1.1" fill="currentColor" className="text-white" />
                {/* Œil du serpent */}
                <circle cx="7.7" cy="7.8" r="0.4" fill="rgba(255,255,255,0.95)" />
                {/* Queue du serpent (en bas à droite) */}
                <path
                  d="M16 15 Q17 16, 16.5 17"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinecap="round"
                  className="text-white"
                />
              </svg>
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-lg font-bold text-primary dark:text-blue-400 tracking-tight leading-none">
                MediCore
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">
                Plateforme Médicale
              </span>
            </div>
          </motion.div>
          {/* Navigation Principale */}
          <nav className="hidden lg:flex items-center space-x-1">
            {Array.isArray(primaryNavItems) && primaryNavItems.map((item, index) => {
              if (!item || typeof item !== 'object') return null;

              // Afficher le menu "Clinique" après "Documents"
              const shouldShowClinicalMenu = item.path === '/gestion-documents' && clinicalMenuItems.length > 0;

              return (
                <React.Fragment key={item.path}>
                  <motion.button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      nav-item relative flex items-center px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 overflow-visible
                      ${isActivePath(item.path)
                        ? 'text-primary dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'}
                    `}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {isActivePath(item.path) && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute inset-0 rounded-2xl
                          border-2 border-slate-300/60 dark:border-slate-500/50"
                        initial={false}
                        transition={{ type: "spring", stiffness: 360, damping: 30 }}
                      />
                    )}
                    <Icon
                      name={item.icon}
                      size={18}
                      className={`mr-2 relative z-10 ${isActivePath(item.path) ? 'text-primary dark:text-blue-400' : ''}`}
                    />
                    <span className="relative z-10">{item.label}</span>
                  </motion.button>
                  {shouldShowClinicalMenu && (
                    <div className="relative" ref={clinicalMenuRef}>
                      <motion.button
                        onClick={() => setIsClinicalMenuOpen(!isClinicalMenuOpen)}
                        className={`nav-item relative flex items-center px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 overflow-visible ${(isActivePath('/console-clinique') || isActivePath('/analyses-laboratoire'))
                            ? 'text-primary dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'
                          } ${isClinicalMenuOpen ? 'bg-white/25 dark:bg-white/5' : ''}`}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {(isActivePath('/console-clinique') || isActivePath('/analyses-laboratoire')) && (
                          <motion.div
                            layoutId="activeClinicalIndicator"
                            className="absolute inset-0 rounded-2xl
                              border-2 border-slate-300/60 dark:border-slate-500/50"
                            initial={false}
                            transition={{ type: "spring", stiffness: 360, damping: 30 }}
                          />
                        )}
                        <Icon name="HeartPulse" size={18} className="mr-2 relative z-10" />
                        <span className="relative z-10">Clinique</span>
                        <motion.div
                          animate={{ rotate: isClinicalMenuOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="relative z-10"
                        >
                          <Icon name="ChevronDown" size={14} className="ml-1.5 opacity-60" />
                        </motion.div>
                      </motion.button>
                      <AnimatePresence>
                        {isClinicalMenuOpen && (
                          <motion.div
                            variants={menuVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute top-full left-0 mt-2 w-64 backdrop-blur-2xl bg-white/80 dark:bg-slate-900/85 border border-white/30 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 overflow-hidden"
                          >
                            <div className="p-2">
                              {Array.isArray(clinicalMenuItems) && clinicalMenuItems.map((clinicalItem, clinicalIndex) => {
                                if (!clinicalItem || typeof clinicalItem !== 'object') return null;
                                return (
                                  <motion.button
                                    key={clinicalItem.path}
                                    onClick={() => handleNavigation(clinicalItem.path)}
                                    className={`w-full relative flex items-center px-4 py-3 text-sm transition-all duration-200 rounded-xl group ${isActivePath(clinicalItem.path)
                                        ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 font-semibold shadow-sm'
                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                      }`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: clinicalIndex * 0.05 }}
                                    whileHover={{ x: 4, scale: 1.02 }}
                                  >
                                    <div className={`p-1.5 rounded-lg mr-3 transition-colors ${isActivePath(clinicalItem.path)
                                        ? 'bg-primary/20 dark:bg-primary/30'
                                        : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 dark:group-hover:bg-primary/20'
                                      }`}>
                                      <Icon
                                        name={clinicalItem.icon}
                                        size={16}
                                        className={isActivePath(clinicalItem.path) ? 'text-primary dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400'}
                                      />
                                    </div>
                                    <span className="flex-1 text-left">{clinicalItem.label}</span>
                                    {isActivePath(clinicalItem.path) && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="p-1 rounded-full bg-primary/20 dark:bg-primary/30"
                                      >
                                        <Icon name="Check" size={12} className="text-primary dark:text-blue-400" />
                                      </motion.div>
                                    )}
                                  </motion.button>
                                );
                              }).filter(Boolean)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </React.Fragment>
              );
            }).filter(Boolean)}
            {Array.isArray(secondaryNavItems) && secondaryNavItems.length > 0 && (
              <div className="relative" ref={moreMenuRef}>
                <motion.button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`nav-item relative flex items-center px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-white/20 dark:hover:border-white/5 ${isMoreMenuOpen ? 'bg-white/50 dark:bg-white/10 shadow-sm border-white/20' : ''}`}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Icon name="MoreHorizontal" size={18} className="mr-2" />
                  <span>Plus</span>
                  <motion.div
                    animate={{ rotate: isMoreMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon name="ChevronDown" size={14} className="ml-1.5 opacity-60" />
                  </motion.div>
                </motion.button>
                <AnimatePresence>
                  {isMoreMenuOpen && (
                    <motion.div
                      variants={menuVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute top-full left-0 mt-2 w-72 backdrop-blur-2xl bg-white/80 dark:bg-slate-900/85 border border-white/30 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 overflow-hidden"
                    >
                      <div className="p-2">
                        {Array.isArray(secondaryNavItems) && secondaryNavItems.map((item, index) => {
                          if (!item || typeof item !== 'object') return null;
                          return (
                            <motion.button
                              key={item.path}
                              onClick={() => handleNavigation(item.path)}
                              className={`w-full relative flex items-center px-4 py-3 text-sm transition-all duration-200 rounded-xl group ${isActivePath(item.path)
                                  ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 font-semibold shadow-sm'
                                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ x: 4, scale: 1.02 }}
                            >
                              <div className={`p-1.5 rounded-lg mr-3 transition-colors ${isActivePath(item.path)
                                  ? 'bg-primary/20 dark:bg-primary/30'
                                  : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 dark:group-hover:bg-primary/20'
                                }`}>
                                <Icon
                                  name={item.icon}
                                  size={16}
                                  className={isActivePath(item.path) ? 'text-primary dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400'}
                                />
                              </div>
                              <span className="flex-1 text-left">{item.label}</span>
                              {isActivePath(item.path) && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="p-1 rounded-full bg-primary/20 dark:bg-primary/30"
                                >
                                  <Icon name="Check" size={12} className="text-primary dark:text-blue-400" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        }).filter(Boolean)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>
        </div>

        {/* Section Droite (Recherche, Notifs, Profil) */}
        <div className="flex items-center space-x-3 flex-shrink-0">

          {/* Recherche Globale : la barre étendue est en position absolue pour ne pas pousser le header */}
          <div className="relative hidden sm:block w-10 flex-shrink-0" ref={searchContainerRef}>
            {/* Bouton loupe seul dans le flux (toujours 40px) */}
            <motion.button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 hover:bg-white/60 dark:hover:bg-white/10 hover:border hover:border-white/30 dark:hover:border-white/10 backdrop-blur-sm transition-all duration-200 flex-shrink-0 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon name="Search" size={16} className="group-hover:scale-110 transition-transform" />
            </motion.button>

            {/* Barre de recherche étendue en overlay (n'affecte pas le layout) */}
            <AnimatePresence>
              {isSearchOpen && (
                <motion.form
                  initial={{ opacity: 0, width: 40 }}
                  animate={{ opacity: 1, width: 280 }}
                  exit={{ opacity: 0, width: 40 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  onSubmit={handleSearchSubmit}
                  className={`absolute right-0 top-0 z-50 flex items-center backdrop-blur-2xl bg-white/70 dark:bg-slate-900/80 rounded-2xl border shadow-xl ${isSearchOpen
                      ? 'border-white/40 dark:border-white/15'
                      : 'border-white/25 dark:border-white/10'
                    }`}
                  style={{ minWidth: 280 }}
                >
                  <div className="flex items-center justify-center w-10 h-10 text-slate-500 dark:text-slate-400 flex-shrink-0 rounded-l-2xl">
                    <Icon name="Search" size={16} />
                  </div>
                  <div className="flex-1 overflow-hidden flex items-center relative min-w-0">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Rechercher patients, médicaments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-0 outline-none px-2.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pr-8"
                      onFocus={() => { if (searchQuery.length >= 3) handleGlobalSearch(searchQuery); }}
                      onKeyDown={(e) => {
                        // Navigation dans les suggestions avec les flèches
                        if (autocompleteSuggestions.length > 0) {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setSelectedSuggestionIndex(prev =>
                              prev < autocompleteSuggestions.length - 1 ? prev + 1 : prev
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                          } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
                            e.preventDefault();
                            const selected = autocompleteSuggestions[selectedSuggestionIndex];
                            setSearchQuery(selected);
                            handleGlobalSearch(selected);
                            setAutocompleteSuggestions([]);
                            setSelectedSuggestionIndex(-1);
                          } else if (e.key === 'Escape') {
                            setAutocompleteSuggestions([]);
                            setSelectedSuggestionIndex(-1);
                            setIsSearchOpen(false);
                          }
                        } else if (e.key === 'Escape') {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }
                      }}
                    />
                    <div className="absolute right-2 flex items-center gap-1.5">
                      {isSearching && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                        >
                          <Icon
                            name="Loader2"
                            size={16}
                            className="animate-spin text-primary"
                          />
                        </motion.div>
                      )}
                      {searchQuery.length > 0 && !isSearching && (
                        <motion.button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSearchResults([]);
                            setAutocompleteSuggestions([]);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Icon name="X" size={14} />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Panneau de résultats de recherche */}
            <AnimatePresence>
              {isSearchOpen && (searchQuery.length >= 2 || isSearching || searchResults.length > 0 || searchHistory.length > 0) && (
                <motion.div
                  variants={menuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full right-0 mt-3 w-[380px] sm:w-[420px] backdrop-blur-2xl bg-white/80 dark:bg-slate-900/85 border border-white/30 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 overflow-hidden"
                  ref={searchResultsRef}
                >
                    <div className="p-3 border-b border-white/20 dark:border-white/5 bg-white/40 dark:bg-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <Icon name="Search" size={20} className="text-primary dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Recherche</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {searchQuery.length >= 3 ? `Résultats pour « ${searchQuery} »` : 'Suggestions et historique'}
                      </p>
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-3">
                    {isSearching ? (
                      <div className="flex flex-col items-center justify-center py-10 mx-2 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-primary bg-slate-50/50 dark:bg-slate-800/30">
                        <Icon name="Loader2" size={28} className="animate-spin text-primary mb-2" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement…</span>
                      </div>
                    ) : searchQuery.length < 3 ? (
                      <div>
                        {/* Auto-complétion (historique + base de données) */}
                        {autocompleteSuggestions.length > 0 ? (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2 px-2">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Icon name="Zap" size={12} />
                                Suggestions
                              </span>
                            </div>
                            <div className="max-h-[160px] overflow-y-auto custom-scrollbar space-y-1">
                              {Array.isArray(autocompleteSuggestions) && autocompleteSuggestions.map((suggestion, idx) => {
                                if (!suggestion || typeof suggestion !== 'string') return null;
                                return (
                                  <motion.button
                                    key={idx}
                                    onClick={() => {
                                      setSearchQuery(suggestion);
                                      handleGlobalSearch(suggestion);
                                      setAutocompleteSuggestions([]);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 text-left group ${idx === selectedSuggestionIndex
                                        ? 'bg-primary/10 dark:bg-primary/20 border border-slate-200 dark:border-slate-700 shadow-sm'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                                      }`}
                                    whileHover={{ x: 2, scale: 1.01 }}
                                    onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                  >
                                    <div className={`p-1.5 rounded-lg ${idx === selectedSuggestionIndex
                                        ? 'bg-primary/20 dark:bg-primary/30'
                                        : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 dark:group-hover:bg-primary/20'
                                      }`}>
                                      <Icon name="Search" size={12} className={`transition-colors ${idx === selectedSuggestionIndex
                                          ? 'text-primary dark:text-blue-400'
                                          : 'text-slate-400 group-hover:text-primary'
                                        }`} />
                                    </div>
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors flex-1 text-left truncate">
                                      {suggestion && typeof suggestion === 'string' ? suggestion.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => {
                                        if (!part || typeof part !== 'string') return null;
                                        return part.toLowerCase() === searchQuery.toLowerCase() ? (
                                          <span key={i} className="font-bold text-primary dark:text-blue-400">{part}</span>
                                        ) : (
                                          <span key={i}>{part}</span>
                                        );
                                      }).filter(Boolean) : suggestion}
                                    </span>
                                    {idx === selectedSuggestionIndex && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="p-1 rounded-full bg-primary/20 dark:bg-primary/30"
                                      >
                                        <Icon name="ArrowRight" size={10} className="text-primary dark:text-blue-400" />
                                      </motion.div>
                                    )}
                                  </motion.button>
                                );
                              }).filter(Boolean)}
                            </div>
                            <div className="h-px bg-slate-200 dark:bg-slate-700 my-3"></div>
                          </div>
                        ) : null}

                        {/* Historique des recherches récentes (affiché seulement si pas de suggestions) */}
                        {autocompleteSuggestions.length === 0 && searchHistory.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2 px-2">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Icon name="Clock" size={12} />
                                Récentes
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchHistory([]);
                                  localStorage.removeItem('searchHistory');
                                }}
                                className="text-[10px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors font-medium"
                              >
                                Effacer
                              </button>
                            </div>
                            <div className="max-h-[160px] overflow-y-auto custom-scrollbar space-y-1">
                              {Array.isArray(searchHistory) && searchHistory.map((historyItem, idx) => {
                                if (!historyItem || typeof historyItem !== 'string') return null;
                                return (
                                  <motion.button
                                    key={idx}
                                    onClick={() => {
                                      setSearchQuery(historyItem);
                                      handleGlobalSearch(historyItem);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 text-left group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                    whileHover={{ x: 2, scale: 1.01 }}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                  >
                                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors">
                                      <Icon name="Clock" size={12} className="text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors flex-1 text-left truncate">
                                      {historyItem}
                                    </span>
                                  </motion.button>
                                );
                              }).filter(Boolean)}
                            </div>
                            <div className="h-px bg-slate-200 dark:bg-slate-700 my-3"></div>
                          </div>
                        )}
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                          <Icon name="SearchX" size={28} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Aucun résultat trouvé</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Essayez avec d'autres mots-clés</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {Array.isArray(searchResults) && searchResults.map((result, index) => {
                          if (!result || typeof result !== 'object') return null;
                          const priority = getResultPriority(result);
                          const isHighPriority = priority === 1; // Patients
                          const isMediumPriority = priority === 2; // Médicaments

                          // Afficher un séparateur visuel entre les groupes de priorité
                          const prevResult = index > 0 ? searchResults[index - 1] : null;
                          const prevPriority = prevResult ? getResultPriority(prevResult) : null;
                          const showSeparator = prevPriority && prevPriority < priority;

                          return (
                            <React.Fragment key={index}>
                              {showSeparator && (
                                <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                              )}
                              <motion.button
                                key={index}
                                onClick={() => handleSearchResultClick(result)}
                                className={`relative w-full flex items-center p-3 rounded-xl transition-all duration-200 text-left group ${isHighPriority
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md'
                                    : isMediumPriority
                                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                                      : 'bg-transparent border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                                  }`}
                                whileHover={{ x: 2, scale: isHighPriority ? 1.02 : 1.01 }}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                {/* Indicateur de priorité pour les Patients */}
                                {isHighPriority && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl"></div>
                                )}

                                <div className={`p-2.5 rounded-xl mr-3 shadow-sm transition-all duration-200 relative ${result.type === 'Patient'
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-200/50 dark:ring-blue-700/30'
                                    : result.type === 'Analyse'
                                      ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
                                      : result.type === 'Médicament'
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                        : result.type === 'Facture'
                                          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                                          : result.type === 'Fournisseur'
                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                            : result.type === 'Commande fournisseur'
                                              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                              : result.type === 'Document'
                                                ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
                                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                  } ${isHighPriority ? 'group-hover:scale-110 ring-2 ring-blue-300/60 dark:ring-blue-700/40' : 'group-hover:scale-105'}`}>
                                  <Icon name={result.icon} size={18} />
                                  {/* Badge "Prioritaire" pour les Patients */}
                                  {isHighPriority && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm"
                                    >
                                      <Icon name="Star" size={8} className="text-white" />
                                    </motion.div>
                                  )}
                                </div>
                                <div className='flex-1 min-w-0'>
                                  <div className="flex items-center gap-2">
                                    <p className={`text-sm font-semibold truncate transition-colors ${isHighPriority
                                        ? 'text-blue-900 dark:text-blue-100 group-hover:text-blue-700 dark:group-hover:text-blue-300'
                                        : 'text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-blue-400'
                                      }`}>
                                      {result.title}
                                    </p>
                                    {isHighPriority && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white uppercase tracking-wider">
                                        Prioritaire
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-xs truncate mt-0.5 ${isHighPriority
                                      ? 'text-blue-700 dark:text-blue-300'
                                      : 'text-slate-500 dark:text-slate-400'
                                    }`}>
                                    {result.subtitle}
                                  </p>
                                </div>
                                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ml-2 flex-shrink-0 ${result.type === 'Patient'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-sm'
                                    : result.type === 'Médicament'
                                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                      : result.type === 'Facture'
                                        ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800'
                                        : result.type === 'Fournisseur'
                                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                          : result.type === 'Commande fournisseur'
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                            : result.type === 'Document'
                                              ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
                                              : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                                  }`}>
                                  {result.type}
                                </span>
                              </motion.button>
                            </React.Fragment>
                          );
                        }).filter(Boolean)}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>


          {/* Theme */}
          <motion.button
            onClick={toggleTheme}
            title={getThemeLabel()}
            className="flex items-center justify-center w-10 h-10 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/10 hover:border hover:border-white/30 dark:hover:border-white/10 backdrop-blur-sm transition-all duration-200 hover:text-amber-500 dark:hover:text-amber-400 group"
            whileHover={{ scale: 1.05, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon name={getThemeIcon()} size={20} className="group-hover:scale-110 transition-transform" />
          </motion.button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <motion.button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200 group ${isNotificationsOpen
                  ? 'bg-white/60 dark:bg-white/10 text-primary dark:text-blue-400 border border-white/30 dark:border-white/10 backdrop-blur-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/10 hover:border hover:border-white/30 dark:hover:border-white/10 hover:text-primary dark:hover:text-blue-400 backdrop-blur-sm'
                }`}
              whileHover={!isNotificationsOpen ? { scale: 1.05 } : {}}
              whileTap={{ scale: 0.95 }}
            >
              <Icon name="Bell" size={20} className="group-hover:scale-110 transition-transform" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] px-1 flex items-center justify-center bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 text-[10px] font-bold text-white leading-none tabular-nums"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </motion.button>
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  variants={menuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full right-0 mt-3 w-[380px] sm:w-96 backdrop-blur-2xl bg-white/80 dark:bg-slate-900/85 border border-white/30 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 overflow-hidden"
                >
                    <div className="p-4 border-b border-white/20 dark:border-white/5 bg-white/40 dark:bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <Icon name="Bell" size={20} className="text-primary dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                    {loadingNotifications ? (
                      <div className="flex flex-col items-center justify-center py-12 mx-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-primary bg-slate-50/50 dark:bg-slate-800/30">
                        <Icon name="Loader2" size={28} className="animate-spin text-primary mb-2" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement…</span>
                      </div>
                    ) : notificationsError ? (
                      <div className="flex flex-col items-center justify-center py-12 mx-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-rose-500 bg-rose-50/30 dark:bg-rose-900/10 text-center">
                        <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-3">
                          <Icon name="AlertCircle" size={24} className="text-rose-500 dark:text-rose-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Erreur de chargement</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Veuillez réessayer plus tard</p>
                      </div>
                    ) : Array.isArray(notifications) && notifications.length > 0 ? (
                      <div className="p-3 space-y-2">
                        {notifications.map((n, index) => {
                          if (!n || typeof n !== 'object') return null;
                          // Gérer les deux formats possibles (isRead ou is_read)
                          let isRead = n.isRead !== undefined ? n.isRead : (n.is_read || false)

                          // Pour les notifications partagées, vérifier si l'utilisateur actuel a lu
                          if (n.metadata?.isShared === true && user?.id) {
                            const readBy = n.metadata?.readBy || []
                            isRead = readBy.includes(user.id) || isRead
                          }

                          const priority = getNotificationPriority(n);
                          const isCritical = priority === 1; // Critiques/Urgentes
                          const isWarning = priority === 2; // Warnings

                          const getNotificationColor = () => {
                            if (n.type === 'critical' || n.category === 'urgent') return 'bg-rose-500';
                            if (n.type === 'warning' || n.category === 'warning') return 'bg-amber-500';
                            if (n.type === 'success' || n.category === 'success') return 'bg-emerald-500';
                            if (n.type === 'error' || n.category === 'error') return 'bg-red-500';
                            return 'bg-blue-500';
                          };
                          const getNotificationIcon = () => {
                            if (n.type === 'critical' || n.category === 'urgent') return 'AlertTriangle';
                            if (n.type === 'warning' || n.category === 'warning') return 'AlertCircle';
                            if (n.type === 'success' || n.category === 'success') return 'CheckCircle';
                            if (n.type === 'error' || n.category === 'error') return 'XCircle';
                            return 'Info';
                          };

                          // Afficher un séparateur visuel entre les groupes de priorité
                          const prevNotification = index > 0 ? notifications[index - 1] : null;
                          const prevPriority = prevNotification ? getNotificationPriority(prevNotification) : null;
                          const showSeparator = prevPriority && prevPriority < priority;

                          // Générer une clé unique pour éviter les duplications
                          const notificationKey = n.id || n._id || `notification-${index}-${n.createdAt || Date.now()}`;

                          return (
                            <React.Fragment key={notificationKey}>
                              {showSeparator && (
                                <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                              )}
                              <motion.div
                                onClick={async (e) => {
                                  e.stopPropagation();

                                  // Si c'est une notification d'analyse, ouvrir le modal
                                  if (n.targetType === 'analyse' && n.targetId) {
                                    try {
                                      const response = await api.get(`/analyses/${n.targetId}`);
                                      if (response.data.success) {
                                        setSelectedAnalyseForModal(response.data.data);
                                        setIsAnalyseDetailsModalOpen(true);
                                        // Marquer comme lu si pas déjà lue
                                        if (!isRead && n.id) {
                                          await handleMarkAsRead(n.id);
                                        }
                                      }
                                    } catch (error) {
                                      if (process.env.NODE_ENV === 'development') {
                                        console.error('Erreur lors du chargement de l\'analyse:', error);
                                      }
                                      showToast('Erreur lors du chargement de l\'analyse', 'error');
                                      // Marquer comme lu quand même si pas déjà lue
                                      if (!isRead && n.id) {
                                        await handleMarkAsRead(n.id);
                                      }
                                    }
                                  } else {
                                    // Pour les autres notifications, marquer comme lu si pas déjà lue
                                    if (!isRead && n.id) {
                                      await handleMarkAsRead(n.id);
                                    }
                                  }
                                }}
                                className={`group relative p-3 rounded-xl border cursor-pointer transition-all duration-200 ${isCritical
                                    ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700 shadow-md'
                                    : isWarning
                                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 shadow-sm'
                                      : !isRead
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 shadow-sm'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                  }`}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                whileHover={{ x: 2, scale: isCritical ? 1.02 : 1.01 }}
                              >
                                {/* Barre latérale pour les notifications critiques */}
                                {isCritical && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-xl"></div>
                                )}

                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-xl ${getNotificationColor()} shadow-sm flex-shrink-0 mt-0.5 relative ${isCritical ? 'ring-2 ring-rose-300/60 dark:ring-rose-700/40 ring-offset-1' : ''
                                    }`}>
                                    <Icon name={getNotificationIcon()} size={16} className="text-white" />
                                    {/* Badge "CRITIQUE" pour les notifications critiques */}
                                    {isCritical && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm"
                                      >
                                        <Icon name="AlertTriangle" size={10} className="text-white" />
                                      </motion.div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${isCritical
                                            ? 'text-rose-900 dark:text-rose-100'
                                            : !isRead
                                              ? 'text-slate-900 dark:text-white'
                                              : 'text-slate-700 dark:text-slate-300'
                                          }`}>
                                          {n.title || 'Notification'}
                                        </p>
                                        {isCritical && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white uppercase tracking-wider flex-shrink-0">
                                            Critique
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {!isRead && (
                                          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${isCritical
                                              ? 'bg-rose-500 animate-pulse'
                                              : 'bg-blue-500'
                                            }`}></div>
                                        )}
                                        <motion.button
                                          onClick={(e) => handleArchiveNotification(e, n.id)}
                                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 dark:text-rose-400 transition-all duration-200"
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          title="Supprimer cette notification"
                                        >
                                          <Icon name="Trash2" size={14} />
                                        </motion.button>
                                      </div>
                                    </div>
                                    <p className={`text-xs leading-relaxed mb-2 ${isCritical
                                        ? 'text-rose-800 dark:text-rose-200'
                                        : 'text-slate-600 dark:text-slate-400'
                                      }`}>
                                      {n.message || 'Aucun message'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <Icon name="Clock" size={10} className={isCritical ? 'text-rose-500' : 'text-slate-400'} />
                                      <p className={`text-[10px] ${isCritical
                                          ? 'text-rose-600 dark:text-rose-300'
                                          : 'text-slate-400 dark:text-slate-500'
                                        }`}>
                                        {n.time || n.createdAt || 'Maintenant'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </React.Fragment>
                          );
                        }).filter(Boolean)}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                          <Icon name="Bell" size={28} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Aucune notification</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Vous êtes à jour</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-white/20 dark:border-white/5 bg-white/40 dark:bg-white/5">
                    {/* Bouton de test pour créer des notifications (dev uniquement) */}
                    {process.env.NODE_ENV === 'development' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={async () => {
                          try {
                            const response = await api.post('/notifications/test')
                            if (response.data.success) {
                              showToast(`✅ ${response.data.count} notifications de test créées !`, 'success')
                              // Rafraîchir les notifications
                              window.location.reload()
                            }
                          } catch (error) {
                            if (process.env.NODE_ENV === 'development') {
                              console.error('Erreur création notifications de test:', error);
                            }
                            showToast('Erreur lors de la création des notifications de test', 'error');
                          }
                        }}
                      >
                        🧪 Créer notifications de test
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions Rapides */}
          {(canAddPatient || canStartUrgency) && (
            <div className="hidden md:flex items-center gap-2 border-l border-white/20 dark:border-white/5 pl-3 ml-1">
              <PermissionGuard requiredPermission="patient_create">
                {canAddPatient && (
                  <motion.button
                    onClick={handleNewPatient}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium text-slate-700 dark:text-slate-300 backdrop-blur-sm bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/15 hover:border-white/40 dark:hover:border-white/15 hover:text-primary dark:hover:text-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!hasPermission('patient_create')}
                  >
                    <div className="p-0.5 rounded-md bg-primary/10 dark:bg-primary/20">
                      <Icon name="UserPlus" size={14} className="text-primary dark:text-blue-400" />
                    </div>
                    <span>Patient</span>
                  </motion.button>
                )}
              </PermissionGuard>
              <PermissionGuard requiredPermission="consultation_create">
                {canStartUrgency && (
                  <motion.button
                    onClick={handleEmergencyConsultation}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 border border-white/20 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all duration-200"
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!hasPermission('consultation_create')}
                  >
                    <div className="p-0.5 rounded-md bg-white/20">
                      <Icon name="Zap" size={14} className="text-white" />
                    </div>
                    <span>Urgence</span>
                  </motion.button>
                )}
              </PermissionGuard>
            </div>
          )}

          {/* Profil */}
          <div className="relative ml-2" ref={profileMenuRef}>
            <motion.button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={`relative flex items-center justify-center w-10 h-10 rounded-2xl border-2 overflow-hidden transition-all duration-200 focus:outline-none focus:ring-0
                ${isProfileMenuOpen
                  ? 'border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-sm shadow-md'
                  : 'border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-white/10 hover:border-white/40 dark:hover:border-white/15 hover:shadow-md'
                }`}
              whileHover={!isProfileMenuOpen ? { scale: 1.05 } : {}}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                {userAvatar ? (
                  <Image src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-primary dark:text-blue-400">
                    {userInitials}
                  </span>
                )}
              </div>
            </motion.button>
            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  variants={menuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full right-0 mt-3 w-72 backdrop-blur-2xl bg-white/80 dark:bg-slate-900/85 border border-white/30 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 overflow-hidden"
                >
                  {/* En-tête profil */}
                  <div className="p-4 border-b border-white/20 dark:border-white/5 bg-white/40 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-800">
                          {userAvatar ? (
                            <Image src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-primary dark:text-blue-400">
                              {userInitials}
                            </span>
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" title="En ligne" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                        <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 font-medium capitalize border border-primary/20 dark:border-primary/30">
                          {userRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-2">
                    <motion.button
                      onClick={() => { setIsProfileMenuOpen(false); navigate('/mon-compte'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200 text-left group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      whileHover={{ x: 2, scale: 1.01 }}
                    >
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors">
                        <Icon name="User" size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors" />
                      </div>
                      <span className="flex-1">Mon compte</span>
                      <Icon name="ChevronRight" size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                    <motion.button
                      onClick={() => navigate('/aide')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200 text-left group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      whileHover={{ x: 2, scale: 1.01 }}
                    >
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors">
                        <Icon name="HelpCircle" size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors" />
                      </div>
                      <span className="flex-1">Aide</span>
                      <Icon name="ChevronRight" size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" role="separator" />

                    <motion.button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all duration-200 text-left group border border-transparent hover:border-rose-200 dark:hover:border-rose-700"
                      whileHover={{ x: 2, scale: 1.01 }}
                    >
                      <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 group-hover:bg-rose-200 dark:group-hover:bg-rose-900/50 transition-colors">
                        <Icon name="LogOut" size={16} className="text-rose-600 dark:text-rose-400" />
                      </div>
                      <span className="flex-1">Déconnexion</span>
                      <Icon name="ChevronRight" size={14} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Medication Details Modal */}
      <MedicationDetailsModal
        isOpen={isMedicationDetailsModalOpen}
        onClose={() => {
          setIsMedicationDetailsModalOpen(false);
          setSelectedMedicationForModal(null);
        }}
        medication={selectedMedicationForModal}
      />

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        isOpen={isInvoiceDetailsModalOpen}
        invoiceId={selectedInvoiceIdForModal}
        onClose={() => {
          setIsInvoiceDetailsModalOpen(false);
          setSelectedInvoiceIdForModal(null);
        }}
      />

      {/* Analyse Details Modal */}
      <AnalyseDetailsModal
        isOpen={isAnalyseDetailsModalOpen}
        onClose={() => {
          setIsAnalyseDetailsModalOpen(false);
          setSelectedAnalyseForModal(null);
        }}
        analyse={selectedAnalyseForModal}
      />
    </header>
  );

  // Rendre le header via un portal directement dans document.body pour éviter les problèmes de positionnement
  return ReactDOM.createPortal(headerContent, document.body);
};

export default Header;
