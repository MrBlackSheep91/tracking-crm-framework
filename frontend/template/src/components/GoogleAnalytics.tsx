import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initGoogleAnalytics, trackPageView } from '../utils/googleAnalytics';

// Get the GA4 Measurement ID from environment variables
const GA_MEASUREMENT_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;

// Extend window interface for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Google Analytics Component
 * Initializes Google Analytics and handles page view tracking
 */
const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
      // Initialize Google Analytics if measurement ID exists
    if (GA_MEASUREMENT_ID) {
      // Initialize with default consent (denied)
      window.gtag = window.gtag || function() {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(arguments);
      };
      
      // Set default consent (will be updated by the ConsentBanner component)
      window.gtag('consent', 'default', {
        'ad_storage': 'denied',
        'analytics_storage': 'denied',
        'personalization_storage': 'denied',
        'functionality_storage': 'granted',
        'security_storage': 'granted',
      });
      
      // Initialize GA4
      initGoogleAnalytics(GA_MEASUREMENT_ID);
      
      console.log('Google Analytics initialized with Consent Mode');
    } else {
      console.warn('Google Analytics Measurement ID not found. Please set VITE_GOOGLE_ANALYTICS_ID in your .env file.');
    }
  }, []);

  // Track page views when the route changes
  useEffect(() => {
    if (GA_MEASUREMENT_ID && typeof window !== 'undefined') {
      trackPageView(location.pathname + location.search, document.title);
    }
  }, [location]);

  // Add the Google Analytics script to the document head
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof document === 'undefined') return;

    // Check if the script is already added
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
      return;
    }

    // Create and append the Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Cleanup function to remove the script if the component unmounts
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [GA_MEASUREMENT_ID]);

  return null; // This component doesn't render anything
};

export default GoogleAnalytics;
