#!/bin/bash

# Setup GCP project
echo "Setting up GCP project..."
gcloud projects create civic-mind-prod --name="Civic Mind Production"
gcloud config set project civic-mind-prod

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  firestore.googleapis.com \
  pubsub.googleapis.com \
  aiplatform.googleapis.com \
  maps-backend.googleapis.com \
  storage.googleapis.com \
  artifactregistry.googleapis.com \
  cloudfunctions.googleapis.com

# Create Firestore database
echo "Creating Firestore database..."
gcloud firestore databases create --region=us-central1

# Create Pub/Sub topics
echo "Creating Pub/Sub topics..."
gcloud pubsub topics create civic-events-new
gcloud pubsub topics create civic-clusters-updated
gcloud pubsub topics create civic-alerts-generated

# Create Cloud Storage buckets
echo "Creating storage buckets..."
gsutil mb -p civic-mind-prod -c STANDARD -l us-central1 gs://civic-mind-media
gsutil mb -p civic-mind-prod -c STANDARD -l us-central1 gs://civic-mind-backups

# Setup IAM roles
echo "Setting up IAM roles..."
gcloud projects add-iam-policy-binding civic-mind-prod \
  --member="serviceAccount:civic-mind-prod@appspot.gserviceaccount.com" \
  --role="roles/datastore.user"

echo "GCP setup complete!"
