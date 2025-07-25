# n8n Workflow Deployment Guide for Tracking CRM Framework

This guide outlines the steps to deploy and configure the n8n micro-workflows included in the Tracking CRM Framework. These workflows are essential for processing visitor data, managing leads, detecting conversions, and logging activities.

## 1. n8n Setup and Access

Before deploying the workflows, ensure you have an n8n instance running and accessible. This can be:

-   **Locally via Docker:** Use the `docker-compose.template.yml` provided in the `config/templates` directory to set up n8n alongside your backend and database.
-   **Cloud Deployment:** Deploy n8n to a cloud provider (e.g., AWS, DigitalOcean, Heroku).

Ensure your n8n instance is configured with persistent storage for workflows and credentials.

## 2. Importing Workflows

The n8n workflows are provided as `.json` files in the `n8n-workflows/core-workflows` directory. You can import them into your n8n instance using one of the following methods:

### 2.1. Using the n8n UI (Manual Import)

1.  **Access n8n UI:** Open your n8n instance in a web browser (e.g., `http://localhost:5678`).
2.  **Go to Workflows:** Navigate to the "Workflows" section.
3.  **Import from File:** Click on "New" or the "+" icon, then select "Import from File".
4.  **Select Workflow Files:** Browse to the `n8n-workflows/core-workflows` directory in your framework and select each `.json` file (e.g., `01-VISITOR-PROCESSOR.json`, `02-CONVERSION-DETECTOR.json`, etc.) to import them one by one.
5.  **Activate Workflows:** After importing each workflow, ensure it is activated by toggling the "Active" switch in the top right corner of the workflow editor. **This is a critical step for webhooks to be registered and functional.**

### 2.2. Using the `import-workflows.sh` Script (Automated Import)

The framework includes a convenience script `scripts/deployment/import-workflows.sh` that automates the import process using the n8n API. This method requires n8n to be accessible via its API and potentially an API key.

#### Prerequisites for Automated Import:

-   **n8n API Key:** For production environments, it's highly recommended to use an API key for authentication. You can generate one in your n8n UI under "Settings" -> "My Profile" -> "API Keys".
-   **n8n URL:** The script needs to know the URL of your n8n instance.

#### How to Use the Script:

1.  **Configure Environment Variables:**
    Set the `N8N_ENDPOINT` environment variable to your n8n instance's URL (e.g., `http://localhost:5678`).
    If using an API key, set `N8N_API_KEY`.

    ```bash
    export N8N_ENDPOINT="http://localhost:5678"
    export N8N_API_KEY="your_n8n_api_key_here" # Only if authentication is enabled
    ```

2.  **Run the Script:** Navigate to the root of your `tracking-crm-framework` directory and execute the script:

    ```bash
    ./scripts/deployment/import-workflows.sh
    ```

    The script will iterate through all `.json` files in `n8n-workflows/core-workflows` and attempt to import and activate them. It will also try to activate existing workflows if they are found but inactive.

    **Note:** The script attempts to activate workflows. If your n8n instance requires authentication and you haven't provided `N8N_API_KEY`, the activation might fail with an "Unauthorized" error. You might need to manually activate them via the UI or configure authentication properly.

## 3. Configuring Webhook URLs in the Backend

Once the n8n workflows are imported and activated, their webhooks will be live. The backend server (`server.ts`) needs to know the correct URLs for these webhooks.

These URLs are configured via environment variables in your backend's `.env` file (or `docker-compose.yml` if using Docker).

Refer to the `config/templates/.env.template` file for the required environment variables:

```dotenv
# .env.template example
VISITOR_PROCESSOR_URL=http://n8n:5678/webhook/visitor-processor
LEAD_PROCESSOR_URL=http://n8n:5678/webhook/lead-processor
CONVERSION_DETECTOR_URL=http://n8n:5678/webhook/conversion-detector
ACTIVITY_LOGGER_URL=http://n8n:5678/webhook/activity-logger
# ... other n8n webhook URLs as needed
```

**Important Considerations:**

-   **Internal vs. External URLs:** If your n8n instance is running in the same Docker network as your backend, you can use internal Docker service names (e.g., `http://n8n:5678`). If n8n is external (e.g., a cloud deployment), use its public URL.
-   **Webhook Paths:** Ensure the webhook paths (`/webhook/visitor-processor`, etc.) match the paths defined in your n8n workflows.

## 4. Verifying Deployment

After importing workflows and configuring backend URLs:

1.  **Check n8n UI:** Confirm all imported workflows are active.
2.  **Test Endpoints:** Use the backend's `POST /api/test-microworkflow` endpoint or the `scripts/deployment/n8n-node-tester.sh` script to send test payloads to each workflow and verify they are processing correctly.
3.  **Monitor n8n Executions:** Check the "Executions" tab within n8n for each workflow to see if they are being triggered and completing successfully. Look for any errors in the execution logs.

By following these steps, you can successfully deploy and integrate the n8n workflows into your new web application using the Tracking CRM Framework.
