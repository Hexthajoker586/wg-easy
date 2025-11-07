---
title: API
---

/// warning | Breaking Changes

This API is not yet stable and may change in the future. The API is currently in development and is subject to change without notice. The API is not yet documented, but we will add documentation as the API stabilizes.
///

You can use the API to interact with the application programmatically. The API is available at `/api` and supports both GET and POST requests. The API is designed to be simple and easy to use, with a focus on providing a consistent interface for all endpoints.

There is no documentation for the API yet, but this will be added as the underlying library supports it.

## Authentication

The API supports two authentication methods:

1. **Basic Authentication** - Using your username and password
2. **Bearer Token (API Key)** - Using an API key (recommended)

### Basic Authentication

To use Basic Authentication, provide your username and password. Note that if you have 2FA enabled, you cannot use Basic Authentication. Use API keys instead.

#### Basic Authentication Example

```python
import requests
from requests.auth import HTTPBasicAuth

url = "https://example.com:51821/api/client"
response = requests.get(url, auth=HTTPBasicAuth('username', 'password'))
if response.status_code == 200:
    data = response.json()
    print(data)
else:
    print(f"Error: {response.status_code}")
```

### Bearer Token (API Key)

API keys allow you to access the API programmatically without using your username and password. This is especially useful if you have 2FA enabled. API keys are prefixed with `wge_` and should be kept secure.

#### Creating an API Key

1. Log in to the web application
2. Go to your Account settings (click your avatar in the top right)
3. Scroll to the "API Keys" section
4. Click "Create API Key"
5. Enter a name for your API key (e.g., "My Application")
6. Click "Create"
7. Copy the API key immediately - you won't be able to see it again!

#### Bearer Token Authentication Example

```python
import requests

url = "https://example.com:51821/api/client"
headers = {
    "Authorization": "Bearer wge_your_api_key_here"
}
response = requests.get(url, headers=headers)
if response.status_code == 200:
    data = response.json()
    print(data)
else:
    print(f"Error: {response.status_code}")
```

```bash
# Using curl
curl -H "Authorization: Bearer wge_your_api_key_here" \
  https://example.com:51821/api/client
```

#### Managing API Keys

You can manage your API keys from the Account settings page:

- **View all keys**: See all your API keys, when they were created, and when they were last used
- **Create new keys**: Generate new API keys for different applications
- **Revoke keys**: Delete API keys you no longer need

/// tip | Security Best Practices

- Keep your API keys secure and never share them publicly
- Use different API keys for different applications
- Revoke API keys that are no longer needed
- API keys are hashed and stored securely - even admins cannot see your keys

///

## Endpoints

The Endpoints are not yet documented. But as file-based routing is used, you can find the endpoints in the `src/server/api` folder. The method is defined in the file name.

### Endpoints Example

| File Name                        | Endpoint       | Method |
| -------------------------------- | -------------- | ------ |
| `src/server/api/client.get.ts`   | `/api/client`  | GET    |
| `src/server/api/setup/2.post.ts` | `/api/setup/2` | POST   |
