#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to execute commands
function executeCommand(command) {
  console.log(`\n> Executing: ${command}\n`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Main deployment function
async function deployAll() {
  console.log('\n=== LeadLink CRM Firebase Deployment ===\n');
  
  // Build the application
  console.log('Building the application...');
  if (!executeCommand('npm run build')) {
    console.error('Build failed. Aborting deployment.');
    return;
  }
  
  // Ask which services to deploy
  console.log('\nWhich services would you like to deploy?');
  
  const deployHosting = await askQuestion('Deploy Hosting? (y/n): ');
  const deployFunctions = await askQuestion('Deploy Functions? (y/n): ');
  const deployFirestore = await askQuestion('Deploy Firestore Rules? (y/n): ');
  const deployStorage = await askQuestion('Deploy Storage Rules? (y/n): ');
  const deployDatabase = await askQuestion('Deploy Realtime Database Rules? (y/n): ');
  
  // Build deployment command
  let deployCommand = 'firebase deploy';
  const deployOptions = [];
  
  if (deployHosting.toLowerCase() === 'y') deployOptions.push('hosting');
  if (deployFunctions.toLowerCase() === 'y') deployOptions.push('functions');
  if (deployFirestore.toLowerCase() === 'y') deployOptions.push('firestore');
  if (deployStorage.toLowerCase() === 'y') deployOptions.push('storage');
  if (deployDatabase.toLowerCase() === 'y') deployOptions.push('database');
  
  if (deployOptions.length > 0) {
    deployCommand += ` --only ${deployOptions.join(',')}`;
  }
  
  // Execute deployment
  console.log('\nStarting deployment...');
  if (executeCommand(deployCommand)) {
    console.log('\n✅ Deployment completed successfully!');
  } else {
    console.error('\n❌ Deployment failed.');
  }
  
  // Ask if initialization scripts should be run
  const runInit = await askQuestion('\nWould you like to run initialization scripts? (y/n): ');
  
  if (runInit.toLowerCase() === 'y') {
    console.log('\nRunning initialization scripts...');
    
    const initFirestore = await askQuestion('Initialize Firestore data? (y/n): ');
    if (initFirestore.toLowerCase() === 'y') {
      executeCommand('node scripts/init-firebase.js');
    }
    
    const initRealtime = await askQuestion('Initialize Realtime Database? (y/n): ');
    if (initRealtime.toLowerCase() === 'y') {
      executeCommand('node scripts/init-realtime-db.js');
    }
    
    const initStorage = await askQuestion('Initialize Storage structure? (y/n): ');
    if (initStorage.toLowerCase() === 'y') {
      executeCommand('node scripts/init-storage.js');
    }
  }
  
  console.log('\n=== Deployment process completed ===');
  rl.close();
}

// Run the deployment
deployAll(); 