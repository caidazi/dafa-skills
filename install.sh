#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${CAIDAZI_REPO_URL:-https://github.com/caidazi/dafa-skills.git}"
MCP_SERVER_URL="http://127.0.0.1:5011"
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
SCOPE="global"
UPDATE_MODE=false

usage() {
  cat <<'EOF'
Usage: install.sh [options]

Options:
  --key KEY         API key (required)
  --platform PLAT   Target platform: claude-code (default: auto-detect)
  --scope SCOPE     Installation scope: global (default) or project
  --update          Update existing installation
  --help            Show this help

Examples:
  ./install.sh --key $CAIDAZI_API_KEY
  ./install.sh --key $CAIDAZI_API_KEY --scope project
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --key)        API_KEY="$2"; shift 2 ;;
    --platform)   PLATFORM="$2"; shift 2 ;;
    --scope)      SCOPE="$2"; shift 2 ;;
    --update)     UPDATE_MODE=true; shift ;;
    --help|-h)    usage ;;
    *)            error "Unknown option: $1" ;;
  esac
done

if [[ "$SCOPE" != "global" && "$SCOPE" != "project" ]]; then
  error "Invalid scope '$SCOPE'. Use 'global' or 'project'."
fi

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

# ── clone repo to temp dir ──
info "Cloning skills repository..."
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

git clone --depth 1 "$REPO_URL" "$TMP_DIR/repo" >/dev/null 2>&1 || error "Failed to clone $REPO_URL"

# ── parse manifest ──
MANIFEST_FILE="$TMP_DIR/repo/manifest.yaml"
[[ -f "$MANIFEST_FILE" ]] || error "manifest.yaml not found in repo"

MANIFEST=$(cat "$MANIFEST_FILE")

VERSION=$(echo "$MANIFEST" | grep '^version:' | head -1 | awk '{print $2}')
[[ -z "$VERSION" ]] && error "Could not parse version from manifest"

SKILLS=()
parsing=false
while IFS= read -r line; do
  case "$line" in
    "skills:") parsing=true; continue ;;
    "required_mcp:"*) break ;;
  esac
  if $parsing; then
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

# ── read skills from local clone ──
SKILL_CONTENT=""
for skill in "${SKILLS[@]}"; do
  SKILL_FILE="$TMP_DIR/repo/${skill}/SKILL.md"
  [[ -f "$SKILL_FILE" ]] || error "Skill file not found: ${skill}/SKILL.md"
  info "  Loading ${skill}..."

  RAW=$(cat "$SKILL_FILE")

  # strip frontmatter (--- delimited block at the top)
  BODY=$(echo "$RAW" | awk '/^---$/{n++; next} n>=2')

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

# ── determine target paths ──
if [[ "$SCOPE" == "global" ]]; then
  CLAUDE_FILE="$HOME/.claude/CLAUDE.md"
  MCP_SCOPE="user"
  mkdir -p "$HOME/.claude"
  info "Installing globally to ${CLAUDE_FILE}"
else
  CLAUDE_FILE="CLAUDE.md"
  MCP_SCOPE="project"
  mkdir -p .claude
  info "Installing to current project"
fi

# ── write CLAUDE.md ──
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

# ── configure MCP server ──

if command -v claude &>/dev/null; then
  # Remove existing config if present
  if claude mcp list 2>/dev/null | grep -q "^${MCP_SERVER_NAME}:"; then
    info "Removing existing ${MCP_SERVER_NAME} MCP config..."
    claude mcp remove "${MCP_SERVER_NAME}" 2>/dev/null || true
  fi

  info "Adding ${MCP_SERVER_NAME} MCP server (${MCP_SCOPE} scope)..."
  claude mcp add --scope "${MCP_SCOPE}" \
    "${MCP_SERVER_NAME}" \
    -- npx -y supergateway \
    --streamableHttp "${MCP_SERVER_URL}/mcp" \
    --header "Authorization: Bearer ${API_KEY}" \
    2>/dev/null || warn "Failed to add MCP server via 'claude mcp add'. You may need to add it manually."
else
  warn "'claude' CLI not found. Skipping MCP auto-configuration."
  echo "  To add manually, run:"
  echo "    claude mcp add --scope ${MCP_SCOPE} ${MCP_SERVER_NAME} -- npx -y supergateway --streamableHttp ${MCP_SERVER_URL}/mcp --header 'Authorization: Bearer ${API_KEY}'"
fi

# ── done ──
echo ""
info "Installation complete!"
info "  Version:  ${VERSION}"
info "  Platform: ${PLATFORM}"
info "  Scope:    ${SCOPE}"
info "  Skills:   ${#SKILLS[@]}"
info "  MCP:      ${MCP_SERVER_NAME} -> ${MCP_SERVER_URL}"
echo ""
echo "  Restart Claude Code to activate the skills."
echo ""
