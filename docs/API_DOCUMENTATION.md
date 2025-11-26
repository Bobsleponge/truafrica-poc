# TruAfrica API Documentation

## Overview

The TruAfrica API provides programmatic access to campaign data, responses, and analytics. All API requests require authentication using an API key.

## Authentication

All API requests must include an API key in the Authorization header:

```
Authorization: Bearer truaf_your_api_key_here
```

### Getting an API Key

1. Log in to your TruAfrica account
2. Navigate to your dashboard
3. Go to the "Data & API" section
4. Click "Generate API Key"
5. **Important**: Copy and store your API key securely. It will not be shown again.

### Rate Limits

- **Limit**: 1000 requests per hour per API key
- **Headers**: Rate limit information is included in response headers:
  - `X-RateLimit-Limit`: Maximum requests per hour
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Timestamp when the limit resets

## Base URL

```
https://api.truafrica.com
```

(For development, use your local server URL)

## Endpoints

### Get Campaign Responses

Retrieve paginated responses for a campaign.

**Endpoint**: `GET /api/campaigns/:id/responses`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 100)

**Response**:
```json
{
  "success": true,
  "responses": [
    {
      "id": "uuid",
      "answer_text": "Answer content",
      "consensus_score": 85.5,
      "validation_confidence_score": 90.2,
      "correct": true,
      "created_at": "2024-01-15T10:30:00Z",
      "questions": {
        "id": "uuid",
        "content": "Question text"
      },
      "users": {
        "id": "uuid",
        "name": "Contributor Name",
        "trust_score": 75.5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

**Example**:
```bash
curl -H "Authorization: Bearer truaf_your_key" \
  "https://api.truafrica.com/api/campaigns/campaign-id/responses?page=1&limit=50"
```

### Get Campaign Summary

Get high-level statistics for a campaign.

**Endpoint**: `GET /api/campaigns/:id/summary`

**Response**:
```json
{
  "success": true,
  "summary": {
    "campaignId": "uuid",
    "campaignName": "Campaign Name",
    "status": "running",
    "totalQuestions": 10,
    "totalResponses": 150,
    "requiredResponses": 200,
    "completionRate": 75.0,
    "averageConsensus": 82.5,
    "totalCost": 180.00,
    "totalRevenue": 300.00,
    "margin": 40.0
  }
}
```

**Example**:
```bash
curl -H "Authorization: Bearer truaf_your_key" \
  "https://api.truafrica.com/api/campaigns/campaign-id/summary"
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing or invalid API key)
- `403`: Forbidden (API key doesn't have access to requested resource)
- `404`: Not Found (campaign or resource doesn't exist)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

### Rate Limit Exceeded

When rate limit is exceeded:

```json
{
  "error": "Rate limit exceeded",
  "limit": 1000,
  "resetAt": "2024-01-15T11:00:00Z"
}
```

## Best Practices

1. **Store API keys securely**: Never commit API keys to version control
2. **Handle rate limits**: Implement exponential backoff when rate limited
3. **Use pagination**: For large datasets, use pagination to avoid timeouts
4. **Cache responses**: Cache summary data to reduce API calls
5. **Monitor usage**: Check rate limit headers to monitor your usage

## SDK Examples

### JavaScript/TypeScript

```typescript
class TruAfricaAPI {
  constructor(private apiKey: string, private baseUrl: string) {}

  async getCampaignResponses(campaignId: string, page = 1, limit = 50) {
    const response = await fetch(
      `${this.baseUrl}/api/campaigns/${campaignId}/responses?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    )
    return response.json()
  }

  async getCampaignSummary(campaignId: string) {
    const response = await fetch(
      `${this.baseUrl}/api/campaigns/${campaignId}/summary`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    )
    return response.json()
  }
}
```

### Python

```python
import requests

class TruAfricaAPI:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {api_key}'}
    
    def get_campaign_responses(self, campaign_id, page=1, limit=50):
        response = requests.get(
            f'{self.base_url}/api/campaigns/{campaign_id}/responses',
            params={'page': page, 'limit': limit},
            headers=self.headers
        )
        return response.json()
    
    def get_campaign_summary(self, campaign_id):
        response = requests.get(
            f'{self.base_url}/api/campaigns/{campaign_id}/summary',
            headers=self.headers
        )
        return response.json()
```

## Support

For API support, contact: api-support@truafrica.com




