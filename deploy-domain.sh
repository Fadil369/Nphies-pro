#!/bin/bash

# 🚀 BrainSAIT Production Domain Deployment Script
# Usage: ./deploy-domain.sh your-domain.com

set -e

DOMAIN=${1:-"brainsait.com"}
EC2_IP="54.91.91.0"
KEY_PATH="~/.ssh/id_rsa"

echo "🚀 Deploying BrainSAIT to production domain: $DOMAIN"

# Step 1: Create Route 53 hosted zone
echo "📍 Creating Route 53 hosted zone..."
ZONE_ID=$(aws route53 create-hosted-zone \
  --name $DOMAIN \
  --caller-reference $(date +%s) \
  --query 'HostedZone.Id' \
  --output text | cut -d'/' -f3)

echo "✅ Hosted zone created: $ZONE_ID"

# Step 2: Create A record pointing to EC2
echo "🌐 Creating DNS A record..."
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "'$DOMAIN'",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'$EC2_IP'"}]
      }
    }]
  }'

# Step 3: Create subdomains
echo "🔗 Creating subdomain records..."
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "dashboard.'$DOMAIN'",
          "Type": "A",
          "TTL": 300,
          "ResourceRecords": [{"Value": "'$EC2_IP'"}]
        }
      },
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "claims.'$DOMAIN'",
          "Type": "A", 
          "TTL": 300,
          "ResourceRecords": [{"Value": "'$EC2_IP'"}]
        }
      },
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "api.'$DOMAIN'",
          "Type": "A",
          "TTL": 300,
          "ResourceRecords": [{"Value": "'$EC2_IP'"}]
        }
      }
    ]
  }'

# Step 4: Update application URLs
echo "🔄 Updating application URLs..."
cp index.html index.html.backup
cp dashboard.html dashboard.html.backup
cp claims-management.html claims-management.html.backup
cp health.html health.html.backup

# Replace IP with domain
sed -i.bak "s/54\.91\.91\.0/$DOMAIN/g" *.html
sed -i.bak "s/http:\/\/$DOMAIN/https:\/\/$DOMAIN/g" *.html

# Update port-specific URLs to use subdomains
sed -i.bak "s/$DOMAIN:8081/dashboard.$DOMAIN/g" *.html
sed -i.bak "s/$DOMAIN:8082/claims.$DOMAIN/g" *.html
sed -i.bak "s/$DOMAIN:3001/api.$DOMAIN/g" *.html
sed -i.bak "s/$DOMAIN:8080/health.$DOMAIN/g" *.html

# Step 5: Deploy updated files
echo "📦 Deploying updated files to EC2..."
scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa *.html ec2-user@$EC2_IP:/home/ec2-user/

# Step 6: Update containers with new files
echo "🔄 Restarting containers..."
ssh -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa ec2-user@$EC2_IP << 'EOF'
# Update all containers
sudo docker stop brainsait-web brainsait-dashboard brainsait-claims brainsait-health
sudo docker rm brainsait-web brainsait-dashboard brainsait-claims brainsait-health

# Start with updated files
sudo docker run -d -p 80:80 --name brainsait-web -v /home/ec2-user/index.html:/usr/share/nginx/html/index.html:ro nginx:alpine
sudo docker run -d -p 8081:80 --name brainsait-dashboard -v /home/ec2-user/dashboard.html:/usr/share/nginx/html/index.html:ro nginx:alpine
sudo docker run -d -p 8082:80 --name brainsait-claims -v /home/ec2-user/claims-management.html:/usr/share/nginx/html/index.html:ro nginx:alpine
sudo docker run -d -p 8080:80 --name brainsait-health -v /home/ec2-user/health.html:/usr/share/nginx/html/index.html:ro nginx:alpine

echo "✅ All containers restarted successfully!"
EOF

# Step 7: Get nameservers
echo "📋 Getting nameservers for domain configuration..."
NAMESERVERS=$(aws route53 get-hosted-zone --id $ZONE_ID --query 'DelegationSet.NameServers' --output table)

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=================================="
echo "Domain: $DOMAIN"
echo "Hosted Zone ID: $ZONE_ID"
echo ""
echo "📍 Configure your domain registrar with these nameservers:"
echo "$NAMESERVERS"
echo ""
echo "🌐 Your production URLs (available after DNS propagation):"
echo "  Main Site: https://$DOMAIN"
echo "  Dashboard: https://dashboard.$DOMAIN"
echo "  Claims:    https://claims.$DOMAIN"
echo "  API:       https://api.$DOMAIN"
echo "  Health:    https://health.$DOMAIN"
echo ""
echo "⏱️  DNS propagation may take 5-48 hours"
echo "🔍 Test with: dig $DOMAIN"
echo ""
echo "🎊 BrainSAIT is ready for production!"
