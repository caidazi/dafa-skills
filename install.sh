#!/usr/bin/env bash
set -euo pipefail

REPO_RAW="${CAIDAZI_REPO_URL:-https://raw.githubusercontent.com/zhicepilot/caidazi-skills/main}"
MCP_SERVER_URL="https://mcp.zhicepilot.com"
MCP_SERVER_NAME="caidazi"

# ── colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { printf "${GREEN}[info]${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}[warn]${NC} %s\n" "$*"; }
error() { printf "${RED}[error]${NC} %s\n" "$*" >&2; exit 1; }

# ── args ──
API_KEY=""
PLATFORM=""
UPDATE_MODE=false

usage() {
  cat <<'EOF'
Usage: install.sh [options]

Options:
  --key KEY         API key (required)
  --platform PLAT   Target platform: claude-code (default: auto-detect)
  --update          Update existing installation
  --help            Show this help

Examples:
  curl -fsSL https://raw.githubusercontent.com/zhicepilot/caidazi-skills/main/install.sh | bash -s -- --key $CAIDAZI_API_KEY
  ./install.sh --key $CAIDAZI_API_KEY --platform claude-code
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --key)        API_KEY="$2"; shift 2 ;;
    --platform)   PLATFORM="$2"; shift 2 ;;
    --update)     UPDATE_MODE=true; shift ;;
    --help|-h)    usage ;;
    *)            error "Unknown option: $1" ;;
  esac
done

[[ -z "$API_KEY" ]] && error "--key is required. Pass --key <YOUR_API_KEY>"

# ── platform detection ──
detect_platform() {
  if [[ -d ".claude" ]]; then
    echo "claude-code"
  else
    echo ""
  fi
}

if [[ -z "$PLATFORM" ]]; then
  PLATFORM=$(detect_platform)
  if [[ -z "$PLATFORM" ]]; then
    warn "Could not auto-detect platform. Defaulting to claude-code."
    warn "Use --platform to specify explicitly."
    PLATFORM="claude-code"
  else
    info "Detected platform: $PLATFORM"
  fi
fi

if [[ "$PLATFORM" != "claude-code" ]]; then
  error "Platform '$PLATFORM' is not supported yet. Currently only 'claude-code' is available."
fi

# ── fetch manifest ──
info "Fetching manifest..."
MANIFEST=$(curl -fsSL "${REPO_RAW}/manifest.yaml") || error "Failed to fetch manifest.yaml"

# parse version
VERSION=$(echo "$MANIFEST" | grep '^version:' | head -1 | awk '{print $2}')
[[ -z "$VERSION" ]] && error "Could not parse version from manifest"

# parse skill list (between "skills:" and "required_mcp:")
SKILLS=()
parsing=false
while IFS= read -r line; do
  case "$line" in
    "skills:") parsing=true; continue ;;
    "required_mcp:"*) break ;;
  esac
  if $parsing; then
    # match lines like "    - caidazi-xxx"
    stripped=$(echo "$line" | sed -n 's/^ *- \(.*\)/\1/p')
    if [[ -n "$stripped" && "$stripped" != "included" ]]; then
      SKILLS+=("$stripped")
    fi
  fi
done <<< "$MANIFEST"

if [[ ${#SKILLS[@]} -eq 0 ]]; then
  error "No skills found in manifest"
fi

info "Version: $VERSION"
info "Skills: ${#SKILLS[@]}"

# ── fetch skills ──
SKILL_CONTENT=""
for skill in "${SKILLS[@]}"; do
  info "  Fetching ${skill}..."
  RAW=$(curl -fsSL "${REPO_RAW}/${skill}/SKILL.md") || error "Failed to fetch ${skill}/SKILL.md"

  # strip frontmatter (--- delimited block at the top)
  BODY=$(echo "$RAW" | awk '/^---$/{n++; next} n>=2')

  # extract skill name from original content for section header
  # use the directory name as fallback
  HEADER="# ${skill}"

  SKILL_CONTENT="${SKILL_CONTENT}
${HEADER}

${BODY}
"
done

# ── build CLAUDE.md block ──
BEGIN_MARK="<!-- caidazi-skills v${VERSION} begin -->"
END_MARK="<!-- caidazi-skills v${VERSION} end -->"

CLAUDE_BLOCK="${BEGIN_MARK}
# 财搭子 Skills
${SKILL_CONTENT}${END_MARK}"

# ── write CLAUDE.md ──
CLAUDE_FILE="CLAUDE.md"

if [[ -f "$CLAUDE_FILE" ]]; then
  # check for existing installation
  if grep -q '<!-- caidazi-skills' "$CLAUDE_FILE" 2>/dev/null; then
    EXISTING_VERSION=$(grep -o 'caidazi-skills v[^ ]* begin' "$CLAUDE_FILE" | head -1 | grep -o 'v[^ ]*')
    info "Found existing installation (${EXISTING_VERSION}), updating to ${VERSION}..."

    # write new block to a temp file, use awk to splice it in
    BLOCK_TMP=$(mktemp)
    printf "%s\n" "$CLAUDE_BLOCK" > "$BLOCK_TMP"
    TMP=$(mktemp)
    awk '
      /<!-- caidazi-skills.*begin -->/ {
        while ((getline line < "'"$BLOCK_TMP"'") > 0) print line
        skip=1; next
      }
      /<!-- caidazi-skills.*end -->/   { skip=0; next }
      !skip { print }
    ' "$CLAUDE_FILE" > "$TMP"
    mv "$TMP" "$CLAUDE_FILE"
    rm -f "$BLOCK_TMP"
  else
    # append
    info "Appending skills to ${CLAUDE_FILE}..."
    printf "\n%s\n" "$CLAUDE_BLOCK" >> "$CLAUDE_FILE"
  fi
else
  info "Creating ${CLAUDE_FILE}..."
  printf "%s\n" "$CLAUDE_BLOCK" > "$CLAUDE_FILE"
fi

info "Skills written to ${CLAUDE_FILE}"

# ── write MCP config ──
SETTINGS_FILE=".claude/settings.json"
mkdir -p .claude

MCP_ENTRY="{\"command\":\"npx\",\"args\":[\"-y\",\"supergateway\",\"--streamableHttp\",\"${MCP_SERVER_URL}\"],\"env\":{\"CAIDAZI_API_KEY\":\"${API_KEY}\"}}"

if [[ -f "$SETTINGS_FILE" ]]; then
  # merge into existing settings
  info "Merging MCP config into ${SETTINGS_FILE}..."

  # use python if available for reliable JSON merge, otherwise use sed
  if command -v python3 &>/dev/null; then
    python3 -c "
import json, sys

with open('${SETTINGS_FILE}', 'r') as f:
    settings = json.load(f)

mcp = json.loads('${MCP_ENTRY}')
if 'mcpServers' not in settings:
    settings['mcpServers'] = {}
settings['mcpServers']['${MCP_SERVER_NAME}'] = mcp

with open('${SETTINGS_FILE}', 'w') as f:
    json.dump(settings, f, indent=2)
    f.write('\n')
"
  else
    # fallback: basic sed-based approach for simple cases
    warn "python3 not found, using basic JSON merge. Manual verification recommended."

    # check if mcpServers already exists
    if grep -q '"mcpServers"' "$SETTINGS_FILE"; then
      # check if caidazi already configured
      if grep -q "\"${MCP_SERVER_NAME}\"" "$SETTINGS_FILE"; then
        info "MCP server '${MCP_SERVER_NAME}' already in settings, updating..."
        # This is a best-effort replacement without python
        TMP=$(mktemp)
        sed "/\"${MCP_SERVER_NAME}\"/,/}/c\\    \"${MCP_SERVER_NAME}\": $(echo "$MCP_ENTRY" | tr '\n' ' ')" "$SETTINGS_FILE" > "$TMP"
        mv "$TMP" "$SETTINGS_FILE"
      else
        # append to mcpServers
        TMP=$(mktemp)
        sed "s/\"mcpServers\": {/\"mcpServers\": {\n    \"${MCP_SERVER_NAME}\": $(echo "$MCP_ENTRY" | tr '\n' ' '),/" "$SETTINGS_FILE" > "$TMP"
        mv "$TMP" "$SETTINGS_FILE"
      fi
    else
      # add mcpServers section
      TMP=$(mktemp)
      sed "s/^{/{\n  \"mcpServers\": {\n    \"${MCP_SERVER_NAME}\": $(echo "$MCP_ENTRY" | tr '\n' ' ')\n  },/" "$SETTINGS_FILE" > "$TMP"
      mv "$TMP" "$SETTINGS_FILE"
    fi
  fi
else
  info "Creating ${SETTINGS_FILE}..."
  python3 -c "
import json
settings = {
    'mcpServers': {
        '${MCP_SERVER_NAME}': json.loads('${MCP_ENTRY}')
    }
}
with open('${SETTINGS_FILE}', 'w') as f:
    json.dump(settings, f, indent=2)
    f.write('\n')
"
fi

info "MCP config written to ${SETTINGS_FILE}"

# ── done ──
echo ""
info "Installation complete!"
info "  Version:  ${VERSION}"
info "  Platform: ${PLATFORM}"
info "  Skills:   ${#SKILLS[@]}"
info "  MCP:      ${MCP_SERVER_NAME} -> ${MCP_SERVER_URL}"
echo ""
echo "  Restart Claude Code to activate the skills."
echo ""
