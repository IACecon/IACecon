#!/bin/bash
echo "1. Bajando cambios de Google Apps Script (CLASP)..."
npx @google/clasp pull

echo "2. Preparando archivos para GitHub..."
git add .

# Usamos la fecha y hora según tu protocolo YYYY/MM/DD HH:MM:SS
AHORA=$(date +"%Y/%m/%d %H:%M:%S")
git commit -m "Sincronización automática: $AHORA"

echo "3. Subiendo a GitHub..."
git push origin main

echo "✅ ¡Todo sincronizado! Gemini ya puede ver los cambios en IACecon."
