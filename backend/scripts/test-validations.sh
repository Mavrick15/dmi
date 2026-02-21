#!/bin/bash

# Script de test pour les validations de recherche
# Usage: ./scripts/test-validations.sh [TOKEN]

TOKEN=${1:-""}
BASE_URL=${BASE_URL:-"http://localhost:3333/api/v1"}

if [ -z "$TOKEN" ]; then
  echo "❌ Erreur: Token d'authentification requis"
  echo "Usage: ./scripts/test-validations.sh <TOKEN>"
  exit 1
fi

echo "🧪 Tests de Validation de Recherche"
echo "===================================="
echo ""

# Fonction pour tester une validation
test_validation() {
  local endpoint=$1
  local search_param=$2
  local expected_status=$3
  local description=$4
  
  echo "Test: $description"
  echo "  Endpoint: $endpoint"
  echo "  Paramètre: search=$search_param"
  
  response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint?search=$search_param" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -eq "$expected_status" ]; then
    echo "  ✅ Succès: Code $http_code (attendu $expected_status)"
    if [ "$expected_status" -eq 400 ]; then
      if echo "$body" | grep -q "recherche"; then
        echo "  ✅ Message d'erreur contient 'recherche'"
      else
        echo "  ⚠️  Message d'erreur ne contient pas 'recherche'"
      fi
    fi
  else
    echo "  ❌ Échec: Code $http_code (attendu $expected_status)"
    echo "  Réponse: $body"
  fi
  echo ""
}

# Tests pour PharmacyController
echo "📦 Tests PharmacyController.inventory"
echo "-----------------------------------"
test_validation "/pharmacy/inventory" "a" 400 "Recherche trop courte (< 2 caractères)"
test_validation "/pharmacy/inventory" "$(printf 'a%.0s' {1..101})" 400 "Recherche trop longue (> 100 caractères)"
test_validation "/pharmacy/inventory" "paracetamol" 200 "Recherche valide (2-100 caractères)"
test_validation "/pharmacy/inventory" "  paracetamol  " 200 "Recherche avec espaces (trim automatique)"

# Tests pour DocumentsController
echo "📄 Tests DocumentsController.indexAll"
echo "-----------------------------------"
test_validation "/documents" "a" 400 "Recherche trop courte (< 2 caractères)"
test_validation "/documents" "$(printf 'a%.0s' {1..101})" 400 "Recherche trop longue (> 100 caractères)"
test_validation "/documents" "document" 200 "Recherche valide (2-100 caractères)"

# Tests pour EtablissementsController
echo "🏢 Tests EtablissementsController.index"
echo "-----------------------------------"
test_validation "/establishments" "a" 400 "Recherche trop courte (< 2 caractères)"
test_validation "/establishments" "$(printf 'a%.0s' {1..101})" 400 "Recherche trop longue (> 100 caractères)"
test_validation "/establishments" "hopital" 200 "Recherche valide (2-100 caractères)"

# Tests pour UsersController
echo "👥 Tests UsersController.index"
echo "-----------------------------------"
test_validation "/users" "a" 400 "Recherche trop courte (< 2 caractères)"
test_validation "/users" "$(printf 'a%.0s' {1..101})" 400 "Recherche trop longue (> 100 caractères)"
test_validation "/users" "docteur_clinique" 200 "Recherche valide (2-100 caractères)"

# Tests pour SuppliersController
echo "🚚 Tests SuppliersController.index"
echo "-----------------------------------"
test_validation "/suppliers" "a" 400 "Recherche trop courte (< 2 caractères)"
test_validation "/suppliers" "$(printf 'a%.0s' {1..101})" 400 "Recherche trop longue (> 100 caractères)"
test_validation "/suppliers" "fournisseur" 200 "Recherche valide (2-100 caractères)"

echo "✅ Tests de validation terminés"
echo ""

