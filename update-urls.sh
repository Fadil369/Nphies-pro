#!/bin/bash

# 🔄 Update BrainSAIT URLs for Cloudflare domains

echo "🔄 Updating application URLs for Cloudflare domains..."

# Backup original files
cp index.html index.html.backup
cp dashboard.html dashboard.html.backup
cp claims-management.html claims-management.html.backup
cp health.html health.html.backup

# Update URLs to use Cloudflare domains
sed -i.bak 's/54\.91\.91\.0:8082/claims.brainsait.com/g' *.html
sed -i.bak 's/54\.91\.91\.0:8081/dashboard.brainsait.com/g' *.html
sed -i.bak 's/54\.91\.91\.0:3001/api.brainsait.com/g' *.html
sed -i.bak 's/54\.91\.91\.0:8080/health.brainsait.com/g' *.html
sed -i.bak 's/54\.91\.91\.0/brainsait.com/g' *.html

# Convert to HTTPS
sed -i.bak 's/http:\/\/claims\.brainsait\.com/https:\/\/claims.brainsait.com/g' *.html
sed -i.bak 's/http:\/\/dashboard\.brainsait\.com/https:\/\/dashboard.brainsait.com/g' *.html
sed -i.bak 's/http:\/\/api\.brainsait\.com/https:\/\/api.brainsait.com/g' *.html
sed -i.bak 's/http:\/\/health\.brainsait\.com/https:\/\/health.brainsait.com/g' *.html
sed -i.bak 's/http:\/\/brainsait\.com/https:\/\/brainsait.com/g' *.html

echo "✅ URLs updated successfully!"

# Deploy to EC2
echo "📤 Deploying updated files to EC2..."
scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa *.html ec2-user@54.91.91.0:/home/ec2-user/

# Restart containers
echo "🔄 Restarting containers..."
ssh -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa ec2-user@54.91.91.0 << 'EOF'
sudo docker restart brainsait-web brainsait-dashboard brainsait-claims brainsait-health
echo "✅ All containers restarted!"
EOF

echo ""
echo "🎉 APPLICATION UPDATED FOR CLOUDFLARE DOMAINS!"
echo "=============================================="
echo ""
echo "🌐 Your new URLs will be:"
echo "  Claims:    https://claims.brainsait.com"
echo "  Dashboard: https://dashboard.brainsait.com"
echo "  API:       https://api.brainsait.com"
echo "  Health:    https://health.brainsait.com"
echo ""
echo "⚠️  Remember to:"
echo "  1. Complete Cloudflare tunnel setup"
echo "  2. Add CNAME records in Cloudflare dashboard"
echo "  3. Wait for DNS propagation (2-5 minutes)"
echo ""
