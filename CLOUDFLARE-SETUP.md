# 🌐 Cloudflare Tunnel Setup for claims.brainsait.com

## ✅ COMPLETED:
- ✅ Cloudflared installed on EC2
- ✅ Tunnel configuration created
- ✅ Configuration deployed to server

## 🚀 NEXT STEPS (5 minutes):

### 1. SSH to your EC2 server
```bash
ssh -i ~/.ssh/id_rsa ec2-user@54.91.91.0
```

### 2. Login to Cloudflare
```bash
cloudflared tunnel login
```
This will open a browser - login with your Cloudflare account and authorize the tunnel.

### 3. Create the tunnel
```bash
cloudflared tunnel create brainsait-claims
```

### 4. Start the tunnel
```bash
cloudflared tunnel --config tunnel-config.yml run brainsait-claims &
```

### 5. Make tunnel persistent (run on boot)
```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

## 🌐 DNS CONFIGURATION

### In your Cloudflare dashboard (brainsait.com):

Add these CNAME records:

| Name | Type | Target |
|------|------|--------|
| `claims` | CNAME | `brainsait-claims.cfargotunnel.com` |
| `dashboard` | CNAME | `brainsait-claims.cfargotunnel.com` |
| `api` | CNAME | `brainsait-claims.cfargotunnel.com` |
| `health` | CNAME | `brainsait-claims.cfargotunnel.com` |

## 🎯 YOUR LIVE URLS:

After DNS propagation (2-5 minutes):
- **Claims Management**: https://claims.brainsait.com
- **Dashboard**: https://dashboard.brainsait.com  
- **API**: https://api.brainsait.com
- **Health**: https://health.brainsait.com

## 🔧 UPDATE APPLICATION URLS

Update your application to use the new domains:
```bash
# On your local machine
sed -i 's/54.91.91.0:8082/claims.brainsait.com/g' *.html
sed -i 's/54.91.91.0:8081/dashboard.brainsait.com/g' *.html
sed -i 's/54.91.91.0:3001/api.brainsait.com/g' *.html
sed -i 's/54.91.91.0:8080/health.brainsait.com/g' *.html
sed -i 's/http:/https:/g' *.html

# Deploy updated files
scp -i ~/.ssh/id_rsa *.html ec2-user@54.91.91.0:/home/ec2-user/
ssh -i ~/.ssh/id_rsa ec2-user@54.91.91.0 'sudo docker restart brainsait-web brainsait-dashboard brainsait-claims brainsait-health'
```

## ✅ VERIFICATION

Test your tunnel:
```bash
curl -I https://claims.brainsait.com
```

## 🎊 GO LIVE!

Your BrainSAIT platform will be live at:
**https://claims.brainsait.com** 🚀

## 🔧 TROUBLESHOOTING

### Check tunnel status:
```bash
cloudflared tunnel info brainsait-claims
```

### View tunnel logs:
```bash
sudo journalctl -u cloudflared -f
```

### Restart tunnel:
```bash
sudo systemctl restart cloudflared
```
