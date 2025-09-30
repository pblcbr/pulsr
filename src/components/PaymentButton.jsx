import React from 'react';
import { useStripeContext } from '../contexts/StripeContext';

const PaymentButton = ({ planId, planName, price, period, className }) => {
  const { createCheckoutSession, isLoading, error } = useStripeContext();

  const handlePayment = async () => {
    await createCheckoutSession(planId, planName, price);
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
      className={`${className} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? 'Processing...' : `Upgrade Now - ${price}/${period}`}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </button>
  );
};

export default PaymentButton;
