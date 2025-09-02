#!/usr/bin/env node

/**
 * Simple S3 Frontend Deployment Script
 * Deploys the React frontend to AWS S3
 */

import { execSync } from 'child_process';
import fs from 'fs';

// Configuration - UPDATE THESE VALUES
const S3_BUCKET_NAME = 'engentlabs-frontend'; // Replace with your bucket name
const AWS_REGION = 'us-east-1'; // Change if using different region

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkPrerequisites() {
  log('🔍 Checking prerequisites...', colors.blue);
  
  // Check if AWS CLI is installed
  try {
    execSync('aws --version', { stdio: 'pipe' });
    log('✅ AWS CLI is installed', colors.green);
  } catch (error) {
    log('❌ AWS CLI is not installed. Please install it first.', colors.red);
    process.exit(1);
  }

  // Check if dist folder exists
  if (!fs.existsSync('dist')) {
    log('❌ dist folder not found. Please run "npm run build" first.', colors.red);
    process.exit(1);
  }

  log('✅ All prerequisites met', colors.green);
}

function buildProject() {
  log('🔨 Building project...', colors.blue);
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('✅ Build completed successfully', colors.green);
  } catch (error) {
    log('❌ Build failed', colors.red);
    process.exit(1);
  }
}

function createS3Bucket() {
  log('🪣 Creating S3 bucket...', colors.blue);
  
  try {
    // Check if bucket exists
    execSync(`aws s3 ls s3://${S3_BUCKET_NAME}`, { stdio: 'pipe' });
    log('✅ S3 bucket already exists', colors.green);
  } catch (error) {
    // Bucket doesn't exist, create it
    try {
      execSync(`aws s3 mb s3://${S3_BUCKET_NAME} --region ${AWS_REGION}`, { stdio: 'inherit' });
      log('✅ S3 bucket created successfully', colors.green);
    } catch (createError) {
      log('❌ Failed to create S3 bucket', colors.red);
      process.exit(1);
    }
  }
}

function configureS3Website() {
  log('🌐 Configuring S3 website hosting...', colors.blue);
  
  try {
    execSync(`aws s3 website s3://${S3_BUCKET_NAME} --index-document index.html --error-document index.html`, { stdio: 'inherit' });
    log('✅ S3 website hosting configured', colors.green);
  } catch (error) {
    log('⚠️  S3 website hosting configuration failed (may already be configured)', colors.yellow);
  }
}

function deployToS3() {
  log('🚀 Deploying to S3...', colors.blue);
  
  try {
    // Sync dist folder to S3 bucket
    const syncCommand = `aws s3 sync dist/ s3://${S3_BUCKET_NAME} --delete --cache-control "max-age=31536000,public"`;
    execSync(syncCommand, { stdio: 'inherit' });
    log('✅ S3 deployment completed', colors.green);
  } catch (error) {
    log('❌ S3 deployment failed', colors.red);
    process.exit(1);
  }
}

function showDeploymentInfo() {
  log('🎉 Deployment completed successfully!', colors.green);
  log('', colors.reset);
  log('📋 Next Steps:', colors.blue);
  log('1. Visit your S3 website URL:', colors.reset);
  log(`   http://${S3_BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com`, colors.green);
  log('', colors.reset);
  log('2. Optional: Set up CloudFront for HTTPS and better performance', colors.reset);
  log('3. Optional: Configure custom domain', colors.reset);
  log('', colors.reset);
  log('🔧 Configuration:', colors.blue);
  log(`   Bucket: ${S3_BUCKET_NAME}`, colors.reset);
  log(`   Region: ${AWS_REGION}`, colors.reset);
  log(`   Files: ${fs.readdirSync('dist').length} files deployed`, colors.reset);
}

function main() {
  log('🚀 Starting Simple S3 Frontend Deployment...', colors.blue);
  
  // Check prerequisites
  checkPrerequisites();
  
  // Build project
  buildProject();
  
  // Create S3 bucket
  createS3Bucket();
  
  // Configure website hosting
  configureS3Website();
  
  // Deploy to S3
  deployToS3();
  
  // Show deployment info
  showDeploymentInfo();
}

// Run the deployment
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
