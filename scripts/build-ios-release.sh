#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE_PATH="${ARCHIVE_PATH:-$ROOT_DIR/build/BarretosClash.xcarchive}"
EXPORT_PATH="${EXPORT_PATH:-$ROOT_DIR/build/AppStore}"
TEAM_ID="${APPLE_TEAM_ID:-}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Erro: a compilação iOS precisa ser executada em macOS com Xcode." >&2
  exit 1
fi
if [[ -z "$TEAM_ID" ]]; then
  echo "Uso: APPLE_TEAM_ID=SEU_TEAM_ID ./scripts/build-ios-release.sh" >&2
  exit 1
fi
command -v xcodebuild >/dev/null || { echo "Erro: Xcode não encontrado." >&2; exit 1; }
command -v pod >/dev/null || { echo "Erro: CocoaPods não encontrado. Instale-o antes de continuar." >&2; exit 1; }

cd "$ROOT_DIR"
npm ci
npm run cap:sync
(cd ios/App && pod install)
rm -rf "$ARCHIVE_PATH" "$EXPORT_PATH"
mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_PATH"

xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  CODE_SIGN_STYLE=Automatic \
  archive

EXPORT_OPTIONS="$(mktemp -t barretos-export-options).plist"
trap 'rm -f "$EXPORT_OPTIONS"' EXIT
cat > "$EXPORT_OPTIONS" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>destination</key>
  <string>export</string>
  <key>method</key>
  <string>app-store</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>teamID</key>
  <string>$TEAM_ID</string>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>uploadSymbols</key>
  <true/>
</dict>
</plist>
PLIST

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -exportPath "$EXPORT_PATH"

echo "IPA gerado em: $EXPORT_PATH"
