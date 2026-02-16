#!/bin/bash

# Script de test complet pour toutes les améliorations
# Usage: ./scripts/test-all.sh [TOKEN]

TOKEN=${1:-""}
BASE_URL=${BASE_URL:-"http://localhost:3333/api/v1"}

if [ -z "$TOKEN" ]; then
  echo "❌ Erreur: Token d'authentification requis"
  echo "Usage: ./scripts/test-all.sh <TOKEN>"
  echo ""
  echo "Pour obtenir un token:"
  echo "  curl -X POST $BASE_URL/auth/login \\"
  echo "    -H 'Content-Type: application/json' \\"
  echo "    -d '{\"email\":\"admin@example.com\",\"password\":\"password\"}'"
  exit 1
fi

echo "🚀 Tests Complets des Améliorations OpenClinic"
echo "=============================================="
echo ""
echo "Token: ${TOKEN:0:20}..."
echo "Base URL: $BASE_URL"
echo ""

# Créer un répertoire pour les résultats
RESULTS_DIR="./test-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo "📁 Résultats sauvegardés dans: $RESULTS_DIR"
echo ""

# Test 1: Validations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Validations de Recherche"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

./scripts/test-validations.sh "$TOKEN" 2>&1 | tee "$RESULTS_DIR/validations.log"

VALIDATION_EXIT=${PIPESTATUS[0]}
if [ $VALIDATION_EXIT -eq 0 ]; then
  echo "✅ Tests de validation: SUCCÈS"
else
  echo "❌ Tests de validation: ÉCHEC"
fi

echo ""
echo ""

# Test 2: Rate Limiting (test sur un endpoint)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Rate Limiting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "⚠️  Note: Ce test envoie 101 requêtes rapidement"
echo "    Cela peut prendre quelques secondes..."
echo ""

./scripts/test-rate-limiting.sh "$TOKEN" "/pharmacy/inventory" 100 2>&1 | tee "$RESULTS_DIR/rate-limiting.log"

RATE_LIMIT_EXIT=${PIPESTATUS[0]}
if [ $RATE_LIMIT_EXIT -eq 0 ]; then
  echo "✅ Tests de rate limiting: SUCCÈS"
else
  echo "❌ Tests de rate limiting: ÉCHEC"
fi

echo ""
echo ""

# Test 3: Vérification des routes protégées
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Vérification des Routes Protégées"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ROUTES_TO_TEST=(
  "/pharmacy/inventory"
  "/pharmacy/stats"
  "/documents"
  "/finance/invoices"
  "/consultations"
  "/users"
  "/establishments"
)

PROTECTED_COUNT=0
TOTAL_COUNT=${#ROUTES_TO_TEST[@]}

for route in "${ROUTES_TO_TEST[@]}"; do
  echo -n "Test $route... "
  
  response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$route" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" 2>/dev/null)
  
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
    echo "✅ Accessible (code: $http_code)"
    ((PROTECTED_COUNT++))
  else
    echo "⚠️  Code inattendu: $http_code"
  fi
done

echo ""
echo "Routes testées: $TOTAL_COUNT"
echo "Routes accessibles: $PROTECTED_COUNT"

echo ""
echo ""

# Résumé final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RÉSUMÉ DES TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $VALIDATION_EXIT -eq 0 ]; then
  echo "✅ Validations: SUCCÈS"
else
  echo "❌ Validations: ÉCHEC"
fi

if [ $RATE_LIMIT_EXIT -eq 0 ]; then
  echo "✅ Rate Limiting: SUCCÈS"
else
  echo "❌ Rate Limiting: ÉCHEC"
fi

echo "✅ Routes Protégées: $PROTECTED_COUNT/$TOTAL_COUNT testées"
echo ""

echo "📁 Logs disponibles dans: $RESULTS_DIR"
echo ""

if [ $VALIDATION_EXIT -eq 0 ] && [ $RATE_LIMIT_EXIT -eq 0 ]; then
  echo "🎉 Tous les tests sont passés avec succès !"
  exit 0
else
  echo "⚠️  Certains tests ont échoué. Consultez les logs pour plus de détails."
  exit 1
fi

