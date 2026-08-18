# Deploy V2 - Hermes Deployment Automation

## Overview

Deploy V2 is an automated deployment system for Hermes Agent and related infrastructure. It provides:
- **One-click deployment** of Hermes across multiple environments
- **Infrastructure as Code** for reproducible deployments
- **Automated configuration** management
- **Rollback capabilities** for safe updates
- **Multi-environment support** (dev, staging, production)

## Architecture

```
deploy-v2/
├── deployments/
│   ├── dev/
│   │   ├── config.yaml
│   │   ├── environment.ps1
│   │   └── services/
│   ├── staging/
│   │   ├── config.yaml
│   │   └── ...
│   └── production/
│       ├── config.yaml
│       └── ...
├── scripts/
│   ├── deploy.ps1           # Main deployment script
│   ├── rollback.ps1         # Rollback script
│   ├── health-check.ps1     # Post-deploy health check
│   ├── backup.ps1           # Backup before deploy
│   └── restore.ps1          # Restore from backup
├── templates/
│   ├── config.yaml.template
│   ├── hermes-setup.ps1.template
│   └── documentation/
├── config/
│   ├── environments.yaml    # Environment definitions
│   └── defaults.yaml        # Default configuration values
├── docs/
│   ├── DEPLOYMENT-GUIDE.md
│   ├── ROLLBACK-PROCEDURE.md
│   └── TROUBLESHOOTING.md
├── tests/
│   ├── deploy-test.ps1
│   └── validation-tests/
├── AGENTS.md
├── README.md
└── VERSION
```

## Quick Start

### Prerequisites
- Windows 10/11 with PowerShell 7+
- Hermes Agent installed
- Access to target deployment environment
- Administrative privileges (for service installation)

### Basic Deployment

1. **Configure environment**
   ```powershell
   # Copy environment configuration
   cp config\environments.yaml config\environments.local.yaml
   
   # Edit for your setup
   notepad config\environments.local.yaml
   ```

2. **Run deployment**
   ```powershell
   # Deploy to development environment
   .\scripts\deploy.ps1 -Environment dev -Verbose
   
   # Deploy to production (with confirmation)
   .\scripts\deploy.ps1 -Environment production -Confirm
   ```

3. **Verify deployment**
   ```powershell
   # Run health checks
   .\scripts\health-check.ps1 -Environment dev
   
   # Check Hermes status
   hermes gateway status
   ```

## Features

### 1. Multi-Environment Deployment

Define and deploy to multiple environments:

```yaml
# environments.yaml
environments:
  dev:
    host: localhost
    profile: dev
    features:
      - debug_mode: true
      - verbose_logging: true
      
  staging:
    host: staging-server
    profile: staging
    features:
      - debug_mode: false
      - verbose_logging: true
      
  production:
    host: production-server
    profile: production
    features:
      - debug_mode: false
      - verbose_logging: false
      - ssl_enabled: true
```

### 2. Backup & Rollback

Automatic backup before deployment with easy rollback:

```powershell
# Deploy with automatic backup
.\scripts\deploy.ps1 -Environment production -Backup

# Rollback to previous version
.\scripts\rollback.ps1 -Environment production -Version latest

# List available backups
.\scripts\backup.ps1 -List
```

### 3. Configuration Management

Template-driven configuration with environment-specific overrides:

```powershell
# Generate configuration from template
.\scripts\deploy.ps1 -Environment dev -GenerateConfig

# Validate configuration
.\scripts\deploy.ps1 -Environment dev -ValidateOnly
```

### 4. Health Monitoring

Post-deployment health checks ensure successful deployment:

```powershell
# Run comprehensive health check
.\scripts\health-check.ps1 -Detailed -Output html

# Continuous monitoring
.\scripts\health-check.ps1 -Monitor -Interval 60
```

### 5. Deployment Hooks

Custom scripts that run at different deployment stages:

```yaml
# In environment config
hooks:
  pre_deploy:
    - scripts\pre-deploy-checks.ps1
  post_deploy:
    - scripts\post-deploy-setup.ps1
  on_rollback:
    - scripts\rollback-cleanup.ps1
```

## Deployment Script Options

```powershell
.\scripts\deploy.ps1
  -Environment <name>       # Required: dev, staging, production
  -Version <version>        # Specific version to deploy
  -Backup                   # Create backup before deploy
  -NoBackup                 # Skip backup (not recommended)
  -ValidateOnly             # Only validate, don't deploy
  -GenerateConfig           # Generate config from templates
  -Confirm                  # Require confirmation for production
  -Verbose                  # Detailed output
  -DryRun                   # Simulate deployment
```

## Environment Configuration

### config.yaml Structure

```yaml
environment: production
version: 2.0.0

hermes:
  installation_path: C:\Program Files\Hermes
  data_path: C:\Program Data\Hermes
  profile: production
  
services:
  gateway:
    enabled: true
    port: 8642
    startup: automatic
    
  dashboard:
    enabled: true
    port: 9119
    auth_required: true
    
  telegram_bot:
    enabled: true
    token: ${TELEGRAM_TOKEN}
    chat_id: ${TELEGRAM_CHAT_ID}

backup:
  enabled: true
  schedule: "0 2 * * *"  # Daily at 2 AM
  retention: 30  # days

monitoring:
  health_check_interval: 300
  alert_channels:
    - type: telegram
    - type: email
```

## Rollback Procedure

### Automatic Rollback
If health checks fail after deployment, automatic rollback can be configured:

```yaml
rollback:
  auto_on_failure: true
  health_check_retries: 3
  health_check_timeout: 60
```

### Manual Rollback
```powershell
# Rollback to specific version
.\scripts\rollback.ps1 -Environment production -Version 1.9.0

# Rollback to last successful deployment
.\scripts\rollback.ps1 -Environment production -Version latest

# Rollback with custom backup
.\scripts\rollback.ps1 -Environment production -BackupPath C:\backups\my-backup
```

## Testing

### Deployment Tests
```powershell
# Run deployment validation tests
.\tests\deploy-test.ps1 -Environment dev

# Test specific components
.\tests\deploy-test.ps1 -Environment dev -Components gateway,telegram
```

### Validation Checklist
- [ ] Hermes installation verified
- [ ] Configuration applied correctly
- [ ] Gateway running and healthy
- [ ] Telegram bot responding
- [ ] Dashboard accessible
- [ ] Backup created successfully
- [ ] Health checks passing

## Troubleshooting

### Deployment Fails
```powershell
# Check deployment logs
Get-Content logs\deploy-* -Tail 100

# Run validation only
.\scripts\deploy.ps1 -Environment dev -ValidateOnly -Verbose

# Check system requirements
.\scripts\deploy.ps1 -Environment dev -CheckRequirements
```

### Health Check Failures
```powershell
# Detailed health check
.\scripts\health-check.ps1 -Detailed -Environment dev

# Check specific service
.\scripts\health-check.ps1 -Service gateway -Environment dev
```

### Common Issues

**Issue: Gateway not starting**
- Check if port 8642 is available
- Verify configuration in config.yaml
- Check Hermes installation path
- Review gateway logs

**Issue: Telegram bot not connecting**
- Verify bot token in configuration
- Check network connectivity
- Ensure bot is not rate limited
- Review Telegram API status

**Issue: Dashboard not accessible**
- Check if port 9119 is available
- Verify dashboard is enabled in config
- Check authentication settings
- Review dashboard logs

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy Hermes

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Staging
        run: |
          .\scripts\deploy.ps1 -Environment staging -Backup
          
      - name: Health Check
        run: |
          .\scripts\health-check.ps1 -Environment staging -PassFail
```

### Manual Approval for Production
```yaml
  production-deploy:
    needs: deploy-staging
    environment: production
    runs-on: windows-latest
    steps:
      - name: Deploy to Production
        run: |
          .\scripts\deploy.ps1 -Environment production -Backup -Confirm
```

## Best Practices

1. **Always backup before deploying** - Use -Backup flag
2. **Test in dev first** - Never deploy directly to production
3. **Use version control** - Tag deployments in git
4. **Monitor after deploy** - Watch health checks for 24 hours
5. **Document changes** - Keep deployment logs
6. **Test rollback** - Regularly test rollback procedure
7. **Use environments** - Separate dev/staging/production

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Issues: https://github.com/whodakingofhell/deploy-v2/issues
- Documentation: See [docs/](docs/) directory
- Related: Hermes Agent (https://github.com/whodakingofhell/hermes-agent)
