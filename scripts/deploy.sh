#!/bin/bash

# Check if environment argument is provided
if [ -z "$1" ]; then
  echo "Please provide an environment (dev, staging, or prod)"
  exit 1
fi

ENV=$1
PROJECT_ID=""
HOSTING_TARGET=""

# Set environment-specific variables
case $ENV in
  "dev")
    PROJECT_ID="leadlink-dev"
    HOSTING_TARGET="development"
    ;;
  "staging")
    PROJECT_ID="leadlink-staging"
    HOSTING_TARGET="staging"
    ;;
  "prod")
    PROJECT_ID="leadlink-prod"
    HOSTING_TARGET="production"
    ;;
  *)
    echo "Invalid environment. Use dev, staging, or prod"
    exit 1
    ;;
esac

# Load environment variables
if [ -f ".env.$ENV" ]; then
  export $(cat .env.$ENV | grep -v '^#' | xargs)
else
  echo ".env.$ENV file not found"
  exit 1
fi

echo "Deploying to $ENV environment..."

# Build the application
npm run build

# Deploy to Firebase
firebase use $PROJECT_ID

# Deploy hosting and functions
firebase deploy --only hosting:$HOSTING_TARGET,functions

echo "Deployment to $ENV completed successfully!" 