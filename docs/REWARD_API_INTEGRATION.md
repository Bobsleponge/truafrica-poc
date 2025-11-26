# Reward API Integration Guide

This guide explains how to integrate actual reward provider APIs into the TruAfrica platform.

## Overview

The reward system supports three types of rewards:
1. **Airtime** - Mobile phone credit
2. **Mobile Money** - Digital wallet transfers
3. **Grocery Vouchers** - Store credit/vouchers

## Architecture

The reward system uses a provider abstraction layer (`lib/services/rewardService.ts`) that:
- Selects the appropriate provider based on country and reward type
- Handles API calls with retry logic
- Manages errors and transaction tracking

## Integration Steps

### Step 1: Research Provider APIs

For each reward type, research available providers in your target countries:

#### Airtime Providers

| Provider | Countries | API Documentation |
|----------|-----------|-------------------|
| MTN | Nigeria, Ghana, SA, Uganda, Cameroon | [MTN Developer Portal](https://developers.mtn.com/) |
| Airtel | Multiple African countries | [Airtel API Docs](https://www.airtel.in/business/enterprise-solutions/airtel-iot/api) |
| Vodacom | South Africa | [Vodacom Business API](https://www.vodacom.co.za/vodacom/business/products-and-services/enterprise-solutions) |
| Orange | Multiple African countries | [Orange Developer](https://developer.orange.com/) |

#### Mobile Money Providers

| Provider | Countries | API Documentation |
|----------|-----------|-------------------|
| M-Pesa | Kenya, Tanzania | [Safaricom Developer Portal](https://developer.safaricom.co.ke/) |
| Orange Money | Multiple countries | [Orange Money API](https://developer.orange.com/apis/orange-money/) |
| MTN Mobile Money | Multiple countries | [MTN MoMo API](https://momodeveloper.mtn.com/) |
| Airtel Money | Multiple countries | [Airtel Money API](https://www.airtel.in/business/enterprise-solutions/airtel-iot/api) |

#### Grocery Voucher Providers

| Provider | Countries | Notes |
|----------|-----------|-------|
| Shoprite | South Africa, Nigeria, Ghana | Contact Shoprite for API access |
| Pick n Pay | South Africa | Contact Pick n Pay for API access |
| Checkers | South Africa | Contact Checkers for API access |

### Step 2: Get API Credentials

For each provider you want to integrate:

1. **Sign up for developer account**
   - Register on provider's developer portal
   - Complete verification process
   - Accept terms and conditions

2. **Create application/API key**
   - Create a new application in developer portal
   - Generate API keys (Consumer Key, Consumer Secret, etc.)
   - Note any webhook URLs needed

3. **Test in sandbox**
   - Use sandbox/test credentials first
   - Test API endpoints
   - Verify response formats

### Step 3: Implement Provider

Update `lib/services/rewardService.ts`:

```typescript
// Example: M-Pesa Implementation
export const mpesaProvider: RewardProvider = {
  name: 'M-Pesa',
  countries: ['Kenya', 'Tanzania'],
  redeem: async (params) => {
    // Step 1: Get access token
    const tokenResponse = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
        ).toString('base64')}`,
      },
    })
    
    const { access_token } = await tokenResponse.json()
    
    // Step 2: Initiate payment
    const paymentResponse = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: process.env.MPESA_BUSINESS_SHORTCODE,
        Password: generatePassword(),
        Timestamp: generateTimestamp(),
        TransactionType: 'CustomerPayBillOnline',
        Amount: params.value,
        PartyA: params.recipientInfo.phoneNumber,
        PartyB: process.env.MPESA_BUSINESS_SHORTCODE,
        PhoneNumber: params.recipientInfo.phoneNumber,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: params.rewardId,
        TransactionDesc: 'TruAfrica Reward',
      }),
    })
    
    const result = await paymentResponse.json()
    
    if (result.ResponseCode === '0') {
      return {
        success: true,
        message: 'M-Pesa payment initiated successfully',
        transactionId: result.CheckoutRequestID,
      }
    } else {
      return {
        success: false,
        message: result.errorMessage || 'Payment initiation failed',
        error: result.ResponseCode,
      }
    }
  },
}
```

### Step 4: Update Provider Selection

Update `getRewardProvider()` function:

```typescript
export function getRewardProvider(
  country: string,
  rewardType: RewardType
): RewardProvider | null {
  // Mobile Money
  if (rewardType === 'mobile_money') {
    if (country === 'Kenya' || country === 'Tanzania') {
      return mpesaProvider
    }
    if (['Senegal', 'Ivory Coast', 'Mali'].includes(country)) {
      return orangeMoneyProvider
    }
  }
  
  // Airtime
  if (rewardType === 'airtime') {
    if (['Nigeria', 'Ghana'].includes(country)) {
      return mtnAirtimeProvider
    }
    if (country === 'South Africa') {
      return vodacomAirtimeProvider
    }
  }
  
  // Grocery Vouchers
  if (rewardType === 'grocery_voucher') {
    if (country === 'South Africa') {
      return shopriteVoucherProvider
    }
  }
  
  return null
}
```

### Step 5: Add Environment Variables

Add provider credentials to `.env.local`:

```env
# M-Pesa (Kenya, Tanzania)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORTCODE=your_shortcode
MPESA_CALLBACK_URL=https://your-domain.com/api/webhooks/mpesa

# MTN Airtime
MTN_API_KEY=your_mtn_api_key
MTN_API_SECRET=your_mtn_api_secret

# Shoprite Vouchers
SHOPRITE_API_KEY=your_shoprite_api_key
SHOPRITE_API_URL=https://api.shoprite.com/v1

# Orange Money
ORANGE_MONEY_CLIENT_ID=your_client_id
ORANGE_MONEY_CLIENT_SECRET=your_client_secret
```

### Step 6: Implement Webhook Handlers

Create webhook endpoints to handle provider callbacks:

```typescript
// app/api/webhooks/mpesa/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // Verify webhook signature (important for security)
  // ... verification logic ...
  
  // Update reward status in database
  const supabase = await createClient()
  await supabase
    .from('rewards')
    .update({ status: 'redeemed' })
    .eq('id', body.AccountReference)
  
  return NextResponse.json({ success: true })
}
```

### Step 7: Update Reward Redemption

Update `lib/utils/rewards.ts` to use the service:

```typescript
import { redeemReward } from '@/lib/services/rewardService'

export async function redeemReward(
  rewardId: string,
  rewardType: RewardType,
  value: number,
  recipientInfo: {
    phoneNumber?: string
    email?: string
    name?: string
    country?: string
  }
): Promise<{ success: boolean; message: string; transactionId?: string }> {
  // Get user's country from database
  const supabase = createClient()
  const { data: user } = await supabase
    .from('users')
    .select('country')
    .eq('id', recipientInfo.userId)
    .single()
  
  return await redeemReward({
    rewardId,
    rewardType,
    value,
    recipientInfo: {
      ...recipientInfo,
      country: user?.country,
    },
  })
}
```

## Testing

### Test in Sandbox

1. Use test credentials from provider
2. Test with small amounts
3. Verify webhook callbacks work
4. Check transaction status updates

### Test in Production

1. Start with small test transactions
2. Monitor error logs
3. Verify successful redemptions
4. Test error handling

## Security Considerations

1. **Never expose API keys in client-side code**
   - Keep all credentials in `.env.local`
   - Use server-side API routes for redemption

2. **Verify webhook signatures**
   - Each provider has signature verification
   - Always verify before processing webhooks

3. **Rate limiting**
   - Implement rate limiting on redemption endpoints
   - Prevent abuse and excessive API calls

4. **Transaction logging**
   - Log all redemption attempts
   - Track failures for debugging

5. **Error handling**
   - Handle network failures gracefully
   - Implement retry logic with exponential backoff
   - Notify users of failures

## Cost Considerations

- **API fees**: Most providers charge per transaction
- **Minimum amounts**: Some providers have minimum transaction amounts
- **Currency conversion**: Handle different currencies if needed
- **Testing costs**: Sandbox testing may still incur costs

## Monitoring

Set up monitoring for:
- Redemption success rates
- API response times
- Error rates by provider
- Transaction costs
- Failed redemptions

## Support

For provider-specific issues:
- Check provider's developer documentation
- Contact provider's developer support
- Review provider's status page
- Check for API updates/changes

## Example Integration Checklist

- [ ] Research provider APIs
- [ ] Sign up for developer accounts
- [ ] Get API credentials
- [ ] Test in sandbox environment
- [ ] Implement provider in code
- [ ] Add environment variables
- [ ] Implement webhook handlers
- [ ] Test end-to-end flow
- [ ] Deploy to production
- [ ] Monitor and optimize

---

**Note**: This is a guide for integrating reward APIs. Actual implementation will vary by provider and may require additional steps specific to each provider's requirements.

