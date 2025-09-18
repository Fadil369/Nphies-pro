# 🚀 BrainSAIT Digital Insurance Platform - AWS Deployment Guide

This guide will help you deploy the BrainSAIT Digital Insurance Platform on AWS using the free tier resources.

## 📋 Prerequisites

Before starting the deployment, ensure you have:

### Required Tools
- **AWS CLI** - [Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker** - [Install Guide](https://docs.docker.com/get-docker/)
- **Terraform** - [Install Guide](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli)
- **Git** - [Install Guide](https://git-scm.com/downloads)

### AWS Account Setup
1. Create an AWS account (if you don't have one)
2. Create an IAM user with programmatic access
3. Attach the following policies to the user:
   - `AmazonEC2FullAccess`
   - `AmazonRDSFullAccess`
   - `AmazonS3FullAccess`
   - `AmazonElastiCacheFullAccess`
   - `AmazonVPCFullAccess`
   - `IAMFullAccess`

### Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1 (recommended for free tier)
# Default output format: json
```

## 🎯 Free Tier Resources Used

This deployment is optimized for AWS Free Tier and includes:

| Service | Instance Type | Free Tier Limit | Usage |
|---------|---------------|-----------------|-------|
| EC2 | t2.micro | 750 hours/month | Application server |
| RDS PostgreSQL | db.t3.micro | 750 hours/month | Database |
| ElastiCache Redis | cache.t3.micro | 750 hours/month | Caching |
| S3 | Standard | 5GB storage | File storage |
| Data Transfer | - | 15GB/month | Network traffic |

**Estimated Monthly Cost**: $0 (within free tier limits)

## 🚀 Quick Deployment

### Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
# Clone the repository
git clone https://github.com/Fadil369/Nphies-pro.git
cd Nphies-pro

# Make scripts executable
chmod +x scripts/*.sh

# Run automated setup
./scripts/setup-aws.sh
```

This script will:
1. ✅ Check prerequisites
2. ✅ Generate SSH keys
3. ✅ Install dependencies
4. ✅ Build the application
5. ✅ Deploy AWS infrastructure
6. ✅ Configure environment
7. ✅ Deploy application
8. ✅ Perform health checks

### Option 2: Manual Deployment

If you prefer manual control:

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Build Application
```bash
npm run build
```

#### Step 3: Deploy Infrastructure
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

#### Step 4: Deploy Application
```bash
./scripts/deploy.sh
```

## 🔧 Configuration

### Environment Variables

The deployment automatically creates a `.env.production` file with:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/nphies_pro
REDIS_URL=redis://REDIS_ENDPOINT:6379
AWS_REGION=us-east-1
S3_BUCKET=your-s3-bucket-name
JWT_SECRET=auto-generated-secret
ENCRYPTION_KEY=auto-generated-key
```

### Custom Configuration

To customize the deployment, edit:
- `infrastructure/terraform/main.tf` - AWS resources
- `docker-compose.prod.yml` - Application services
- `nginx.conf` - Load balancer configuration

## 📊 Monitoring & Health Checks

### Built-in Monitoring

The platform includes:
- **Prometheus** - Metrics collection
- **Grafana** - Dashboards and visualization
- **CloudWatch** - AWS native monitoring
- **Health checks** - Application status monitoring

### Access Monitoring

After deployment, access monitoring at:
- Grafana: `http://YOUR_INSTANCE_IP:3001`
- Prometheus: `http://YOUR_INSTANCE_IP:9090`

### Health Check Endpoints

- Main app: `http://YOUR_INSTANCE_IP/health`
- Platform Gateway: `http://YOUR_INSTANCE_IP/api/health`
- AI Engine: `http://YOUR_INSTANCE_IP/ai/health`

## 🔐 Security Features

### Implemented Security
- ✅ HTTPS/TLS encryption
- ✅ Security headers (HSTS, CSP, etc.)
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ CORS configuration

### Security Best Practices
- Database encryption at rest
- VPC with private subnets
- Security groups with minimal access
- Regular security updates
- Audit logging

## 🌍 Scaling & Production

### Horizontal Scaling
To scale beyond free tier:

1. **Increase instance size**:
   ```hcl
   instance_type = "t3.small"  # or larger
   ```

2. **Add load balancer**:
   ```hcl
   # Add ALB configuration
   ```

3. **Multi-AZ deployment**:
   ```hcl
   multi_az = true
   ```

### Production Checklist
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Configure backup strategy
- [ ] Set up monitoring alerts
- [ ] Configure log aggregation
- [ ] Implement CI/CD pipeline
- [ ] Security audit
- [ ] Performance testing

## 🛠️ Troubleshooting

### Common Issues

#### 1. Terraform Apply Fails
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check region availability
aws ec2 describe-availability-zones --region us-east-1
```

#### 2. EC2 Instance Not Accessible
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx

# Check instance status
aws ec2 describe-instances --instance-ids i-xxxxxxxxx
```

#### 3. Application Not Starting
```bash
# SSH into instance
ssh -i ~/.ssh/id_rsa ec2-user@YOUR_INSTANCE_IP

# Check Docker containers
sudo docker ps -a

# Check logs
sudo docker-compose logs
```

#### 4. Database Connection Issues
```bash
# Test database connectivity
psql -h RDS_ENDPOINT -U postgres -d nphies_pro

# Check RDS status
aws rds describe-db-instances --db-instance-identifier nphies-pro-postgres
```

### Getting Help

If you encounter issues:

1. **Check logs**: Application and system logs
2. **Verify configuration**: Environment variables and settings
3. **Test connectivity**: Network and service connectivity
4. **Contact support**: support@brainsait.com

## 📈 Performance Optimization

### Free Tier Optimization Tips

1. **Database Optimization**:
   - Use connection pooling
   - Optimize queries
   - Regular maintenance

2. **Caching Strategy**:
   - Redis for session storage
   - Application-level caching
   - CDN for static assets

3. **Resource Monitoring**:
   - Monitor CPU/memory usage
   - Set up CloudWatch alarms
   - Regular performance reviews

## 🔄 Updates & Maintenance

### Automated Updates
The platform includes automated update mechanisms:

```bash
# Update application
git pull origin main
npm run build
./scripts/deploy.sh

# Update infrastructure
cd infrastructure/terraform
terraform plan
terraform apply
```

### Backup Strategy
- **Database**: Automated daily backups (7-day retention)
- **Files**: S3 versioning enabled
- **Configuration**: Git version control

## 📞 Support & Resources

### Documentation
- [API Documentation](./docs/api/)
- [Architecture Guide](./docs/architecture/)
- [User Manual](./docs/user-guide/)

### Community & Support
- **GitHub Issues**: [Report bugs](https://github.com/Fadil369/Nphies-pro/issues)
- **Email Support**: support@brainsait.com
- **Documentation**: [Wiki](https://github.com/Fadil369/Nphies-pro/wiki)

### Professional Services
For enterprise deployments and custom integrations:
- **Email**: enterprise@brainsait.com
- **Phone**: +966 11 123 4567

---

## 🎉 Congratulations!

You've successfully deployed the BrainSAIT Digital Insurance Platform on AWS! 

Your healthcare digitization platform is now ready to:
- ✅ Process insurance claims with AI
- ✅ Integrate with NPHIES
- ✅ Manage multi-tenant operations
- ✅ Provide real-time analytics
- ✅ Ensure compliance with Saudi regulations

**Next Steps**:
1. Configure your healthcare data
2. Set up NPHIES integration
3. Customize the platform for your needs
4. Train your team on the platform

Welcome to the future of healthcare digitization in Saudi Arabia! 🏥🇸🇦
