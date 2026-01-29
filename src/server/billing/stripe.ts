// Stripe integration
export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

export const validateStripeConfig = () => {
  if (!stripeConfig.secretKey || !stripeConfig.webhookSecret) {
    throw new Error('Missing Stripe configuration');
  }
};
