#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  PAIRA — Production Deployment Script
#
#  Prerequisites on the server:
#    • Git
#    • Docker ≥ 24  (with the compose plugin — "docker compose", not "docker-compose")
#    • .env.prod file filled in (copy from .env.prod.example)
#
#  First-time setup:
#    git clone <repo> && cd PAIRA
#    cp .env.prod.example .env.prod && nano .env.prod   # fill in real values
#    chmod +x deploy.sh && ./deploy.sh
#
#  Subsequent deploys:
#    ./deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[PAIRA]${NC} $*"; }
warn()    { echo -e "${YELLOW}[PAIRA]${NC} $*"; }
error()   { echo -e "${RED}[PAIRA]${NC} $*" >&2; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || error "Docker is not installed."
docker compose version >/dev/null 2>&1 || error "Docker Compose plugin is not installed."

[[ -f "$ENV_FILE" ]] || error ".env.prod not found. Copy .env.prod.example and fill in your values."

# Warn if any placeholder value was not replaced
if grep -qE "(change_me|yourdomain\.com|your-google|your-aws|your-s3|your-turn)" "$ENV_FILE"; then
    warn "⚠  $ENV_FILE still contains placeholder values. Deploy may fail."
fi

# ── Pull latest code ──────────────────────────────────────────────────────────
if [[ -d ".git" ]]; then
    info "Pulling latest code from origin..."
    git pull --ff-only
fi

# ── Build images ──────────────────────────────────────────────────────────────
info "Building Docker images (no cache for clean production build)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache

# ── Stop & remove old containers (keep volumes) ───────────────────────────────
info "Stopping existing containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --remove-orphans

# ── Start all services ────────────────────────────────────────────────────────
info "Starting PAIRA in production mode..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# ── Health check ──────────────────────────────────────────────────────────────
info "Waiting for services to become healthy..."
sleep 8

SERVICES=("db" "redis" "api" "frontend")
ALL_OK=true
for svc in "${SERVICES[@]}"; do
    STATUS=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps --format json "$svc" 2>/dev/null \
             | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health','running') if isinstance(d,dict) else d[0].get('Health','running'))" 2>/dev/null || echo "unknown")
    if [[ "$STATUS" == "unhealthy" ]]; then
        warn "  ✗ $svc — $STATUS"
        ALL_OK=false
    else
        info "  ✓ $svc — ${STATUS:-running}"
    fi
done

# ── Print summary ─────────────────────────────────────────────────────────────
echo ""
if $ALL_OK; then
    info "🚀 PAIRA is live!"
    ORIGIN=$(grep -E '^FRONTEND_ORIGIN=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')
    info "   Frontend : ${ORIGIN:-http://<your-server-ip>}"
    info "   API docs : ${ORIGIN:-http://<your-server-ip>}/api/docs"
else
    warn "Some services may not be healthy yet. Check logs:"
    warn "  docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f"
fi

# ── Clean up dangling images ──────────────────────────────────────────────────
info "Cleaning up dangling Docker images..."
docker image prune -f >/dev/null
