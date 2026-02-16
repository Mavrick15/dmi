#!/usr/bin/env bash
# Ouvre le port Redis (6379) sur la machine où ce script est exécuté.
# À lancer sur le serveur Redis (ex. 10.0.0.1) ou sur la machine qui applique le pare-feu.
# Nécessite les droits root (sudo).

set -e
REDIS_PORT=6379

if command -v firewall-cmd &>/dev/null; then
  echo "Pare-feu: firewalld détecté."
  sudo firewall-cmd --state 2>/dev/null && true || { echo "firewalld n'est pas actif."; exit 0; }
  sudo firewall-cmd --permanent --add-port=${REDIS_PORT}/tcp
  sudo firewall-cmd --reload
  echo "Port ${REDIS_PORT}/tcp ouvert (firewalld)."
elif command -v ufw &>/dev/null; then
  echo "Pare-feu: ufw détecté."
  sudo ufw allow ${REDIS_PORT}/tcp comment 'Redis OpenClinic'
  sudo ufw status | head -20
  echo "Port ${REDIS_PORT}/tcp ouvert (ufw). Pensez à faire: sudo ufw reload"
else
  echo "Aucun pare-feu (firewalld/ufw) détecté. Si vous utilisez iptables, exécutez manuellement:"
  echo "  iptables -A INPUT -p tcp --dport ${REDIS_PORT} -j ACCEPT"
  exit 1
fi
