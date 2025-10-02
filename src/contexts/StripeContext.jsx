import React, { createContext, useContext, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';


const StripeContext = createContext();

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// eslint-disable-next-line react-refresh/only-export-components
export const useStripeContext = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};

// Alias for consistency
// eslint-disable-next-line react-refresh/only-export-components
export const useStripe = useStripeContext;

export const StripeProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  const createCheckoutSession = async (planId, planName, price) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          planName,
          price,
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/content-calendar`,
          userId: 'user_123', // Replace with actual user ID
        }),
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to create checkout session');
      console.error('Error creating checkout session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createCustomerPortalSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}/api/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: 'cus_123', // Replace with actual customer ID
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError('Failed to create portal session');
      console.error('Error creating portal session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    createCheckoutSession,
    createCustomerPortalSession,
    isLoading,
    error,
  };

  return (
    <StripeContext.Provider value={value}>
      <Elements stripe={stripePromise}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
};

export default StripeContext;
