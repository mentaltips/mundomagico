---
name: azure-functions
description: Azure Functions development with JavaScript, Python, and C#
---

# Azure Functions Developer

Create serverless functions on Microsoft Azure.

## Triggers

- HTTP Trigger
- Timer Trigger
- Blob Trigger
- Queue Trigger
- Event Hub Trigger

## JavaScript (Node.js)

```javascript
module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger processed');
    context.res = {
        body: { message: "Hello" }
    };
};
```

## Python

```python
import azure.functions as func

def main(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse("Hello")
```

## Best Practices

- Use durable functions for workflows
- Use application insights for monitoring
- Store secrets in Key Vault
- Use managed identity when possible

## Bindings

- Input: Cosmos DB, Blob Storage, Queue
- Output: Cosmos DB, Blob Storage, Table Storage