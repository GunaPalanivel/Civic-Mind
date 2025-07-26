#!/bin/bash

echo "Starting deployment process..."

# Build all packages
echo "Building packages..."
pnpm build

# Run tests
echo "Running tests..."
pnpm test:ci

# Deploy to Cloud Build
echo "Triggering Cloud Build..."
gcloud builds submit --config cloudbuild.yaml .

echo "Deployment initiated successfully!"
