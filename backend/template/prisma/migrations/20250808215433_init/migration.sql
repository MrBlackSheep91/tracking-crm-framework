-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST', 'ON_HOLD', 'NURTURING', 'CONVERTED', 'UNQUALIFIED', 'INACTIVE', 'CHURNED');

-- CreateEnum
CREATE TYPE "public"."LeadStage" AS ENUM ('AWARENESS', 'INTEREST', 'CONSIDERATION', 'INTENT', 'EVALUATION', 'PURCHASE', 'RETENTION', 'ADVOCACY', 'PROSPECT', 'OPPORTUNITY', 'HOT_LEAD', 'CUSTOMER', 'LOST');

-- CreateEnum
CREATE TYPE "public"."ChannelType" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS', 'CALL', 'MEETING', 'SOCIAL', 'CHAT', 'PUSH', 'WEB', 'CUSTOM');

-- CreateTable
CREATE TABLE "public"."businesses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "subdomain" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."business_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "business_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "salutation" TEXT,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "emailOptIn" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "mobile" TEXT,
    "fax" TEXT,
    "company" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "addressType" TEXT,
    "street" TEXT,
    "street2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "website" TEXT,
    "type" TEXT,
    "status" TEXT,
    "source" TEXT,
    "sourceDetail" TEXT,
    "tags" TEXT[],
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "lastActivity" TIMESTAMP(3),
    "locale" TEXT,
    "timezone" TEXT,
    "customFields" JSONB,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."interactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contactId" UUID,
    "leadId" UUID,
    "businessId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "status" TEXT,
    "priority" TEXT,
    "assignedTo" UUID,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "source" TEXT,
    "sourceId" TEXT,
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."visitor_sessions" (
    "id" UUID NOT NULL,
    "visitorId" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "totalActiveTime" INTEGER,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "browserVersion" TEXT,
    "operatingSystem" TEXT,
    "osVersion" TEXT,
    "screenResolution" TEXT,
    "screenSize" TEXT,
    "timezone" TEXT,
    "language" TEXT,
    "ipAddress" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "entryUrl" TEXT,
    "exitUrl" TEXT,
    "pagesViewed" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "scrollDepthMax" INTEGER,
    "pagesVisited" TEXT[],
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "fbclid" TEXT,
    "gclid" TEXT,
    "aiAnalysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "visitorId" UUID NOT NULL,
    "sessionId" UUID,
    "formId" TEXT,
    "formType" TEXT,
    "email" TEXT,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "jobTitle" TEXT,
    "status" "public"."LeadStatus" NOT NULL DEFAULT 'NEW',
    "stage" "public"."LeadStage" NOT NULL DEFAULT 'PROSPECT',
    "score" INTEGER NOT NULL DEFAULT 0,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "leadType" TEXT,
    "campaignId" TEXT,
    "campaignName" TEXT,
    "processType" TEXT,
    "source" TEXT,
    "medium" TEXT,
    "content" TEXT,
    "term" TEXT,
    "fbclid" TEXT,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "convertedAt" TIMESTAMP(3),
    "convertedTo" TEXT,
    "convertedId" TEXT,
    "conversionPage" TEXT,
    "interactionType" TEXT,
    "interactionSource" TEXT,
    "interactionDescription" TEXT,
    "timeOnPage" DOUBLE PRECISION,
    "scrollPercentage" INTEGER,
    "emailFunnelStatus" TEXT,
    "emailSequenceStep" INTEGER,
    "emailLastOpen" TIMESTAMP(3),
    "emailLastClick" TIMESTAMP(3),
    "whatsappStatus" TEXT,
    "whatsappSequenceStep" INTEGER,
    "whatsappLastReply" TIMESTAMP(3),
    "customFields" JSONB,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."channel_statuses" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "leadId" UUID,
    "contactId" UUID,
    "channel" "public"."ChannelType" NOT NULL,
    "status" TEXT NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 1,
    "nextStepDate" TIMESTAMP(3),
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "messagesReceived" INTEGER NOT NULL DEFAULT 0,
    "lastMessageDate" TIMESTAMP(3),
    "lastResponseDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "channel_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activities" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "leadId" UUID,
    "contactId" UUID,
    "title" TEXT,
    "description" TEXT,
    "pageInfo" JSONB,
    "metadata" JSONB,
    "createdBy" UUID,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."custom_fields" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "contactId" UUID,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueType" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_scores" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "behavior" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."visitors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "fingerprint" TEXT,
    "sessionId" UUID,
    "visitorId" TEXT,
    "clientIP" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "timezone" TEXT,
    "language" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "operatingSystem" TEXT,
    "screenSize" TEXT,
    "screenResolution" TEXT,
    "firstVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisitAt" TIMESTAMP(3) NOT NULL,
    "lastActivity" TIMESTAMP(3),
    "sessionsCount" INTEGER NOT NULL DEFAULT 1,
    "totalTimeOnSite" INTEGER DEFAULT 0,
    "pagesVisited" INTEGER DEFAULT 0,
    "pageViews" INTEGER DEFAULT 0,
    "maxScrollPercentage" INTEGER DEFAULT 0,
    "firstSource" TEXT,
    "firstMedium" TEXT,
    "firstCampaign" TEXT,
    "firstReferrer" TEXT,
    "utmParams" JSONB,
    "hasHighEngagement" BOOLEAN NOT NULL DEFAULT false,
    "engagementScore" INTEGER DEFAULT 0,
    "contactId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tracking_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "visitorId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventCategory" TEXT,
    "eventAction" TEXT,
    "pageUrl" TEXT NOT NULL,
    "pageTitle" TEXT,
    "referrer" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetElement" TEXT,
    "targetText" TEXT,
    "targetType" TEXT,
    "targetClasses" TEXT,
    "eventValue" DOUBLE PRECISION,
    "metadata" JSONB,
    "elementInfo" JSONB,
    "eventData" JSONB,
    "eventDetail" JSONB,
    "conversionType" TEXT,
    "conversionValue" DOUBLE PRECISION,
    "conversionSuccess" BOOLEAN,
    "conversionAttemptId" TEXT,
    "formId" TEXT,
    "formFields" JSONB,
    "formErrors" JSONB,
    "formEmptyFields" INTEGER,
    "formEmptyRequiredFields" JSONB,
    "formIsValid" BOOLEAN,
    "formWillSubmit" BOOLEAN,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "pageLoadTime" INTEGER,
    "clientGeneratedAt" TIMESTAMP(3),
    "timeToGenerate" INTEGER,
    "timeToSend" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "businesses_subdomain_key" ON "public"."businesses"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "business_users_businessId_userId_key" ON "public"."business_users"("businessId", "userId");

-- CreateIndex
CREATE INDEX "contacts_businessId_idx" ON "public"."contacts"("businessId");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "public"."contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_phone_idx" ON "public"."contacts"("phone");

-- CreateIndex
CREATE INDEX "contacts_status_idx" ON "public"."contacts"("status");

-- CreateIndex
CREATE INDEX "contacts_type_idx" ON "public"."contacts"("type");

-- CreateIndex
CREATE INDEX "contacts_createdAt_idx" ON "public"."contacts"("createdAt");

-- CreateIndex
CREATE INDEX "contacts_leadScore_idx" ON "public"."contacts"("leadScore");

-- CreateIndex
CREATE INDEX "contacts_lastActivity_idx" ON "public"."contacts"("lastActivity");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_businessId_email_key" ON "public"."contacts"("businessId", "email");

-- CreateIndex
CREATE INDEX "interactions_businessId_idx" ON "public"."interactions"("businessId");

-- CreateIndex
CREATE INDEX "interactions_contactId_idx" ON "public"."interactions"("contactId");

-- CreateIndex
CREATE INDEX "interactions_leadId_idx" ON "public"."interactions"("leadId");

-- CreateIndex
CREATE INDEX "interactions_type_idx" ON "public"."interactions"("type");

-- CreateIndex
CREATE INDEX "interactions_date_idx" ON "public"."interactions"("date");

-- CreateIndex
CREATE INDEX "interactions_status_idx" ON "public"."interactions"("status");

-- CreateIndex
CREATE INDEX "interactions_assignedTo_idx" ON "public"."interactions"("assignedTo");

-- CreateIndex
CREATE INDEX "visitor_sessions_visitorId_idx" ON "public"."visitor_sessions"("visitorId");

-- CreateIndex
CREATE INDEX "visitor_sessions_startedAt_idx" ON "public"."visitor_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "visitor_sessions_businessId_startedAt_idx" ON "public"."visitor_sessions"("businessId", "startedAt");

-- CreateIndex
CREATE INDEX "leads_businessId_idx" ON "public"."leads"("businessId");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "public"."leads"("email");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "public"."leads"("status");

-- CreateIndex
CREATE INDEX "leads_stage_idx" ON "public"."leads"("stage");

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "public"."leads"("createdAt");

-- CreateIndex
CREATE INDEX "leads_visitorId_idx" ON "public"."leads"("visitorId");

-- CreateIndex
CREATE INDEX "leads_sessionId_idx" ON "public"."leads"("sessionId");

-- CreateIndex
CREATE INDEX "leads_formId_idx" ON "public"."leads"("formId");

-- CreateIndex
CREATE INDEX "leads_score_idx" ON "public"."leads"("score");

-- CreateIndex
CREATE INDEX "leads_isHot_idx" ON "public"."leads"("isHot");

-- CreateIndex
CREATE INDEX "leads_campaignId_idx" ON "public"."leads"("campaignId");

-- CreateIndex
CREATE INDEX "channel_statuses_businessId_channel_idx" ON "public"."channel_statuses"("businessId", "channel");

-- CreateIndex
CREATE INDEX "channel_statuses_nextStepDate_idx" ON "public"."channel_statuses"("nextStepDate");

-- CreateIndex
CREATE UNIQUE INDEX "channel_statuses_leadId_channel_key" ON "public"."channel_statuses"("leadId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "channel_statuses_contactId_channel_key" ON "public"."channel_statuses"("contactId", "channel");

-- CreateIndex
CREATE INDEX "activities_businessId_type_idx" ON "public"."activities"("businessId", "type");

-- CreateIndex
CREATE INDEX "activities_entityType_entityId_idx" ON "public"."activities"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "activities_createdAt_idx" ON "public"."activities"("createdAt");

-- CreateIndex
CREATE INDEX "activities_leadId_idx" ON "public"."activities"("leadId");

-- CreateIndex
CREATE INDEX "activities_contactId_idx" ON "public"."activities"("contactId");

-- CreateIndex
CREATE INDEX "custom_fields_businessId_key_idx" ON "public"."custom_fields"("businessId", "key");

-- CreateIndex
CREATE INDEX "custom_fields_value_idx" ON "public"."custom_fields"("value");

-- CreateIndex
CREATE UNIQUE INDEX "custom_fields_entityType_entityId_key_key" ON "public"."custom_fields"("entityType", "entityId", "key");

-- CreateIndex
CREATE INDEX "lead_scores_leadId_idx" ON "public"."lead_scores"("leadId");

-- CreateIndex
CREATE INDEX "lead_scores_behavior_idx" ON "public"."lead_scores"("behavior");

-- CreateIndex
CREATE INDEX "visitors_businessId_idx" ON "public"."visitors"("businessId");

-- CreateIndex
CREATE INDEX "visitors_fingerprint_idx" ON "public"."visitors"("fingerprint");

-- CreateIndex
CREATE INDEX "visitors_sessionId_idx" ON "public"."visitors"("sessionId");

-- CreateIndex
CREATE INDEX "visitors_clientIP_idx" ON "public"."visitors"("clientIP");

-- CreateIndex
CREATE INDEX "visitors_createdAt_idx" ON "public"."visitors"("createdAt");

-- CreateIndex
CREATE INDEX "visitors_lastActivity_idx" ON "public"."visitors"("lastActivity");

-- CreateIndex
CREATE INDEX "tracking_events_businessId_idx" ON "public"."tracking_events"("businessId");

-- CreateIndex
CREATE INDEX "tracking_events_visitorId_idx" ON "public"."tracking_events"("visitorId");

-- CreateIndex
CREATE INDEX "tracking_events_sessionId_idx" ON "public"."tracking_events"("sessionId");

-- CreateIndex
CREATE INDEX "tracking_events_eventType_idx" ON "public"."tracking_events"("eventType");

-- CreateIndex
CREATE INDEX "tracking_events_eventCategory_idx" ON "public"."tracking_events"("eventCategory");

-- CreateIndex
CREATE INDEX "tracking_events_eventAction_idx" ON "public"."tracking_events"("eventAction");

-- CreateIndex
CREATE INDEX "tracking_events_pageUrl_idx" ON "public"."tracking_events"("pageUrl");

-- CreateIndex
CREATE INDEX "tracking_events_timestamp_idx" ON "public"."tracking_events"("timestamp");

-- CreateIndex
CREATE INDEX "tracking_events_createdAt_idx" ON "public"."tracking_events"("createdAt");

-- CreateIndex
CREATE INDEX "tracking_events_conversionType_idx" ON "public"."tracking_events"("conversionType");

-- CreateIndex
CREATE INDEX "tracking_events_conversionSuccess_idx" ON "public"."tracking_events"("conversionSuccess");

-- CreateIndex
CREATE INDEX "tracking_events_formWillSubmit_idx" ON "public"."tracking_events"("formWillSubmit");

-- CreateIndex
CREATE INDEX "tracking_events_conversionAttemptId_idx" ON "public"."tracking_events"("conversionAttemptId");

-- AddForeignKey
ALTER TABLE "public"."business_users" ADD CONSTRAINT "business_users_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."business_users" ADD CONSTRAINT "business_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interactions" ADD CONSTRAINT "interactions_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interactions" ADD CONSTRAINT "interactions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interactions" ADD CONSTRAINT "interactions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visitor_sessions" ADD CONSTRAINT "visitor_sessions_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "public"."visitors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visitor_sessions" ADD CONSTRAINT "visitor_sessions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "public"."visitors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."visitor_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."channel_statuses" ADD CONSTRAINT "channel_statuses_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."channel_statuses" ADD CONSTRAINT "channel_statuses_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."channel_statuses" ADD CONSTRAINT "channel_statuses_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custom_fields" ADD CONSTRAINT "custom_fields_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custom_fields" ADD CONSTRAINT "custom_fields_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_scores" ADD CONSTRAINT "lead_scores_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_scores" ADD CONSTRAINT "lead_scores_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visitors" ADD CONSTRAINT "visitors_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visitors" ADD CONSTRAINT "visitors_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tracking_events" ADD CONSTRAINT "tracking_events_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tracking_events" ADD CONSTRAINT "tracking_events_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "public"."visitors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tracking_events" ADD CONSTRAINT "tracking_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."visitor_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
