#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Plants Deployment Setup Helper                   ║${NC}"
echo -e "${BLUE}║     Collect and organize credentials for deployment       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create a temporary file to store collected vars
VARS_FILE="/tmp/plants-deploy-vars.txt"
> "$VARS_FILE"

# Helper function to prompt and store
prompt_var() {
  local var_name=$1
  local description=$2
  local is_secret=${3:-false}
  local value=""

  while [[ -z "$value" ]]; do
    if [[ "$is_secret" == "true" ]]; then
      read -sp "$(echo -e ${YELLOW}✓ Enter ${var_name}:${NC} )" value
      echo ""
    else
      read -p "$(echo -e ${YELLOW}✓ Enter ${var_name}:${NC} )" value
    fi

    if [[ -z "$value" ]]; then
      echo -e "${RED}  ⚠ This field is required${NC}"
    fi
  done

  echo "$var_name=$value" >> "$VARS_FILE"
  echo -e "${GREEN}  ✓ Saved${NC}"
  echo ""
}

echo -e "${BLUE}Phase 1: Neon PostgreSQL${NC}"
echo "  Get your connection string from: https://console.neon.tech"
echo "  It looks like: postgresql://user:password@host/plants"
echo ""
prompt_var "NEON_CONNECTION_STRING" "PostgreSQL connection string" true

echo -e "${BLUE}Phase 2: Cloudflare R2${NC}"
echo "  Get credentials from: https://dash.cloudflare.com → R2 → API Tokens"
echo ""
prompt_var "R2_ACCOUNT_ID" "Cloudflare Account ID" false
prompt_var "R2_ACCESS_KEY_ID" "R2 Access Key ID" false
prompt_var "R2_SECRET_ACCESS_KEY" "R2 Secret Access Key" true
prompt_var "R2_BUCKET_NAME" "R2 bucket name (default: plants-photos)" false

echo -e "${BLUE}Phase 3: Sentry${NC}"
echo "  Get credentials from: https://sentry.io → Settings → Projects"
echo ""
prompt_var "SENTRY_DSN_API" "Sentry DSN for plants-api project" false
prompt_var "SENTRY_DSN_WEB_CLIENT" "Sentry DSN for plants-web (client-side)" false
prompt_var "SENTRY_DSN_WEB_SERVER" "Sentry DSN for plants-web (server-side, can be same)" false
prompt_var "SENTRY_ORG" "Sentry organization slug" false
prompt_var "SENTRY_AUTH_TOKEN" "Sentry Auth Token" true
echo "  Note: SENTRY_PROJECT will be 'plants-web' and 'plants-api'"
echo ""

echo -e "${BLUE}Phase 4: Clerk${NC}"
echo "  Get credentials from: https://dashboard.clerk.com → API Keys"
echo ""
prompt_var "CLERK_PUBLISHABLE_KEY" "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_live_...)" false
prompt_var "CLERK_SECRET_KEY" "CLERK_SECRET_KEY (sk_live_...)" true

echo -e "${BLUE}Phase 5: Deployment URLs${NC}"
echo "  (Leave blank for now; you'll set these after deploying Render & Vercel)"
echo ""
read -p "$(echo -e ${YELLOW}✓ Will you have a custom domain? (y/n) [n]:${NC} )" -n 1 -r custom_domain
echo ""
if [[ ! $custom_domain =~ ^[Yy]$ ]]; then
  echo "  → Render API will be: https://plants-api.onrender.com"
  echo "  → Vercel Web will be: https://plants.vercel.app"
else
  read -p "$(echo -e ${YELLOW}✓ Enter your custom domain for Render API:${NC} )" render_domain
  read -p "$(echo -e ${YELLOW}✓ Enter your custom domain for Vercel Web:${NC} )" vercel_domain
  echo "RENDER_API_URL=$render_domain" >> "$VARS_FILE"
  echo "VERCEL_WEB_URL=$vercel_domain" >> "$VARS_FILE"
fi
echo ""

# Create summary file
SUMMARY_FILE="./plants-deployment-config.md"
cat > "$SUMMARY_FILE" << 'EOF'
# Plants Deployment Configuration

Use this file to paste environment variables into each platform.

---

## Render (Backend API)

Go to: https://render.com → plants-api service → Settings → Environment

Paste these environment variables:

```
DATABASE_URL=postgresql://user:password@host/plants
UPLOAD_DIR=/var/data/uploads
S3_BUCKET=plants-photos
S3_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=<YOUR_R2_ACCESS_KEY>
S3_SECRET_ACCESS_KEY=<YOUR_R2_SECRET_KEY>
SENTRY_DSN=<YOUR_SENTRY_DSN_API>
CORS_ORIGINS=https://plants.vercel.app
```

---

## Vercel (Frontend Web)

Go to: https://vercel.com → plants → Settings → Environment Variables

Paste these environment variables:

```
API_INTERNAL_URL=https://plants-api.onrender.com
NEXT_PUBLIC_API_URL=https://plants-api.onrender.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<YOUR_CLERK_PUBLISHABLE_KEY>
CLERK_SECRET_KEY=<YOUR_CLERK_SECRET_KEY>
NEXT_PUBLIC_SENTRY_DSN=<YOUR_SENTRY_DSN_WEB_CLIENT>
SENTRY_DSN=<YOUR_SENTRY_DSN_WEB_SERVER>
SENTRY_AUTH_TOKEN=<YOUR_SENTRY_AUTH_TOKEN>
SENTRY_ORG=<YOUR_SENTRY_ORG>
SENTRY_PROJECT=plants-web
```

---

## Credentials Reference

**Neon Database Connection String:**
```
NEON_CONNECTION_STRING
```

**Cloudflare R2:**
```
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
```

**Sentry:**
```
SENTRY_DSN_API
SENTRY_DSN_WEB_CLIENT
SENTRY_DSN_WEB_SERVER
SENTRY_ORG
SENTRY_AUTH_TOKEN
```

**Clerk:**
```
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
```

EOF

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  Setup Complete!                           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Collected credentials saved to: ${YELLOW}$VARS_FILE${NC}"
echo -e "Deployment config template: ${YELLOW}$SUMMARY_FILE${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Open ${YELLOW}$SUMMARY_FILE${NC}"
echo "  2. Fill in the placeholder values from ${YELLOW}$VARS_FILE${NC}"
echo "  3. Copy each section to the appropriate platform (Render/Vercel)"
echo "  4. Deploy on each platform"
echo "  5. Follow DEPLOYMENT_CHECKLIST.md for verification"
echo ""
echo -e "${YELLOW}Note: Keep $VARS_FILE secure!${NC} It contains sensitive credentials."
echo ""

# Show a preview of what was collected
echo -e "${BLUE}Credentials collected:${NC}"
echo "---"
cat "$VARS_FILE" | while IFS= read -r line; do
  key="${line%%=*}"
  value="${line#*=}"
  if [[ "$key" =~ (SECRET|TOKEN|PASSWORD|KEY) ]]; then
    echo "  $key=****(hidden)"
  else
    echo "  $key=$value"
  fi
done
echo "---"
echo ""

