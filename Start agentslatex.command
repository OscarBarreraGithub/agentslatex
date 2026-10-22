#!/bin/zsh
set -eu
cd -- "${0:A:h}"
printf '%s\n' 'AgentsLaTeX opens at http://127.0.0.1:4391' 'Leave this terminal running. Press Control-C to stop.'
exec npx --yes pnpm@12.14.0 dev:hosted
