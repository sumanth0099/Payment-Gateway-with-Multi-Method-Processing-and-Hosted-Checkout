#!/bin/sh
set -e

echo "Running DB migrations + seeds..."
node src/db/dbInit.js

echo "Starting API..."
node src/server.js
