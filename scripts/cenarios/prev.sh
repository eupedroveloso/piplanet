#!/bin/zsh
# uso: prev.sh nome...  -> png/<nome>.png (1600x1000 inteiro)
G=${0:a:h}; CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for n in "$@"; do
  "$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=1600,1000 --screenshot="$G/png/$n.png" "file://$G/out/$n.svg" >/dev/null 2>&1
done
