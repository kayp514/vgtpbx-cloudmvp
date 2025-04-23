'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@tremor/react';
import { CreditCard, Package } from 'lucide-react';

interface BillingPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

interface SubscriptionDetails {
  currentPlan: BillingPlan;
  nextBillingDate: string;
  paymentMethod?: {
    brand: string;
    last4: string;
  };
}

export default function BillingSettings() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [availablePlans, setAvailablePlans] = useState<BillingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBillingDetails = async () => {
      if (!user) return;
      try {
        const [subResponse, plansResponse] = await Promise.all([
          fetch('/api/billing/subscription'),
          fetch('/api/billing/plans')
        ]);

        if (subResponse.ok && plansResponse.ok) {
          const [subData, plansData] = await Promise.all([
            subResponse.json(),
            plansResponse.json()
          ]);
          setSubscription(subData);
          setAvailablePlans(plansData);
        }
      } catch (error) {
        console.error('Error fetching billing details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingDetails();
  }, [user]);

  const handleUpdatePaymentMethod = async () => {
    try {
      const response = await fetch('/api/billing/create-payment-intent', {
        method: 'POST'
      });
      if (response.ok) {
        const { clientSecret } = await response.json();
        // Handle Stripe payment update flow
        console.log('Update payment method:', clientSecret);
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
    }
  };

  const handlePlanChange = async (planId: string) => {
    try {
      const response = await fetch('/api/billing/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      if (response.ok) {
        // Refresh subscription details
        const subResponse = await fetch('/api/billing/subscription');
        if (subResponse.ok) {
          setSubscription(await subResponse.json());
        }
      }
    } catch (error) {
      console.error('Error changing plan:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Billing</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and billing details
        </p>
      </div>

      <div className="grid gap-6">
        {/* Current Plan */}
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Current Plan</h4>
              <p className="text-2xl font-bold">{subscription?.currentPlan.name}</p>
              <p className="text-sm text-muted-foreground">
                ${subscription?.currentPlan.price}/month
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Next billing date: {subscription?.nextBillingDate}
            </p>
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium">Payment Method</h4>
              {subscription?.paymentMethod ? (
                <p className="text-sm text-muted-foreground">
                  {subscription.paymentMethod.brand} ending in {subscription.paymentMethod.last4}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No payment method on file</p>
              )}
            </div>
            <button
              onClick={handleUpdatePaymentMethod}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Update
            </button>
          </div>
        </Card>

        {/* Available Plans */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Available Plans</h4>
          <div className="grid gap-4 md:grid-cols-3">
            {availablePlans.map((plan) => (
              <Card key={plan.id} className="p-6">
                <h5 className="font-medium">{plan.name}</h5>
                <p className="text-2xl font-bold">${plan.price}/month</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanChange(plan.id)}
                  className="mt-4 w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  disabled={plan.id === subscription?.currentPlan.id}
                >
                  {plan.id === subscription?.currentPlan.id ? 'Current Plan' : 'Select Plan'}
                </button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}