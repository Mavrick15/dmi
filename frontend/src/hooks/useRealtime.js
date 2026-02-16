import { useEffect, useRef } from 'react';
import { Transmit } from '@adonisjs/transmit-client';
import { useToast } from '../contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

// Fonction utilitaire robuste pour obtenir l'URL racine
const getTransmitBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL;

  if (!url || typeof url !== 'string') {
    url = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3333';
  }

  if (url.startsWith('/')) {
    url = `${window.location.origin}${url}`;
  }

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (url.startsWith('http:')) {
      url = url.replace('http:', 'https:');
    }
  }

  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }

  url = url.replace(/\/api\/v1\/?$/i, '');

  if (!url) {
    return window.location.origin;
  }

  return url;
};

export const useRealtime = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Ref pour stocker l'instance
  const transmitRef = useRef(null);
  const userSubscriptionRef = useRef(null);
  
  // Ref pour stocker le timer du debounce (évite les rafraîchissements multiples)
  const debounceRef = useRef(null);
  
  // Ref pour capturer showToast de manière stable dans les callbacks
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    if (transmitRef.current) return;

    const baseUrl = getTransmitBaseUrl();
    if (process.env.NODE_ENV === 'development') {
      console.log("🔌 [Realtime] Tentative de connexion SSE vers :", baseUrl);
    }

    let subscription = null;
    let userSubscription = null;

    try {
      const transmit = new Transmit({
        baseUrl: baseUrl,
        maxAttempts: 10,
        onReconnect: () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 [Realtime] Reconnexion en cours...');
          }
        },
        onError: (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error("❌ [Realtime] Erreur de connexion SSE :", error);
            // Ne pas afficher de toast pour les erreurs de connexion SSE
            // car elles sont normales si le backend n'est pas démarré
            if (error.message?.includes('502') || error.message?.includes('Bad Gateway')) {
              console.warn("⚠️ [Realtime] Backend non accessible (502). Vérifiez que le backend est démarré.");
            }
          }
        },
      });

      transmitRef.current = transmit;

      // 1. Canal pharmacie (pour les mises à jour de stock)
      subscription = transmit.subscription('pharmacy_channel');
      
      subscription.create()
        .then(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log("✅ [Realtime] Connecté au canal : pharmacy_channel");
          }
        })
        .catch(err => {
          if (process.env.NODE_ENV === 'development') {
            console.error("❌ [Realtime] Erreur abonnement pharmacy_channel :", err);
            if (err.message?.includes('502') || err.status === 502) {
              console.warn("⚠️ [Realtime] Impossible de se connecter au backend. Vérifiez :");
              console.warn("   1. Le backend est démarré (node ace serve)");
              console.warn("   2. Le backend écoute sur le port 5040");
              console.warn("   3. La route /__transmit/events est configurée");
            }
          }
        });

      subscription.onMessage((data) => {
        if (process.env.NODE_ENV === 'development') {
          console.log("📨 [Realtime] Message reçu (pharmacy_channel) :", data);
        }
        
        const payload = typeof data === 'string' ? JSON.parse(data) : data;

        // 1. Notification Visuelle (Immédiate) - Améliorée pour les prescriptions et mouvements
        if (payload.type === 'new_prescription') {
          // Notification spéciale pour les nouvelles prescriptions - PRIORITAIRE
          const notificationType = payload.priority === 'urgent' ? 'warning' : 'info';
          const toastMessage = payload.message || 
            `Prescription de ${payload.medicamentCount || 0} médicament(s) pour ${payload.patientName || 'un patient'}`;
          
          showToastRef.current(
            `${payload.title || 'Nouvelle prescription'}: ${toastMessage}`,
            notificationType
          );
          
          // Invalider IMMÉDIATEMENT sans debounce pour les prescriptions (priorité haute)
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
          queryClient.invalidateQueries({ queryKey: ['pharmacy', 'prescriptions'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          
          // Pas de debounce pour les prescriptions - traitement immédiat
          return; // Sortir pour éviter le debounce
        } else if (payload.type === 'inventory_movement') {
          // Notification pour les mouvements d'inventaire - PRIORITAIRE
          const movementTypeLabel = payload.movementType === 'entree' ? 'Entrée' : 
                                    payload.movementType === 'sortie' ? 'Sortie' : 'Ajustement';
          const toastMessage = payload.message || 
            `${payload.quantity || 0} unité(s) de ${payload.medicamentName || 'médicament'}`;
          
          showToastRef.current(
            `${movementTypeLabel} de stock: ${toastMessage}`,
            payload.movementType === 'entree' ? 'success' : payload.movementType === 'sortie' ? 'warning' : 'info'
          );
          
          // Invalider IMMÉDIATEMENT sans debounce pour les mouvements d'inventaire
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
          queryClient.invalidateQueries({ queryKey: ['pharmacy', 'stats'] });
          queryClient.invalidateQueries({ queryKey: ['pharmacy', 'alerts'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          
          // Pas de debounce pour les mouvements - traitement immédiat
          return; // Sortir pour éviter le debounce
        } else if (payload.message) {
          // Notification générique
          showToastRef.current(payload.message, payload.type === 'error' ? 'error' : 'info');
        }

        // 2. Mise à jour des données (Avec DEBOUNCE réduit pour plus de fluidité)
        // Note: Les prescriptions et mouvements d'inventaire sont déjà traités immédiatement ci-dessus
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            // Logique de rafraîchissement intelligente pour les autres types (pas les prescriptions/mouvements)
            if (payload.type === 'stock_update' || payload.type === 'inventory_update') {
              if (process.env.NODE_ENV === 'development') {
                console.log("🔄 [Realtime] Rafraîchissement Inventaire/Stats");
              }
              queryClient.invalidateQueries({ queryKey: ['inventory'] });
              queryClient.invalidateQueries({ queryKey: ['pharmacy', 'stats'] });
              queryClient.invalidateQueries({ queryKey: ['pharmacy', 'alerts'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            }
            
            if (payload.type === 'order_update') {
               if (process.env.NODE_ENV === 'development') {
                 console.log("🔄 [Realtime] Rafraîchissement Commandes");
               }
               queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders'] });
               queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            }
            
            // Invalider le dashboard pour tous les autres types de mises à jour
            if (payload.type === 'patient_update' || payload.type === 'appointment_update' || 
                payload.type === 'consultation_update' || payload.type === 'document_update') {
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            }
        }, 200); // Réduit à 200ms pour plus de fluidité (les notifications prioritaires sont déjà traitées immédiatement)
      });

    } catch (error) {
      console.error("🚨 [Realtime] Erreur critique d'initialisation :", error);
    }

    return () => {
      if (subscription) {
        // subscription.delete();
      }
      if (debounceRef.current) {
          clearTimeout(debounceRef.current);
      }
    };
  }, [queryClient]);

  // 2. Canaux de notifications partagées (pour tous les utilisateurs)
  useEffect(() => {
    if (!user?.id || !transmitRef.current) return;

    const userId = user.id;
    
    // Liste des canaux partagés à écouter
    const sharedChannels = [
      'shared_notifications', // Canal global pour toutes les notifications partagées
      'shared_appointment_notifications', // Notifications de rendez-vous
      'shared_patient_notifications', // Notifications de patients
      'shared_pharmacy_notifications', // Notifications de pharmacie
      'shared_clinical_notifications', // Notifications cliniques
      'shared_document_notifications', // Notifications de documents
      'shared_finance_notifications', // Notifications financières
      'shared_billing_notifications', // Notifications de facturation
    ];

    const subscriptions = [];

    sharedChannels.forEach((channelName) => {
      try {
        const subscription = transmitRef.current.subscription(channelName);
        
        subscription.create()
          .then(() => {
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ [Realtime] Connecté au canal partagé : ${channelName}`);
            }
          })
          .catch(err => {
            if (process.env.NODE_ENV === 'development') {
              console.error(`❌ [Realtime] Erreur abonnement ${channelName} :`, err);
            }
          });

        subscription.onMessage((data) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`📨 [Realtime] Notification partagée reçue (${channelName}) :`, data);
          }
          
          const payload = typeof data === 'string' ? JSON.parse(data) : data;

          // Vérifier si cette notification concerne cet utilisateur
          const sharedWith = payload.sharedWith || [];
          if (!sharedWith.includes(userId)) {
            // Cette notification ne concerne pas cet utilisateur, l'ignorer
            return;
          }

          // Si c'est une mise à jour de notification existante
          if (payload.type === 'update' && payload.notificationId) {
            // Invalider les queries pour recharger depuis le backend (source de vérité unique)
            queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
            return;
          }

          // Nouvelle notification partagée reçue en temps réel
          if (payload.title && payload.message) {
            // Afficher une notification toast
            const notificationType = payload.type || 'info';
            showToastRef.current(`${payload.title}: ${payload.message}`, notificationType);

            // Invalider les queries pour recharger depuis le backend (source de vérité unique)
            queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });

            // Invalider les données liées selon la catégorie
            if (payload.category === 'appointment') {
              queryClient.invalidateQueries({ queryKey: ['appointments'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            } else if (payload.category === 'patient') {
              queryClient.invalidateQueries({ queryKey: ['patients'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            } else if (payload.category === 'pharmacy') {
              queryClient.invalidateQueries({ queryKey: ['pharmacy'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            } else if (payload.category === 'clinical') {
              queryClient.invalidateQueries({ queryKey: ['consultations'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            } else if (payload.category === 'document') {
              queryClient.invalidateQueries({ queryKey: ['documents'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            } else if (payload.category === 'finance' || payload.category === 'billing') {
              queryClient.invalidateQueries({ queryKey: ['finance'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            }
          }
        });

        subscriptions.push(subscription);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`🚨 [Realtime] Erreur abonnement canal partagé ${channelName} :`, error);
        }
      }
    });

    return () => {
      // Nettoyage des subscriptions
      subscriptions.forEach(sub => {
        // Ne pas supprimer les subscriptions ici car elles peuvent être réutilisées
      });
    };
  }, [user?.id, queryClient]);
};