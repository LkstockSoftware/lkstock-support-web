#!/usr/bin/env bash
set -euo pipefail

DOTNET_DIR="${HOME}/.dotnet"
DOTNET="$DOTNET_DIR/dotnet"

if [ ! -x "$DOTNET" ]; then
  mkdir -p "$DOTNET_DIR"
  curl -fsSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 10.0 --install-dir "$DOTNET_DIR" --no-path
fi

export DOTNET_ROOT="$DOTNET_DIR"
export PATH="$DOTNET_DIR:$PATH"
export DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
export DOTNET_CLI_TELEMETRY_OPTOUT=1

rm -rf publish
"$DOTNET" publish LkStockSupportWeb.csproj -c Release -o publish
VERSION="$(date -u +%Y.%m.%d.%H%M)"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || printf 'local')"
printf '{"version":"%s","commit":"%s","builtAt":"%s"}\n' "$VERSION" "$COMMIT" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > publish/wwwroot/build-info.json
cp vercel.json publish/wwwroot/vercel.json
