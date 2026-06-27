#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Plants Deployment Verification Script               ║${NC}"
echo -e "${BLUE}║     Test connectivity and configuration after deploy      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Track results
PASSED=0
FAILED=0

check_url() {
  local name=$1
  local url=$2

  echo -n "  Checking ${name}... "

  if curl -s -f "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC}"
    ((FAILED++))
  fi
}

check_json() {
  local name=$1
  local url=$2
  local key=$3

  echo -n "  Checking ${name}... "

  response=$(curl -s -f "$url" 2>/dev/null || echo "{}")

  if echo "$response" | grep -q "$key"; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} (expected key: $key)"
    ((FAILED++))
  fi
}

echo -e "${BLUE}Connectivity Checks${NC}"
echo ""

# Get URLs from user
read -p "$(echo -e ${YELLOW}Enter Render API URL${NC} (e.g., https://plants-api.onrender.com): " render_url
read -p "$(echo -e ${YELLOW}Enter Vercel Web URL${NC} (e.g., https://plants.vercel.app): " vercel_url

echo ""
check_url "API health endpoint" "$render_url/health"
check_json "API /health returns {\"status\":\"ok\"}" "$render_url/health" "status"
check_url "Frontend homepage" "$vercel_url"

echo ""
echo -e "${BLUE}API Feature Checks${NC}"
echo ""

read -p "$(echo -e ${YELLOW}API health check passed?${NC} [y/n]: " health_ok
if [[ "$health_ok" =~ ^[Yy]$ ]]; then
  ((PASSED++))
  echo -e "  ${GREEN}✓${NC} API is running"
else
  ((FAILED++))
  echo -e "  ${RED}✗${NC} API is not healthy"
  echo "    → Check Render logs for startup errors"
fi

echo ""
echo -e "${BLUE}Manual Verification Steps${NC}"
echo ""
echo "1. ${YELLOW}Startup Banners${NC}"
echo "   → Check Render logs for startup banner with service status"
echo "   → Should show: Sentry, Storage (S3)"
echo "   → Visit: https://dashboard.render.com → plants-api → Logs"
echo ""

echo "2. ${YELLOW}Create a Plant${NC}"
echo "   → Visit: $vercel_url/dashboard"
echo "   → Click 'Add Plant' and submit a plant"
echo "   → Plant should appear in grid"
echo ""

echo "3. ${YELLOW}Upload a Photo${NC}"
echo "   → Click on the plant you just created"
echo "   → Upload an image"
echo "   → Photo should appear in gallery"
echo "   → Verify in Cloudflare R2: https://dash.cloudflare.com → R2"
echo ""

echo "4. ${YELLOW}Test Reminders${NC}"
echo "   → Go to plant detail page"
echo "   → Scroll to care history"
echo "   → Log a watering with a past date"
echo "   → Check homepage → \"Needs attention\" should show the plant"
echo ""

echo "5. ${YELLOW}Test Auth (If Clerk enabled)${NC}"
echo "   → Try signing out (if signed in)"
echo "   → Sign in with Clerk modal"
echo "   → Verify you can still see your plants"
echo ""

echo "6. ${YELLOW}Cold Start Test${NC}"
echo "   → Wait 15+ minutes"
echo "   → Reload the app"
echo "   → First request should take ~30s (API waking up)"
echo "   → This is normal for Render free tier"
echo ""

echo -e "${BLUE}Troubleshooting${NC}"
echo ""
echo "If API health check fails:"
echo "  → Check DATABASE_URL is correct on Render"
echo "  → Check S3 credentials (ACCOUNT_ID, KEYS)"
echo "  → View Render logs for specific errors"
echo ""

echo "If frontend doesn't load:"
echo "  → Check API_INTERNAL_URL on Vercel matches Render API URL"
echo "  → Check CORS_ORIGINS on Render matches Vercel URL"
echo "  → Wait 1 min and check Render API redeploy finished"
echo ""

echo "If photos don't upload:"
echo "  → Verify R2 bucket name matches S3_BUCKET on Render"
echo "  → Verify R2 credentials are correct"
echo "  → Check Render logs for S3 errors"
echo ""

echo -e "${BLUE}Summary${NC}"
echo ""
echo -e "Automatic checks: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
echo ""

if [[ $FAILED -eq 0 ]]; then
  echo -e "${GREEN}✓ All automatic checks passed!${NC}"
  echo "  Now complete the manual verification steps above."
else
  echo -e "${RED}✗ Some checks failed. See troubleshooting above.${NC}"
fi

echo ""

