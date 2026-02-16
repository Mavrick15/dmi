#!/bin/bash

# Script de test pour le rate limiting
# Usage: ./scripts/test-rate-limiting.sh [TOKEN] [ENDPOINT] [MAX_REQUESTS]

TOKEN=${1:-""}
ENDPOINT=${2:-"/pharmacy/inventory"}
MAX_REQUESTS=${3:-100}
BASE_URL=${BASE_URL:-"http://localhost:3333/api/v1"}

if [ -z "$TOKEN" ]; then
  echo "❌ Erreur: Token d'authentification requis"
  echo "Usage: ./scripts/test-rate-limiting.sh <TOKEN> [ENDPOINT] [MAX_REQUESTS]"
  exit 1
fi

echo "🧪 Test de Rate Limiting"
echo "========================"
echo ""
echo "Endpoint: $ENDPOINT"
echo "Limite: $MAX_REQUESTS requêtes/minute"
echo ""

# Créer un fichier temporaire pour les résultats
TEMP_FILE=$(mktemp)
SUCCESS_COUNT=0
RATE_LIMIT_COUNT=0
ERROR_COUNT=0

echo "Envoi de $((MAX_REQUESTS + 1)) requêtes..."
echo ""

# Envoyer les requêtes en parallèle
for i in $(seq 1 $((MAX_REQUESTS + 1))); do
  (
    response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$ENDPOINT" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    
    echo "$i:$http_code" >> "$TEMP_FILE"
  ) &
  
  # Limiter le nombre de processus parallèles
  if (( i % 10 == 0 )); then
    wait
  fi
done

wait

echo "Analyse des résultats..."
echo ""

# Analyser les résultats
while IFS=: read -r request_num http_code; do
  if [ "$http_code" -eq 200 ]; then
    ((SUCCESS_COUNT++))
  elif [ "$http_code" -eq 429 ]; then
    ((RATE_LIMIT_COUNT++))
    if [ -z "$FIRST_429" ]; then
      FIRST_429=$request_num
    fi
  else
    ((ERROR_COUNT++))
  fi
done < "$TEMP_FILE"

# Afficher les résultats
echo "📊 Résultats:"
echo "  ✅ Succès (200): $SUCCESS_COUNT"
echo "  ⚠️  Rate Limit (429): $RATE_LIMIT_COUNT"
echo "  ❌ Autres erreurs: $ERROR_COUNT"
echo ""

# Vérifier les résultats
if [ "$RATE_LIMIT_COUNT" -gt 0 ]; then
  echo "✅ Rate limiting fonctionne !"
  echo "  Première erreur 429 à la requête #$FIRST_429"
  
  if [ "$FIRST_429" -le $((MAX_REQUESTS + 1)) ] && [ "$FIRST_429" -gt "$MAX_REQUESTS" ]; then
    echo "  ✅ La limite est respectée (première 429 après $MAX_REQUESTS requêtes)"
  else
    echo "  ⚠️  La limite pourrait ne pas être exactement à $MAX_REQUESTS"
  fi
else
  echo "⚠️  Aucune erreur 429 détectée"
  echo "  Vérifiez que le rate limiting est activé pour cet endpoint"
fi

# Nettoyer
rm -f "$TEMP_FILE"

echo ""
echo "✅ Test de rate limiting terminé"

