#!/bin/bash

# Navigate to the functions directory
cd functions

# Create directory if it doesn't exist
mkdir -p src/admin-scripts

# Copy the file if not already done
cp ../functions/src/admin-scripts/assign-roles.js src/admin-scripts/

# Install dependencies if needed
npm install

# Run the script
echo "Running role assignment script..."
NODE_ENV=development node src/admin-scripts/assign-roles.js

# Return to the original directory
cd .. 