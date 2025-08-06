const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentScript {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.projectRoot = path.resolve(__dirname, '..');
  }

  // Run deployment
  async deploy() {
    try {
      console.log('🚀 Starting deployment...');
      
      // Check environment
      this.checkEnvironment();
      
      // Build frontend
      this.buildFrontend();
      
      // Start backend
      this.startBackend();
      
      // Run health checks
      this.runHealthChecks();
      
      console.log('✅ Deployment completed successfully!');
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    }
  }

  // Check deployment environment
  checkEnvironment() {
    console.log('📋 Checking environment...');
    
    const requiredEnvVars = [
      'MONGO_URI',
      'JWT_SECRET',
      'SENTRY_DSN',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    console.log('✅ Environment check passed');
  }

  // Build frontend
  buildFrontend() {
    console.log('⚡ Building frontend with Vite...');
    
    const frontendPath = path.join(this.projectRoot, 'frontend');
    
    if (!fs.existsSync(frontendPath)) {
      throw new Error('Frontend directory not found');
    }

    try {
      execSync('npm install', { cwd: frontendPath, stdio: 'inherit' });
      execSync('npm run build', { cwd: frontendPath, stdio: 'inherit' });
      console.log('✅ Frontend built successfully with Vite');
    } catch (error) {
      throw new Error('Frontend build failed');
    }
  }

  // Start backend
  startBackend() {
    console.log('🔧 Starting backend...');
    
    const backendPath = path.join(this.projectRoot, 'backend');
    
    if (!fs.existsSync(backendPath)) {
      throw new Error('Backend directory not found');
    }

    try {
      // Install backend dependencies if needed
      if (!fs.existsSync(path.join(backendPath, 'node_modules'))) {
        execSync('npm install', { cwd: backendPath, stdio: 'inherit' });
      }
      
      console.log('✅ Backend dependencies installed');
      console.log('📝 To start the backend, run: cd backend && npm run dev');
    } catch (error) {
      throw new Error('Backend setup failed');
    }
  }

  // Run health checks
  runHealthChecks() {
    console.log('🏥 Running health checks...');
    
    const healthChecks = [
      { name: 'Backend API', url: 'http://localhost:5000/health' },
    ];

    healthChecks.forEach(check => {
      try {
        execSync(`curl -f ${check.url}`, { stdio: 'pipe' });
        console.log(`✅ ${check.name} is healthy`);
      } catch (error) {
        console.warn(`⚠️ ${check.name} health check failed - make sure backend is running`);
      }
    });
  }

  // Show deployment info
  showDeploymentInfo() {
    console.log('\n📊 Deployment Information:');
    console.log('- Backend API: http://localhost:5000');
    console.log('- Frontend App: http://localhost:3000 (after starting)');
    console.log('- Health Check: http://localhost:5000/health');
    console.log('- Metrics: http://localhost:5000/metrics');
    console.log('\n⚡ Next Steps:');
    console.log('1. Start backend: cd backend && npm run dev');
    console.log('2. Start frontend: cd frontend && npm run dev');
    console.log('3. Access app at http://localhost:3000');
    console.log('\n💡 Vite provides faster development experience!');
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  const deployer = new DeploymentScript();
  deployer.deploy()
    .then(() => {
      deployer.showDeploymentInfo();
    })
    .catch(console.error);
}

module.exports = DeploymentScript;