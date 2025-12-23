import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { CreditCard, Loader2 } from 'lucide-react';

const PaymentButton = ({ milestoneId, price }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('token');
      const { data } = await axios.post(
        `https://api.k4h.dev/payments/milestones/${milestoneId}/create-order`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      console.error("Payment Init Failed:", err.response?.data);
      alert("Could not initialize PayPal. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50"
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
      Pay ${price} Now
    </button>
  );
};

export default PaymentButton;
