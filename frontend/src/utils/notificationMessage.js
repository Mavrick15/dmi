/**
 * Utilitaires pour formater les messages de notification.
 * Enlève les [ ] et " " des tableaux bruts, présente les allergies avec style.
 */

/**
 * Remplace les tableaux JSON bruts (ex: ["Arrachide","Mangoust"]) par une liste lisible (ex: Arrachide, Mangoust)
 * @param {string} message - Message potentiellement contenant du JSON brut
 * @returns {string} Message formaté
 */
export function formatNotificationMessage(message) {
  if (!message || typeof message !== 'string') return message || '';
  return message.replace(/\[[\s\S]*?\]/g, (match) => {
    try {
      const arr = JSON.parse(match);
      if (!Array.isArray(arr)) return match;
      const items = arr
        .map((a) => String(a).replace(/^["']|["']$/g, '').trim())
        .filter(Boolean);
      return items.length > 0 ? items.join(', ') : match;
    } catch {
      return match
        .replace(/["'\[\]]/g, '')
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  });
}

/**
 * Parse un message de notification : extrait le texte propre et les items des tableaux (ex: allergies)
 * @param {string} message - Message brut
 * @returns {{ cleanMessage: string, extractedItems: string[] }}
 */
export function parseNotificationMessage(message) {
  if (!message || typeof message !== 'string') {
    return { cleanMessage: '', extractedItems: [] };
  }
  let cleanMessage = message;
  const extractedItems = [];

  cleanMessage = cleanMessage.replace(/\[[\s\S]*?\]/g, (match) => {
    try {
      const arr = JSON.parse(match);
      if (!Array.isArray(arr)) return match;
      const items = arr
        .map((a) => String(a).replace(/^["']|["']$/g, '').trim())
        .filter(Boolean);
      extractedItems.push(...items);
      return items.length > 0 ? items.join(', ') : '';
    } catch {
      const fallback = match
        .replace(/["'\[\]]/g, '')
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s+/g, ' ')
        .trim();
      if (fallback) extractedItems.push(fallback);
      return fallback;
    }
  });

  // Nettoyer les ": " en double ou espaces superflus
  cleanMessage = cleanMessage.replace(/\s*:\s*$/g, '').replace(/\s{2,}/g, ' ').trim();

  return { cleanMessage, extractedItems };
}

/**
 * Normalise une valeur allergies (string JSON, array, string brut) en liste de chaînes propres pour affichage en badges.
 * Gère les cas : '["Arrachide","Mangoust"]', ["Arrachide","Mangoust"], ['["Arrachide","Mangoust"]'], etc.
 * @param {string|string[]|any} input
 * @returns {string[]}
 */
export function normalizeAllergiesList(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    const result = [];
    for (const item of input) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            result.push(...parsed.map((a) => String(a).replace(/^["']|["']$/g, '').trim()).filter(Boolean));
          } else {
            result.push(trimmed.replace(/^["\[\]\s]+|["\[\]\s]+$/g, '').trim());
          }
        } catch {
          result.push(trimmed.replace(/^["\[\]\s]+|["\[\]\s]+$/g, '').trim());
        }
      } else if (item && typeof item === 'object' && item.name) {
        result.push(String(item.name).trim());
      } else if (item != null) {
        result.push(String(item).replace(/^["\[\]\s]+|["\[\]\s]+$/g, '').trim());
      }
    }
    return result.filter(Boolean);
  }
  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.map((a) => String(a).replace(/^["']|["']$/g, '').trim()).filter(Boolean);
      }
      return [s.replace(/^["\[\]\s]+|["\[\]\s]+$/g, '').trim()];
    } catch {
      return s.split(/[,;]| et /).map((a) => a.replace(/^["\[\]\s]+|["\[\]\s]+$/g, '').trim()).filter(Boolean);
    }
  }
  return [];
}
