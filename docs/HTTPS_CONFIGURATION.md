# HTTPS Load Balancer Configuration

## Problem
The Application Load Balancer was only configured with HTTP (port 80) listener that redirects to HTTPS, but had no HTTPS (port 443) listener configured. This meant the API was not accessible via `https://loppestars.spoons.dk`.

## Solution

### 1. Added HTTPS Listener to CloudFormation Template

**File**: `aws/stack-template.yaml`

Added:
```yaml
# HTTPS Listener
HTTPSListener:
  Type: AWS::ElasticLoadBalancingV2::Listener
  Properties:
    LoadBalancerArn: !Ref LoadBalancer
    Port: 443
    Protocol: HTTPS
    Certificates:
      - CertificateArn: (from ACM)
    DefaultActions:
      - Type: forward
        TargetGroupArn: !Ref TargetGroup
```

### 2. Updated Deploy Script to Find ACM Certificate

**File**: `aws/deploy.sh`

The script now:
- Queries ACM for issued certificates matching the domain
- Selects the first matching certificate
- Passes the certificate ARN to CloudFormation
- Falls back to creating a new certificate if none exists

```bash
# Find issued certificate for domain
local cert_arn=$($AWS_CLI acm list-certificates \
  --region "$REGION" \
  --certificate-statuses ISSUED \
  --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn | [0]" \
  --output text)
```

### 3. Certificate Information

**Domain**: `loppestars.spoons.dk`
**Status**: ISSUED
**ARN**: `arn:aws:acm:eu-central-1:035338517878:certificate/82a99014-eb81-4aef-b32b-ea6071457b52`

## Deployment Status

**Current**: Deploying stack update to add HTTPS listener

**Steps**:
1. ✅ Updated stack template
2. ✅ Fixed deploy script certificate selection
3. ⏳ Deploying CloudFormation stack update
4. ⏳ Waiting for ALB HTTPS listener to be created
5. Verify HTTPS endpoint works

## Testing

Once deployment completes, test:

```bash
# Test HTTPS health endpoint
curl https://loppestars.spoons.dk/health

# Expected response:
# {"status":"healthy","service":"loppestars"}

# Test root endpoint
curl https://loppestars.spoons.dk/

# Expected response:
# {"message":"Welcome to the Loppestars API"}
```

## Architecture

```
┌──────────────────────────────────────────────┐
│ Cloudflare DNS                               │
│ loppestars.spoons.dk (CNAME → ALB)          │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Application Load Balancer                    │
│ ┌──────────────────────────────────────────┐ │
│ │ HTTP Listener (Port 80)                  │ │
│ │ → Redirect to HTTPS                      │ │
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │ HTTPS Listener (Port 443) ⭐ NEW         │ │
│ │ → ACM Certificate                        │ │
│ │ → Forward to Target Group                │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Target Group                                 │
│ Health Check: /health (10s timeout)         │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ ECS Fargate Tasks                            │
│ Container Port: 8080                         │
│ API: FastAPI + Uvicorn                       │
└──────────────────────────────────────────────┘
```

## Certificate Management

### Multiple Certificates Found
There were 6 issued certificates for `loppestars.spoons.dk`:
- Created between Oct 2-3, 2025
- All in ISSUED status
- Likely from multiple deployment attempts

**Solution**: Deploy script now selects the first matching certificate.

### Certificate Cleanup (Optional)
To delete unused certificates:
```bash
# Delete old certificates (keep the one being used)
aws acm delete-certificate \
  --certificate-arn arn:aws:acm:eu-central-1:035338517878:certificate/[OLD_CERT_ID] \
  --region eu-central-1
```

## Troubleshooting

### Stack Update Failed
**Issue**: "Certificate ARN is not valid"
**Cause**: Multiple certificate ARNs were concatenated into one string
**Fix**: Updated script to select only first certificate (`| [0]` in query)

### Rollback Occurred
**Issue**: Stack update failed and rolled back
**Cause**: Invalid certificate ARN format
**Fix**: Fixed and redeployed with correct single ARN

### HTTPS Still Not Working
**Check**:
1. Stack update completed: `aws cloudformation describe-stacks --stack-name LoppestarsEcsStack`
2. HTTPS listener created: Check ALB listeners in console
3. Certificate attached: Verify certificate ARN in listener config
4. DNS points to ALB: `dig loppestars.spoons.dk`

## Next Steps

After deployment completes:
1. ✅ Verify HTTPS endpoint responds
2. ✅ Test API health check
3. ✅ Test all API endpoints
4. ✅ Update mobile app to use HTTPS URL
5. ✅ Clean up old unused certificates (optional)

---

**Status**: Deployment in progress (~5-10 minutes remaining)
