# Secrets Manager Setup Guide

## Overview

The Club Task Manager supports multiple secrets management backends for production deployments:

1. **AWS Secrets Manager** (Recommended for AWS deployments)
2. **Supabase Vault** (Recommended for Supabase-hosted deployments)
3. **Kubernetes Secrets** (For Kubernetes deployments)
4. **Environment Variables** (Development only)

---

## Option 1: AWS Secrets Manager

### Prerequisites
- AWS account with Secrets Manager access
- AWS CLI installed and configured
- IAM permissions: `secretsmanager:GetSecretValue`

### Step 1: Create Secret in AWS

```bash
# Create a new secret
aws secretsmanager create-secret \
  --name club-task-manager/secrets \
  --description "Secrets for Club Task Manager" \
  --secret-string '{
    "JWT_SECRET": "your-jwt-secret-here",
    "ENCRYPTION_KEY": "your-base64-encryption-key-here"
  }' \
  --region us-east-1
```

### Step 2: Configure Application

Update your `.env` file:

```bash
# Disable environment-based secrets
USE_ENV_SECRETS=false

# Enable AWS Secrets Manager
AWS_SECRETS_ENABLED=true
AWS_SECRET_NAME=club-task-manager/secrets
AWS_REGION=us-east-1
```

### Step 3: Configure IAM Permissions

Create an IAM policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:club-task-manager/secrets-*"
    }
  ]
}
```

Attach this policy to your EC2 instance role, ECS task role, or Lambda execution role.

### Step 4: Install boto3

```bash
poetry add boto3
```

### Step 5: Test

```bash
python -c "from app.core.secrets import get_jwt_secret; print('JWT Secret loaded:', bool(get_jwt_secret()))"
```

---

## Option 2: Supabase Vault

### Prerequisites
- Supabase project with Vault enabled
- Supabase service role key

### Step 1: Enable Vault in Supabase

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable Vault extension
CREATE EXTENSION IF NOT EXISTS vault;

-- Create secrets table (if not exists)
CREATE TABLE IF NOT EXISTS vault.secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  secret TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to get secrets
CREATE OR REPLACE FUNCTION vault_get_secret(secret_name TEXT)
RETURNS TEXT AS $
  SELECT secret FROM vault.secrets WHERE name = secret_name;
$ LANGUAGE sql SECURITY DEFINER;
```

### Step 2: Add Secrets

```sql
-- Add JWT secret
INSERT INTO vault.secrets (name, secret)
VALUES ('JWT_SECRET', 'your-jwt-secret-here')
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

-- Add encryption key
INSERT INTO vault.secrets (name, secret)
VALUES ('ENCRYPTION_KEY', 'your-base64-encryption-key-here')
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;
```

### Step 3: Configure Application

Update your `.env` file:

```bash
# Disable environment-based secrets
USE_ENV_SECRETS=false

# Enable Supabase Vault
SUPABASE_VAULT_ENABLED=true
```

### Step 4: Test

```bash
python -c "from app.core.secrets import get_jwt_secret; print('JWT Secret loaded:', bool(get_jwt_secret()))"
```

---

## Option 3: Kubernetes Secrets

### Step 1: Create Kubernetes Secret

```bash
# Create secret from file
kubectl create secret generic app-secrets \
  --from-literal=JWT_SECRET=your-jwt-secret \
  --from-literal=ENCRYPTION_KEY=your-encryption-key \
  --namespace=your-namespace
```

### Step 2: Mount Secret as File

Update your Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: club-task-manager
spec:
  template:
    spec:
      containers:
      - name: api
        image: your-image
        env:
        - name: SECRETS_FILE_PATH
          value: /etc/secrets/app-secrets.json
        volumeMounts:
        - name: secrets
          mountPath: /etc/secrets
          readOnly: true
      volumes:
      - name: secrets
        secret:
          secretName: app-secrets
```

### Step 3: Test

```bash
kubectl exec -it <pod-name> -- python -c "from app.core.secrets import get_jwt_secret; print('JWT Secret loaded:', bool(get_jwt_secret()))"
```

---

## Option 4: Environment Variables (Development Only)

**⚠️ NOT RECOMMENDED FOR PRODUCTION**

For local development only:

```bash
# .env file
USE_ENV_SECRETS=true
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here
```

---

## Security Best Practices

### 1. Rotate Secrets Regularly

```bash
# AWS Secrets Manager - Enable automatic rotation
aws secretsmanager rotate-secret \
  --secret-id club-task-manager/secrets \
  --rotation-lambda-arn arn:aws:lambda:region:account:function:rotation-function
```

### 2. Use Different Secrets Per Environment

```bash
# Development
club-task-manager/dev/secrets

# Staging
club-task-manager/staging/secrets

# Production
club-task-manager/prod/secrets
```

### 3. Audit Secret Access

```bash
# AWS CloudTrail - Monitor secret access
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=club-task-manager/secrets
```

### 4. Encrypt Secrets at Rest

All secrets managers encrypt data at rest by default, but verify:

- **AWS Secrets Manager**: Uses AWS KMS
- **Supabase Vault**: Uses PostgreSQL encryption
- **Kubernetes Secrets**: Enable encryption at rest in etcd

---

## Troubleshooting

### Secret Not Found

```bash
# Check if secret exists
aws secretsmanager describe-secret --secret-id club-task-manager/secrets

# Check IAM permissions
aws sts get-caller-identity
```

### Permission Denied

```bash
# Verify IAM role has correct permissions
aws iam get-role-policy --role-name your-role --policy-name your-policy
```

### Caching Issues

```python
# Clear secrets cache
from app.core.secrets import SecretsManager
SecretsManager.clear_cache()
```

---

## Migration from Environment Variables

### Step 1: Export Current Secrets

```bash
# Export from .env
export JWT_SECRET=$(grep JWT_SECRET .env | cut -d '=' -f2)
export ENCRYPTION_KEY=$(grep ENCRYPTION_KEY .env | cut -d '=' -f2)
```

### Step 2: Import to Secrets Manager

```bash
# AWS
aws secretsmanager create-secret \
  --name club-task-manager/secrets \
  --secret-string "{\"JWT_SECRET\":\"$JWT_SECRET\",\"ENCRYPTION_KEY\":\"$ENCRYPTION_KEY\"}"

# Supabase (via SQL)
psql $DATABASE_URL -c "INSERT INTO vault.secrets (name, secret) VALUES ('JWT_SECRET', '$JWT_SECRET')"
```

### Step 3: Update Configuration

```bash
# Update .env
USE_ENV_SECRETS=false
AWS_SECRETS_ENABLED=true  # or SUPABASE_VAULT_ENABLED=true
```

### Step 4: Remove from .env

```bash
# Remove sensitive values from .env
sed -i '/JWT_SECRET=/d' .env
sed -i '/ENCRYPTION_KEY=/d' .env
```

---

## Cost Considerations

### AWS Secrets Manager
- $0.40 per secret per month
- $0.05 per 10,000 API calls
- **Estimated cost**: ~$1-2/month for small deployments

### Supabase Vault
- Included in Supabase Pro plan ($25/month)
- No additional cost

### Kubernetes Secrets
- Free (part of Kubernetes)
- No additional cost

---

## Support

For issues with secrets management:
1. Check application logs: `tail -f logs/app.log`
2. Verify secrets manager configuration
3. Test secret retrieval: `python -c "from app.core.secrets import get_jwt_secret; print(get_jwt_secret())"`
