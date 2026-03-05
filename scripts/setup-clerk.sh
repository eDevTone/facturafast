#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 FacturaFast - Clerk Setup Helper"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Ve a: https://clerk.com"
echo "2. Create Application → Name: FacturaFast"
echo "3. Copia las keys del Dashboard → API Keys"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Publishable Key (pk_test_...): " PUBLISHABLE_KEY
read -p "Secret Key (sk_test_...): " SECRET_KEY

if [ -z "$PUBLISHABLE_KEY" ] || [ -z "$SECRET_KEY" ]; then
  echo "❌ Keys vacías. Abortando."
  exit 1
fi

# Update .env.local
sed -i "s|# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=.*|NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$PUBLISHABLE_KEY|" .env.local
sed -i "s|# CLERK_SECRET_KEY=.*|CLERK_SECRET_KEY=$SECRET_KEY|" .env.local

echo ""
echo "✅ Keys configuradas en .env.local"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Restart el servidor:"
echo "   npm run dev"
echo ""
echo "📍 Luego visita:"
echo "   http://localhost:3000/sign-in"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
