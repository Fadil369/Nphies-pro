# 🚀 PRODUCTION RELEASE - Custom Domain Setup

## 🎯 Quick Setup (5 minutes)

### Option 1: Automated Script
```bash
# Run the deployment script with your domain
./deploy-domain.sh yourdomain.com
```

### Option 2: Manual Setup

#### 1. Create Route 53 Hosted Zone
```bash
aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(date +%s)
```

#### 2. Create DNS Records
```bash
# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name yourdomain.com --query 'HostedZones[0].Id' --output text | cut -d'/' -f3)

# Create A record
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "yourdomain.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "54.91.91.0"}]
    }
  }]
}'
```

#### 3. Update Application URLs
```bash
# Replace IP with domain in all files
sed -i 's/54.91.91.0/yourdomain.com/g' *.html
sed -i 's/http:/https:/g' *.html
```

#### 4. Deploy
```bash
scp -i ~/.ssh/id_rsa *.html ec2-user@54.91.91.0:/home/ec2-user/
ssh -i ~/.ssh/id_rsa ec2-user@54.91.91.0 'sudo docker restart brainsait-web brainsait-dashboard brainsait-claims brainsait-health'
```

## 🌐 Production URLs

After setup, your platform will be available at:
- **Main Site**: https://yourdomain.com
- **Dashboard**: https://yourdomain.com:8081 (or dashboard.yourdomain.com)
- **Claims**: https://yourdomain.com:8082 (or claims.yourdomain.com)
- **API**: https://yourdomain.com:3001 (or api.yourdomain.com)

## 📋 Domain Registrar Setup

Configure your domain registrar (GoDaddy, Namecheap, etc.) with AWS nameservers:
1. Get nameservers: `aws route53 get-hosted-zone --id YOUR_ZONE_ID`
2. Update your domain's nameservers in registrar control panel
3. Wait 5-48 hours for DNS propagation

## 🔒 SSL Certificate (Optional)

For HTTPS, request free SSL certificate:
```bash
aws acm request-certificate --domain-name yourdomain.com --validation-method DNS
```

## ✅ Go Live Checklist

- [ ] Domain purchased
- [ ] Route 53 hosted zone created
- [ ] DNS records configured
- [ ] Application URLs updated
- [ ] Files deployed to EC2
- [ ] Containers restarted
- [ ] Domain registrar nameservers updated
- [ ] SSL certificate requested (optional)
- [ ] All URLs tested
- [ ] Mobile responsiveness verified

## 🎊 Launch Ready!

Your BrainSAIT Digital Insurance Platform is now production-ready with a custom domain!
