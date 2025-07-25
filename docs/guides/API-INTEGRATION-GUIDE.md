# API Integration Guide for Tracking CRM Framework

This guide outlines the primary API endpoints provided by the backend server (`server.ts`) for integrating tracking and CRM functionalities into new web applications. It also details the expected payloads and responses for each endpoint.

## 1. Tracking Endpoint: `POST /api/track`

This is the main endpoint for sending visitor tracking data, including session information and events. The backend handles session management, event aggregation, and routes the data to relevant n8n micro-workflows (VISITOR_PROCESSOR, CONVERSION_DETECTOR, ACTIVITY_LOGGER).

### Request

-   **Method:** `POST`
-   **URL:** `/api/track`
-   **Content-Type:** `application/json`

#### Request Body (JSON Structure)

```json
{
  "session": {
    "sessionId": "string",
    "visitorId": "string",
    "currentUrl": "string",
    "referrer": "string",
    "userAgent": "string",
    "language": "string",
    "screenResolution": "string",
    "platform": "string",
    "deviceType": "string",
    "ipAddress": "string",
    "location": {
      "country": "string",
      "city": "string",
      "region": "string"
    },
    "initialTimestamp": "ISO 8601 datetime string",
    "lastActivityTimestamp": "ISO 8601 datetime string",
    "duration": "number" // in milliseconds
  },
  "events": [
    {
      "type": "string", // e.g., "page_view", "button_click", "form_interaction", "scroll_milestone", "exit_intent"
      "name": "string", // e.g., "/home", "addToCartButton", "contactFormSubmit"
      "timestamp": "ISO 8601 datetime string",
      "data": {},
      "metadata": {}
    }
    // ... more event objects
  ]
}
```

**Key Fields Explanation:**

-   **`session`**: Object containing detailed information about the visitor's session.
    -   `sessionId`: Unique identifier for the current session. **Required.**
    -   `visitorId`: Unique identifier for the visitor (can persist across sessions).
    -   `currentUrl`, `referrer`, `userAgent`, `language`, `screenResolution`, `platform`, `deviceType`, `ipAddress`, `location`: Standard browser and geographical information.
    -   `initialTimestamp`, `lastActivityTimestamp`, `duration`: Timestamps and duration of the session.
-   **`events`**: An array of event objects that occurred during the session.
    -   `type`: The type of event (e.g., `page_view`, `button_click`).
    -   `name`: A descriptive name for the event (e.g., the URL for a page view, the ID of a clicked button).
    -   `timestamp`: When the event occurred.
    -   `data`: (Optional) A JSON object containing event-specific data (e.g., form fields, product IDs).
    -   `metadata`: (Optional) A JSON object for additional context (e.g., attribution, device details).

### Response

-   **Status:** `200 OK` on success, `500 Internal Server Error` on failure.

#### Success Response Body (JSON Structure)

```json
{
  "success": true,
  "sessionId": "string",
  "eventsReceived": "number", // Number of events received in this request
  "totalEvents": "number"     // Total events accumulated for this session
}
```

Or, if the session is finalized (e.g., due to timeout or explicit end):

```json
{
  "success": true,
  "message": "Sesión finalizada y enviada.",
  "result": {} // Result from n8n workflow processing
}
```

#### Error Response Body (JSON Structure)

```json
{
  "error": "string" // Description of the error
}
```

## 2. Lead Capture Endpoint: `POST /api/lead`

This endpoint is designed for direct lead capture, typically from submission forms. The data is routed to the `LEAD_PROCESSOR` n8n micro-workflow.

### Request

-   **Method:** `POST`
-   **URL:** `/api/lead`
-   **Content-Type:** `application/json`

#### Request Body (JSON Structure)

```json
{
  "email": "string", // Required
  "name": "string",  // Optional
  "phone": "string", // Optional
  "message": "string", // Optional
  "source": "string",  // Optional, e.g., "contactForm", "newsletterSignup"
  "metadata": {}     // Optional, additional lead-specific data
}
```

### Response

-   **Status:** `200 OK` on success, `500 Internal Server Error` on failure.

#### Success Response Body (JSON Structure)

(Response is typically delegated from the n8n workflow, so it can vary. Generally, it will reflect the success of the lead processing.)

```json
{
  "success": true,
  "message": "Lead processed successfully."
  // ... other data from n8n workflow
}
```

#### Error Response Body (JSON Structure)

```json
{
  "error": "string" // Description of the error
}
```

## 3. Micro-Workflow Testing Endpoint: `POST /api/test-microworkflow`

This endpoint allows for direct testing of specific n8n micro-workflows by sending a custom payload. It's primarily for development and debugging purposes.

### Request

-   **Method:** `POST`
-   **URL:** `/api/test-microworkflow`
-   **Content-Type:** `application/json`

#### Request Body (JSON Structure)

```json
{
  "workflow": "string", // Name of the workflow (e.g., "VISITOR_PROCESSOR", "LEAD_PROCESSOR")
  "payload": {}         // Custom payload to send to the workflow
}
```

**Available Workflows (from `MICROWORKFLOW_URLS` in `server.ts`):**

-   `VISITOR_PROCESSOR`
-   `LEAD_PROCESSOR`
-   `CONVERSION_DETECTOR`
-   `ACTIVITY_LOGGER`

### Response

-   **Status:** `200 OK` on success, `400 Bad Request` for invalid workflow, `500 Internal Server Error` on failure.

#### Success Response Body (JSON Structure)

(Response is delegated from the n8n workflow, reflecting the result of the workflow execution.)

```json
{
  "success": true,
  "data": {} // Data returned by the n8n workflow
}
```

#### Error Response Body (JSON Structure)

```json
{
  "error": "string" // Description of the error
}
```

## 4. System Statistics Endpoint: `GET /api/stats`

This endpoint provides real-time statistics about the backend server, including active sessions, configured micro-workflows, and server performance metrics.

### Request

-   **Method:** `GET`
-   **URL:** `/api/stats`

### Response

-   **Status:** `200 OK`

#### Success Response Body (JSON Structure)

```json
{
  "activeSessions": "number",
  "sessionDetails": [
    {
      "sessionId": "string",
      "events": "number",
      "lastUpdate": "string" // ISO 8601 datetime string
    }
  ],
  "microworkflows": {
    "VISITOR_PROCESSOR": "string", // URL
    "LEAD_PROCESSOR": "string",    // URL
    "CONVERSION_DETECTOR": "string", // URL
    "ACTIVITY_LOGGER": "string"    // URL
  },
  "uptime": "number", // in seconds
  "memory": {
    "rss": "number",
    "heapTotal": "number",
    "heapUsed": "number",
    "external": "number",
    "arrayBuffers": "number"
  }
}
```

## 5. Health Check Endpoint: `GET /health`

A simple endpoint to check if the server is running and responsive.

### Request

-   **Method:** `GET`
-   **URL:** `/health`

### Response

-   **Status:** `200 OK`

#### Success Response Body (Plain Text)

```
OK
```

This document will be expanded with more detailed examples and integration steps for specific frontend frameworks in subsequent guides.
