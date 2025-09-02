#!/usr/bin/env node

/**
 * AWS Frontend Deployment Script
 * Deploys the React frontend to AWS S3 with CloudFront distribution
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const S3_BUCKET_NAME = 'your-frontend-bucket-name'; // Replace with your bucket name
const CLOUDFRONT_DISTRIBUTION_ID = 'your-cloudfront-distribution-id'; // Replace with your distribution ID
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

  // Check if .env file exists
  if (!fs.existsSync('.env')) {
    log('❌ .env file not found. Please create it with your AWS Lambda URL.', colors.red);
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

function invalidateCloudFront() {
  log('🔄 Invalidating CloudFront cache...', colors.blue);
  
  try {
    const invalidateCommand = `aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths "/*"`;
    execSync(invalidateCommand, { stdio: 'inherit' });
    log('✅ CloudFront invalidation completed', colors.green);
  } catch (error) {
    log('❌ CloudFront invalidation failed', colors.red);
    process.exit(1);
  }
}

function checkEnvironmentVariables() {
  log('🔧 Checking environment variables...', colors.blue);
  
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredVars = ['VITE_API_BASE_URL', 'VITE_BACKEND_URL'];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      log(`⚠️  Warning: ${varName} not found in .env file`, colors.yellow);
    } else {
      log(`✅ ${varName} found in .env file`, colors.green);
    }
  }
}

function main() {
  log('🚀 Starting AWS Frontend Deployment...', colors.blue);
  
  // Check prerequisites
  checkPrerequisites();
  
  // Check environment variables
  checkEnvironmentVariables();
  
  // Build project
  buildProject();
  
  // Deploy to S3
  deployToS3();
  
  // Invalidate CloudFront cache
  invalidateCloudFront();
  
  log('🎉 Deployment completed successfully!', colors.green);
  log(`🌐 Your frontend should be available at: https://${S3_BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com`, colors.blue);
  log('📝 Note: If using CloudFront, use your CloudFront distribution URL instead.', colors.yellow);
}

// Run the deployment
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
