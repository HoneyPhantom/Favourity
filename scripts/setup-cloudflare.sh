#!/usr/bin/env bash
set -e

echo "================================================================="
echo "⭐️ Favourity - Automated Cloudflare Remote Provisioning & Deploy"
echo "================================================================="

# Ensure Node & Wrangler are available
if ! command -v npx &> /dev/null; then
  if [ -x "/opt/homebrew/bin/npx" ]; then
    export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
  else
    echo "❌ Error: npx is not found. Please ensure Node.js is installed."
    exit 1
  fi
fi

# 1. Check Authentication Status
echo ""
echo "▶ Checking Cloudflare Wrangler authentication..."
if ! npx wrangler whoami &> /dev/null; then
  echo "⚠️ Wrangler is not authenticated with your Cloudflare account."
  echo "Opening browser to authenticate Wrangler via OAuth..."
  npx wrangler login
fi

echo "✅ Wrangler is authenticated successfully!"

# 2. Provision Cloudflare D1 Database
echo ""
echo "▶ Step 1: Provisioning Cloudflare D1 Database ('favourity-db')..."
D1_OUTPUT=$(npx wrangler d1 create favourity-db 2>&1 || true)
echo "$D1_OUTPUT"

# Extract database_id using regex or fallback to existing
D1_ID=$(echo "$D1_OUTPUT" | grep -o 'database_id = "[^"]*"' | head -n 1 | cut -d'"' -f2)

if [ -z "$D1_ID" ]; then
  # Check if database already exists and query info
  echo "Checking existing D1 databases..."
  D1_LIST=$(npx wrangler d1 list --json 2>/dev/null || echo "[]")
  D1_ID=$(echo "$D1_LIST" | grep -B 2 -A 5 '"name": "favourity-db"' | grep -o '"uuid": "[^"]*"' | head -n 1 | cut -d'"' -f4 || true)
fi

if [ -n "$D1_ID" ]; then
  echo "✅ Captured D1 Database ID: $D1_ID"
else
  echo "⚠️ Could not automatically parse D1 ID. Please inspect wrangler d1 list."
fi

# 3. Provision Cloudflare KV Namespace
echo ""
echo "▶ Step 2: Provisioning Cloudflare KV Namespace ('FAVOURITY_KV')..."
KV_OUTPUT=$(npx wrangler kv:namespace create FAVOURITY_KV 2>&1 || true)
echo "$KV_OUTPUT"

KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | head -n 1 | cut -d'"' -f2)

if [ -z "$KV_ID" ]; then
  echo "Checking existing KV namespaces..."
  KV_LIST=$(npx wrangler kv:namespace list 2>/dev/null || echo "[]")
  KV_ID=$(echo "$KV_LIST" | grep -B 2 -A 5 '"title": "favourity-FAVOURITY_KV"' | grep -o '"id": "[^"]*"' | head -n 1 | cut -d'"' -f4 || true)
fi

if [ -n "$KV_ID" ]; then
  echo "✅ Captured KV Namespace ID: $KV_ID"
else
  echo "⚠️ Could not automatically parse KV ID. Please inspect wrangler kv:namespace list."
fi

# 4. Update wrangler.toml with real provisioned IDs if found
if [ -n "$D1_ID" ] || [ -n "$KV_ID" ]; then
  echo ""
  echo "▶ Step 3: Updating wrangler.toml with real Cloudflare IDs..."
  node -e "
    const fs = require('fs');
    let toml = fs.readFileSync('wrangler.toml', 'utf8');
    const d1Id = '$D1_ID';
    const kvId = '$KV_ID';
    if (d1Id) {
      toml = toml.replace(/database_id\s*=\s*\"[^\"]*\"/, 'database_id = \"' + d1Id + '\"');
    }
    if (kvId) {
      toml = toml.replace(/id\s*=\s*\"[^\"]*\"/, 'id = \"' + kvId + '\"');
    }
    fs.writeFileSync('wrangler.toml', toml, 'utf8');
  "
  echo "✅ wrangler.toml updated."
fi

# 5. Run Database Migrations on Remote D1
echo ""
echo "▶ Step 4: Executing D1 schema migrations on remote database..."
npx wrangler d1 execute favourity-db --remote --file=./migrations/0001_initial_schema.sql --yes
echo "✅ Remote migrations applied."

# 6. Build the Frontend
echo ""
echo "▶ Step 5: Building frontend with Vite and TypeScript..."
npm run build
echo "✅ Build completed successfully."

# 7. Deploy Worker & Static Assets
echo ""
echo "▶ Step 6: Deploying Worker and Static Assets to Cloudflare..."
npx wrangler deploy

echo ""
echo "================================================================="
echo "🎉 DEPLOYMENT COMPLETE! Favourity is live on Cloudflare!"
echo "================================================================="
