# Frontend Integration Guide for Tracking CRM Framework

This guide provides instructions and code examples for integrating the tracking and lead capture functionalities into a new web application's frontend. It now focuses on a **modular and "white-label" approach**, allowing for easier reuse across different projects.

## 1. Modular Approach: Reusable Packages

To facilitate reusability and maintainability, the framework's frontend functionalities are now organized into two conceptual packages:

*   **`@tracking-crm/core`**: Contains the core tracking services, utilities, and tracking-specific UI components. This package is designed to be framework-agnostic where possible, or provide adapters for common frameworks.
*   **`@tracking-crm/ui-components`**: Contains generic UI components (e.g., Hero, Testimonials, Header, Footer) that are designed to be highly configurable via a centralized site configuration.

## 2. Centralized Site Configuration (`site-config.json`)

To enable easy customization and "white-labeling" of your frontend, a `site-config.json` file is used to define content, features, and tracking-specific settings. This file acts as a single source of truth for your site's configuration.

An example template can be found at `config/templates/site-config.json.template`.

**Example `site-config.json` structure:**

```json
{
  "siteName": "My New Awesome Site",
  "domain": "mynewsite.com",
  "tracking": {
    "backendUrl": "/api",
    "googleAnalyticsId": "UA-XXXXX-Y",
    "debugMode": false
  },
  "heroSection": {
    "title": "Your Awesome Product/Service",
    "subtitle": "A compelling subtitle that highlights your value proposition.",
    "ctaButtonText": "Learn More",
    "ctaButtonLink": "/learn-more",
    "image": "/assets/hero-image.jpg"
  },
  "testimonialsSection": {
    "title": "What Our Customers Say",
    "testimonials": [
      {
        "quote": "This product changed my life! Highly recommend.",
        "author": "Jane Doe",
        "company": "Tech Solutions"
      }
    ]
  }
  // ... other sections like faqSection, contactInfo
}
```

Your frontend application should load this `site-config.json` at startup and pass relevant parts of it as props to the UI components or use it to initialize tracking services.

## 3. Core Tracking Integration

The core tracking involves sending session and event data to the `POST /api/track` endpoint of the backend server. This is handled by services provided in the `@tracking-crm/core` package.

### 3.1. Initialize Tracking and Use Services

First, ensure you have `axios` or `fetch` available for making HTTP requests. Then, import and initialize the tracking service from the core package. The `BACKEND_URL` should ideally be read from your `site-config.json` or an environment variable.

```javascript
// In your main application entry point (e.g., App.js, main.ts)

import { initializeTracking, trackEvent } from '@tracking-crm/core/services/trackingService';
import { submitLead } from '@tracking-crm/core/services/leadService';

// Assuming you load your siteConfig.json
import siteConfig from './site-config.json'; // Adjust path as needed

// Initialize tracking with backend URL from config
initializeTracking(siteConfig.tracking.backendUrl);

// Example usage in a React Component:
// MyComponent.jsx (or .tsx)

import React, { useEffect } from 'react';
import { trackEvent } from '@tracking-crm/core/services/trackingService'; // Adjust path as needed

function MyComponent() {
  useEffect(() => {
    // Track page view when component mounts
    trackEvent('page_view', '/my-component-page');
  }, []);

  const handleButtonClick = () => {
    trackEvent('button_click', 'myButtonId', { buttonText: 'Click Me' });
    alert('Button clicked!');
  };

  return (
    <div>
      <h1>Welcome to My Component</h1>
      <button onClick={handleButtonClick}>Click Me</button>
    </div>
  );
}

export default MyComponent;

// Example: Form Interaction Tracking
// MyForm.jsx

import React, { useState } from 'react';
import { trackEvent } from '@tracking-crm/core/services/trackingService';
import { submitLead } from '@tracking-crm/core/services/leadService';

function MyForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    trackEvent('form_interaction', 'contactFormSubmit', { formName: 'Contact Us', fields: Object.keys(formData) });
    
    // Example of submitting lead data using the core service
    const leadInfo = { email: formData.email, name: formData.name };
    const result = await submitLead(siteConfig.tracking.backendUrl, leadInfo);
    if (result.success) {
      alert('Form submitted and lead captured!');
    } else {
      alert('Failed to capture lead: ' + result.error);
    }
    console.log('Form Data:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
      <button type="submit">Submit</button>
    </form>
  );
}

export default MyForm;
```

## 4. UI Components Integration

Generic UI components like `Hero`, `Testimonials`, `Header`, and `Footer` can be imported from `@tracking-crm/ui-components` and configured using data from your `site-config.json`.

```javascript
// Example: App.js (or a page component)

import React from 'react';
import { Hero, Testimonials } from '@tracking-crm/ui-components'; // Adjust imports as needed
import siteConfig from './site-config.json'; // Adjust path as needed

function App() {
  return (
    <div>
      <Hero 
        title={siteConfig.heroSection.title}
        subtitle={siteConfig.heroSection.subtitle}
        ctaButtonText={siteConfig.heroSection.ctaButtonText}
        ctaButtonLink={siteConfig.heroSection.ctaButtonLink}
        image={siteConfig.heroSection.image}
      />
      <Testimonials 
        title={siteConfig.testimonialsSection.title}
        testimonials={siteConfig.testimonialsSection.testimonials}
      />
      {/* ... other components */}
    </div>
  );
}

export default App;
```

## 5. Environment Configuration

While `site-config.json` handles most content and feature configurations, sensitive or environment-specific variables (like API keys, or specific backend URLs that might differ per deployment environment) should still be managed via `.env` files.

Example for Vite:

```
# .env
VITE_BACKEND_API_BASE_URL=http://localhost:3001/api
# VITE_BACKEND_API_BASE_URL=https://your-production-backend.com/api
```

And access it in your JavaScript/TypeScript code via `import.meta.env.VITE_BACKEND_API_BASE_URL`. Note that `site-config.json` can then reference this base URL for its `backendUrl` if needed.

This guide provides a foundation for integrating the modular tracking CRM framework. The `ejemplo-tienda/frontend` directory in the framework will be updated to provide a more complete example of a frontend application integrated with this new modular system.
