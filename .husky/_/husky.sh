#!/usr/bin/env sh
if [ -n "$HUSKY_DEBUG" ]; then
  set -x
fi

export PATH="$(dirname -- "$0")/../../node_modules/.bin:$PATH"

if [ -f ~/.huskyrc ]; then
  . ~/.huskyrc
fi
