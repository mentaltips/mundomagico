---
name: aws-serverless-architect
description: Design serverless architectures on AWS using Lambda, API Gateway, DynamoDB, S3, EventBridge
---

# AWS Serverless Architect

Design scalable, cost-effective serverless architectures on AWS.

## Core Services

| Service | Use Case |
|---------|---------|
| Lambda | Compute |
| API Gateway | HTTP APIs |
| DynamoDB | NoSQL DB |
| S3 | Storage |
| EventBridge | Event Bus |
| Step Functions | Orchestration |
| SNS/SQS | Messaging |
| CloudWatch | Monitoring |

## Architecture Patterns

### Pattern 1: REST API
```
Client → API Gateway → Lambda → DynamoDB
```

### Pattern 2: Event-Driven
```
S3 Upload → Lambda (trigger) → DynamoDB
```

### Pattern 3: Async Processing
```
API → Lambda → SQS → Lambda (worker)
```

### Pattern 4: Scheduled Job
```
CloudWatch → Lambda → External API
```

## Cost Optimization

- Use pay-per-request API Gateway
- DynamoDB On-Demand for variable workloads
- S3 Intelligent Tiering
- Lambda provisioned concurrency for consistent latency

## Security

- Use IAM roles, not access keys
- Enable VPC for Lambdas accessing RDS
- Use Secrets Manager for credentials
- Enable AWS WAF on API Gateway