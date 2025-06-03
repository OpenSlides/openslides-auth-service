#!/bin/sh

if [ ! -z $dev   ]; then node node_modules/.bin/nodemon src/index.ts; fi
if [ ! -z $tests ]; then node node_modules/.bin/nodemon src/index.ts; fi
if [ ! -z $prod  ]; then node index.js; fi