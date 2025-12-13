import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

const Result = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const init = async () => {
      const paymentStatus = searchParams.get('payment');
      const paypalOrderId = searchParams.get('token');
      const chatId = searchParams.get('milestoneId')
      const buyerId = searchParams.get('buyerId');
      const sellerId = searchParams.get('sellerId');

      console.log('Query params:', { paymentStatus, paypalOrderId, chatId, buyerId, sellerId });

      if (paymentStatus === 'success' && paypalOrderId && chatId) {
        await finalizePayment(chatId, paypalOrderId, buyerId, sellerId);
      } else {
        setStatus('error');
      }
    };

    init();
  }, []);

  const finalizePayment = async (chatId, paypalOrderId, buyerId, sellerId) => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        console.error('No auth token found');
        setStatus('error');
        return;
      }
      const milestoneRes = await axios.get(
        `https://api.k4h.dev/milestones/${chatId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!milestoneRes.data || milestoneRes.data.length === 0) {
        console.error('No milestones found for this chat');
        setStatus('error');
        return;
      }
      const activeMilestone = milestoneRes.data.find(m => m.status === 'in_progress');
      if (!activeMilestone) {
        console.error('No active milestone found');
        setStatus('error');
        return;
      }

      const resolvedSellerId = sellerId || activeMilestone.proposal.seller._id;
      const resolvedBuyerId = buyerId || activeMilestone.proposal.buyer;
      const amount = activeMilestone.proposal.price;
      const currency = 'USD';

      const payload = {
        milestoneId: activeMilestone._id,
        payerId: resolvedBuyerId,
        payeeId: resolvedSellerId,
        amount,
        currency,
        paymentID: paypalOrderId
      };

      console.log('Sending manual transaction payload:', payload);

      const response = await axios.post(
        'https://api.k4h.dev/misc/manual-transaction',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Manual transaction response:', response.data);
      setStatus('success');
    } catch (err) {
      console.error('Finalize Error:', err.response?.data || err.message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-800">Verifying Payment...</h2>
            <p className="text-gray-500 mt-2">Please don't close this window while we secure the escrow funds.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
            <h2 className="text-2xl font-bold text-gray-800">Payment Secured!</h2>
            <p className="text-gray-600 mt-2">The milestone has been marked as paid and funds are held in escrow.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-8 w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all"
            >
              Go to Dashboard <ArrowRight size={18} />
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="text-red-500 mx-auto mb-4" size={64} />
            <h2 className="text-2xl font-bold text-gray-800">Payment Failed</h2>
            <p className="text-gray-600 mt-2">We couldn't finalize the transaction. If money was taken from your account, please contact support.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-8 w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Result;
