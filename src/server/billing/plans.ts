// Pricing plans definition
export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  stripePriceId?: string;
}

export const PLANS: Record<string, PricingPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    features: ['Basic features', 'Limited exports'],
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    price: 29,
    currency: 'USD',
    features: ['All features', 'Unlimited exports', 'Priority support'],
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    currency: 'USD',
    features: ['Custom features', 'Dedicated support', 'SLA'],
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE,
  },
};
