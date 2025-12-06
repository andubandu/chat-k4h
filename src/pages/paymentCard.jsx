import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';

export default function PaymentCard() {
  const { milestoneId } = useParams();
  const navigate = useNavigate();
  const token = Cookies.get('token');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (!cardNumber || !expiry || !cvc) return setError('All fields are required');
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(
        `https://api.k4h.dev/payments/milestones/${milestoneId}/pay`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.milestone) {
        await axios.post(
          `https://api.k4h.dev/payments/milestones/${milestoneId}/complete`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        await axios.post(
          `https://api.k4h.dev/payments/milestones/${milestoneId}/confirm`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        navigate(`/chat/${res.data.milestone.chat}`);
      } else {
        setError('Payment failed');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md flex flex-col gap-4">
        <h2 className="text-xl font-bold">Enter Card Details</h2>
        <input className="p-2 border rounded" placeholder="Card Number" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
        <input className="p-2 border rounded" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} />
        <input className="p-2 border rounded" placeholder="CVC" value={cvc} onChange={e => setCvc(e.target.value)} />
        {error && <div className="text-red-600">{error}</div>}
        <button onClick={handlePay} className="bg-green-500 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? 'Processing...' : 'Pay'}
        </button>
      </div>
    </div>
  );
}
