#!/bin/sh

if [ "$APP_CONTEXT" = "dev"   ]; then node node_modules/.bin/nodemon src/index.ts; fi
if [ "$APP_CONTEXT" = "tests" ]; then node node_modules/.bin/nodemon src/index.ts; fi
if [ "$APP_CONTEXT" = "prod"  ]; then node index.js; fi