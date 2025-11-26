/**
 * Reward allocation and management
 */

import { RewardType, RewardStatus } from '@/types/database'

export interface RewardConfig {
  correctAnswerReward: number
  highConsensusBonus: number
  rewardTypes: RewardType[]
}

export const DEFAULT_REWARD_CONFIG: RewardConfig = {
  correctAnswerReward: 10, // Base points/voucher value
  highConsensusBonus: 5, // Bonus for >90% consensus
  rewardTypes: ['airtime', 'mobile_money', 'grocery_voucher'],
}

/**
 * Calculate reward value for a correct answer
 */
export function calculateRewardValue(
  consensusScore: number,
  config: RewardConfig = DEFAULT_REWARD_CONFIG
): number {
  let value = config.correctAnswerReward
  
  // Bonus for high consensus
  if (consensusScore >= 90) {
    value += config.highConsensusBonus
  }
  
  return value
}

/**
 * Allocate reward for a correct answer
 */
export function allocateReward(
  contributorId: string,
  consensusScore: number,
  rewardType: RewardType = 'airtime'
): {
  rewardType: RewardType
  value: number
  status: RewardStatus
} {
  const value = calculateRewardValue(consensusScore)
  
  return {
    rewardType,
    value,
    status: 'awarded',
  }
}

/**
 * Get reward type display name
 */
export function getRewardTypeDisplayName(rewardType: RewardType): string {
  const names: Record<RewardType, string> = {
    airtime: 'Airtime',
    mobile_money: 'Mobile Money',
    grocery_voucher: 'Grocery Voucher',
  }
  return names[rewardType] || rewardType
}

/**
 * Format reward value for display
 */
export function formatRewardValue(value: number, rewardType: RewardType): string {
  if (rewardType === 'airtime' || rewardType === 'mobile_money') {
    return `${value.toFixed(2)} ${getCurrencySymbol(rewardType)}`
  } else {
    return `${value.toFixed(2)} points`
  }
}

/**
 * Get currency symbol based on reward type
 */
function getCurrencySymbol(rewardType: RewardType): string {
  // In production, this could be based on user's country
  const symbols: Record<RewardType, string> = {
    airtime: 'USD',
    mobile_money: 'USD',
    grocery_voucher: 'points',
  }
  return symbols[rewardType] || 'USD'
}

/**
 * Placeholder for voucher API integration
 * In production, this would call actual voucher provider APIs
 */
export async function redeemReward(
  rewardId: string,
  rewardType: RewardType,
  value: number,
  recipientInfo: {
    phoneNumber?: string
    email?: string
    name?: string
  }
): Promise<{ success: boolean; message: string; transactionId?: string }> {
  // Placeholder implementation
  // In production, integrate with:
  // - Airtime providers (MTN, Airtel, etc.)
  // - Mobile Money providers (M-Pesa, Orange Money, etc.)
  // - Grocery voucher providers (Shoprite, Pick n Pay, etc.)
  
  return {
    success: true,
    message: `Reward of ${value} ${getRewardTypeDisplayName(rewardType)} processed successfully`,
    transactionId: `TXN-${Date.now()}`,
  }
}

