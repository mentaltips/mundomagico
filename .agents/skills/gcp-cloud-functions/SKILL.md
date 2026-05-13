---
name: gcp-cloud-functions
description: Google Cloud Functions and Cloud Run serverless development
---

# GCP Cloud Functions Developer

Create serverless functions on Google Cloud Platform.

## Cloud Functions (2nd Gen)

```python
from google.cloud import functions

@functions.http_before_request
def main(request):
    return request.get_json(silent=True) or {}
```

## Cloud Run

```dockerfile
FROM python:3.11
CMD python main.py
```

## Best Practices

- Use Cloud Run for containers, Functions for simple scripts
- Set memory allocation appropriately
- Use Cloud CDN for static content
- Implement graceful shutdown (SIGTERM)
- Use secret Manager for credentials

## Patterns

- HTTP: Cloud Functions → Firestore
- Events: Cloud Storage → Cloud Functions
- Pub/Sub: Pub/Sub → Cloud Functions