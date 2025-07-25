/**
 * Google Analytics 4 (GA4) Integration
 * This module provides functions to initialize and track events with Google Analytics 4
 */

// Extend Window interface to include gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Initialize Google Analytics 4
 * @param measurementId - The GA4 Measurement ID (e.g., 'G-XXXXXXXXXX')
 */
export const initGoogleAnalytics = (measurementId: string) => {
  // Only initialize in browser
  if (typeof window === 'undefined') return;

  // Initialize data layer if it doesn't exist
  window.dataLayer = window.dataLayer || [];
  
  // Define gtag function
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  // Set the current date
  window.gtag('js', new Date());
  
  // Configure the measurement ID
  window.gtag('config', measurementId);
  
  console.log(`Google Analytics 4 initialized with ID: ${measurementId}`);
};

/**
 * Track a page view
 * @param pagePath - The path of the page being viewed (e.g., '/home')
 * @param pageTitle - The title of the page (optional)
 */
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
};

/**
 * Track a custom event
 * @param eventName - The name of the event to track
 * @param eventParams - Additional parameters for the event
 */
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', eventName, eventParams);
};

// Common event tracking functions
export const trackSignUp = (method: string) => {
  trackEvent('sign_up', { method });
};

export const trackLogin = (method: string) => {
  trackEvent('login', { method });
};

export const trackPurchase = (value: number, currency: string, items: any[]) => {
  trackEvent('purchase', {
    value,
    currency,
    items,
  });
};
