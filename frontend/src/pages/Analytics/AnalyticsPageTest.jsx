import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';

const AnalyticsPageTest = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testAPI = async () => {
      console.log('🔄 Testing analytics API...');
      try {
        const response = await analyticsAPI.getSpendingByCategory({ period: 'thisMonth' });
        console.log('✅ Analytics API response:', response.data);
      } catch (error) {
        console.error('❌ Analytics API error:', error);
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  if (loading) {
    return <div>Loading analytics test...</div>;
  }

  return (
    <div>
      <h1>Analytics Test Page</h1>
      <p>Check the browser console for API response details.</p>
    </div>
  );
};

export default AnalyticsPageTest;
