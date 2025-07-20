#!/usr/bin/env bash
set -e

npm install
npm run migration:run
npm run seed:run:relational
npm run start:dev
