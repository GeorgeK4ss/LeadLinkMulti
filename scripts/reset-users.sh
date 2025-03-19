#!/bin/bash

# Reset and recreate all users and roles
# This script will:
# 1. Delete existing users from Authentication and Firestore
# 2. Create new users in Authentication and Firestore
# 3. Assign roles to these users

echo "🧹 Step 1: Deleting existing users..."
node scripts/delete-users.js
if [ $? -ne 0 ]; then
  echo "❌ Failed to delete users. Check the error messages above."
  exit 1
fi

echo ""
echo "🚀 Step 2: Creating new users with roles..."
node scripts/create-users-and-roles.js
if [ $? -ne 0 ]; then
  echo "❌ Failed to create users. Check the error messages above."
  exit 1
fi

echo ""
echo "✅ User reset complete!"
echo "Created users:"
echo "- admin@leadlink.com (System Admin)"
echo "- company@leadlink.com (Company Admin for company-789012)"
echo "- tenant@leadlink.com (Tenant Admin for tenant-123456)"
echo "- agent@leadlink.com (Tenant Agent for tenant-123456)"
echo ""
echo "Password for all users: Password123!" 