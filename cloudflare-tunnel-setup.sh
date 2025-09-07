#!/bin/bash

# 🌐 Cloudflare Tunnel Setup for BrainSAIT
# Exposes the app at claims.brainsait.com

set -e

echo "🌐 Setting up Cloudflare Tunnel for claims.brainsait.com"

# Step 1: Install cloudflared on EC2
echo "📦 Installing cloudflared on EC2..."
ssh -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa ec2-user@54.91.91.0 << 'EOF'
# Download and install cloudflared
curl -L --output cloudflared.rpm https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm
sudo yum install -y cloudflared.rpm

# Verify installation
cloudflared --version
EOF

echo "✅ Cloudflared installed successfully!"

# Step 2: Create tunnel configuration
echo "🔧 Creating tunnel configuration..."
cat > tunnel-config.yml << 'EOF'
tunnel: brainsait-claims
credentials-file: /home/ec2-user/.cloudflared/brainsait-claims.json

ingress:
  # Main site
  - hostname: brainsait.com
    service: http://localhost:80
  
  # Claims management (main app)
  - hostname: claims.brainsait.com
    service: http://localhost:8082
  
  # Dashboard
  - hostname: dashboard.brainsait.com
    service: http://localhost:8081
  
  # API
  - hostname: api.brainsait.com
    service: http://localhost:3001
  
  # Health monitoring
  - hostname: health.brainsait.com
    service: http://localhost:8080
  
  # Catch-all
  - service: http_status:404
EOF

# Step 3: Deploy configuration to EC2
echo "📤 Deploying tunnel configuration..."
scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa tunnel-config.yml ec2-user@54.91.91.0:/home/ec2-user/

echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo ""
echo "1. 🔐 Login to Cloudflare and create tunnel:"
echo "   ssh -i ~/.ssh/id_rsa ec2-user@54.91.91.0"
echo "   cloudflared tunnel login"
echo ""
echo "2. 🚇 Create the tunnel:"
echo "   cloudflared tunnel create brainsait-claims"
echo ""
echo "3. 🔧 Start the tunnel:"
echo "   cloudflared tunnel --config tunnel-config.yml run brainsait-claims"
echo ""
echo "4. 🌐 Add DNS records in Cloudflare dashboard:"
echo "   claims.brainsait.com -> CNAME -> brainsait-claims.cfargotunnel.com"
echo "   dashboard.brainsait.com -> CNAME -> brainsait-claims.cfargotunnel.com"
echo "   api.brainsait.com -> CNAME -> brainsait-claims.cfargotunnel.com"
echo ""
echo "5. 🎊 Your app will be live at:"
echo "   https://claims.brainsait.com"
echo "   https://dashboard.brainsait.com"
echo "   https://api.brainsait.com"
echo ""
EOF
