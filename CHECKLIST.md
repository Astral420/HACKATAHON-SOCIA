# Deployment Checklist

Complete checklist for deploying the Meeting AI Platform.

## Pre-Deployment

### Local Setup
- [ ] Docker installed and running
- [ ] Docker Compose available
- [ ] Python 3 installed (for scripts)
- [ ] Git repository cloned
- [ ] `.env` file created from `.env.example`
- [ ] All required API keys obtained:
  - [ ] Google Gemini API key
  - [ ] Cloudflare R2 credentials
  - [ ] Generated strong API key for authentication
- [ ] Run `./verify_setup.sh` successfully

### Configuration
- [ ] Database credentials configured
- [ ] Redis password set
- [ ] API keys added to `.env`
- [ ] CORS origin configured
- [ ] Public URL configured
- [ ] All placeholder values replaced

### Testing Locally
- [ ] Services start successfully: `make dev`
- [ ] Health check passes: `curl http://localhost:3000/health`
- [ ] Database accessible: `make db-shell`
- [ ] Redis accessible: `make redis-shell`
- [ ] API endpoints respond correctly
- [ ] Can create a meeting
- [ ] Can process with AI
- [ ] Can generate share link

## AWS EC2 Setup

### Instance Configuration
- [ ] EC2 instance launched (t3.medium or larger)
- [ ] Ubuntu 22.04 LTS selected
- [ ] 30GB+ EBS volume attached
- [ ] Elastic IP assigned (optional but recommended)
- [ ] Key pair downloaded and secured

### Security Group Rules
- [ ] SSH (22) - Your IP only
- [ ] HTTP (80) - 0.0.0.0/0
- [ ] HTTPS (443) - 0.0.0.0/0
- [ ] Custom TCP (3000) - 0.0.0.0/0 (API)
- [ ] Custom TCP (5173) - 0.0.0.0/0 (Frontend, dev only)
- [ ] PostgreSQL (5432) - Blocked externally
- [ ] Redis (6379) - Blocked externally

### Initial Server Setup
- [ ] SSH access verified
- [ ] System updated: `sudo apt update && sudo apt upgrade -y`
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] User added to docker group
- [ ] Git installed
- [ ] UFW firewall configured (optional)

## Deployment to EC2

### Code Deployment
- [ ] Repository cloned to EC2
- [ ] `.env` file created with production values
- [ ] Environment variables verified
- [ ] File permissions set correctly

### Database Setup
- [ ] PostgreSQL container started
- [ ] Database schema applied
- [ ] Database connection verified
- [ ] Initial data seeded (if needed)

### Application Deployment
- [ ] All containers built successfully
- [ ] All containers running: `docker compose ps`
- [ ] No errors in logs: `docker compose logs`
- [ ] Health check passes from EC2
- [ ] API accessible from external IP

### Nginx Configuration
- [ ] Nginx installed
- [ ] Site configuration created
- [ ] Configuration tested: `sudo nginx -t`
- [ ] Nginx restarted
- [ ] Can access via domain/IP through Nginx

### SSL Setup
- [ ] Domain DNS configured (if using domain)
- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS
- [ ] Auto-renewal configured

### Auto-Start Configuration
- [ ] Systemd service created
- [ ] Service enabled: `sudo systemctl enable meeting-ai`
- [ ] Service tested: `sudo systemctl start meeting-ai`
- [ ] Reboot tested

## Post-Deployment

### Verification
- [ ] All endpoints accessible
- [ ] Can create meetings via API
- [ ] Can upload files to R2
- [ ] AI processing works
- [ ] Share links work
- [ ] Public pages load correctly
- [ ] CORS working for frontend
- [ ] Authentication working
- [ ] Error handling working

### Monitoring Setup
- [ ] CloudWatch agent installed (optional)
- [ ] Log aggregation configured
- [ ] Alerts configured
- [ ] Uptime monitoring setup
- [ ] Performance monitoring setup

### Backup Configuration
- [ ] Database backup script created
- [ ] Backup cron job configured
- [ ] Backup storage configured
- [ ] Restore procedure tested

### Documentation
- [ ] Deployment notes documented
- [ ] Access credentials stored securely
- [ ] Team members notified
- [ ] API documentation shared
- [ ] Runbook created

## Security Hardening

### Server Security
- [ ] SSH key-only authentication
- [ ] Root login disabled
- [ ] Fail2ban installed (optional)
- [ ] UFW firewall enabled
- [ ] Automatic security updates enabled
- [ ] Unnecessary services disabled

### Application Security
- [ ] Strong passwords used everywhere
- [ ] API keys rotated from defaults
- [ ] Environment variables secured
- [ ] Database not exposed externally
- [ ] Redis not exposed externally
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting implemented (TODO)

### Data Security
- [ ] Database encrypted at rest (optional)
- [ ] Backups encrypted
- [ ] Sensitive logs redacted
- [ ] PII handling reviewed
- [ ] Data retention policy defined

## Performance Optimization

### Application
- [ ] Redis caching working
- [ ] Database queries optimized
- [ ] Connection pooling configured
- [ ] Resource limits set
- [ ] Log levels appropriate for production

### Infrastructure
- [ ] Docker resource limits set
- [ ] Nginx caching configured
- [ ] CDN configured (optional)
- [ ] Database indexes created
- [ ] Monitoring shows healthy metrics

## Maintenance Procedures

### Regular Tasks
- [ ] Backup procedure documented
- [ ] Update procedure documented
- [ ] Rollback procedure documented
- [ ] Log rotation configured
- [ ] Disk space monitoring setup

### Emergency Procedures
- [ ] Incident response plan created
- [ ] Emergency contacts documented
- [ ] Rollback tested
- [ ] Disaster recovery plan created
- [ ] Data recovery tested

## Final Checks

### Functionality
- [ ] All API endpoints tested
- [ ] All user flows tested
- [ ] Error scenarios tested
- [ ] Load testing performed (optional)
- [ ] Security scan performed (optional)

### Documentation
- [ ] README updated
- [ ] API documentation current
- [ ] Deployment guide accurate
- [ ] Architecture documented
- [ ] Troubleshooting guide created

### Team Readiness
- [ ] Team trained on deployment
- [ ] Access credentials distributed
- [ ] On-call rotation setup
- [ ] Monitoring dashboards shared
- [ ] Communication channels setup

## Go-Live

### Pre-Launch
- [ ] Final backup taken
- [ ] All stakeholders notified
- [ ] Rollback plan ready
- [ ] Monitoring active
- [ ] Team on standby

### Launch
- [ ] DNS updated (if applicable)
- [ ] Traffic verified
- [ ] Monitoring checked
- [ ] No errors in logs
- [ ] Performance acceptable

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Address any issues
- [ ] Collect feedback
- [ ] Document lessons learned
- [ ] Plan next iteration

## Ongoing Maintenance

### Daily
- [ ] Check monitoring dashboards
- [ ] Review error logs
- [ ] Verify backups completed

### Weekly
- [ ] Review performance metrics
- [ ] Check disk space
- [ ] Review security logs
- [ ] Update dependencies (if needed)

### Monthly
- [ ] Security updates applied
- [ ] Backup restore tested
- [ ] Performance review
- [ ] Cost optimization review
- [ ] Documentation updated

### Quarterly
- [ ] Disaster recovery drill
- [ ] Security audit
- [ ] Capacity planning review
- [ ] Architecture review
- [ ] Team training

---

## Quick Reference Commands

### Check Status
```bash
make status
docker compose ps
curl http://localhost:3000/health
```

### View Logs
```bash
make logs
docker compose logs -f server
```

### Restart Services
```bash
make restart
docker compose restart
```

### Backup Database
```bash
make backup
```

### Update Application
```bash
git pull
make rebuild
```

### Emergency Rollback
```bash
git checkout previous-commit
make rebuild
```
