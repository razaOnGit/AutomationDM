frontend/ (Your existing frontend structure)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
backend/
│   ├── src/
│   │   ├── app.ts                  # Main Express app setup
│   │   ├── server.ts               # Server bootstrap
│   │   ├── config/                 # Environment variables, constants
│   │   │   ├── index.ts
│   │   │   └── secrets.ts (gitignore)
│   │   ├── controllers/            # Handle incoming requests, call services
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── workflowController.ts
│   │   │   └── instagramController.ts
│   │   ├── services/               # Business logic, interaction with DB/external APIs
│   │   │   ├── authService.ts
│   │   │   ├── userService.ts
│   │   │   ├── workflowService.ts
│   │   │   ├── instagramApiService.ts # Meta Graph API interactions
│   │   │   └── dmAutomationService.ts # Core automation logic
│   │   ├── models/                 # Prisma schema definitions (or direct ORM interactions)
│   │   │   ├── schema.prisma       # Prisma Schema
│   │   │   └── index.ts (Prisma client instance)
│   │   ├── routes/                 # API endpoint definitions
│   │   │   ├── authRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   ├── workflowRoutes.ts
│   │   │   └── instagramRoutes.ts
│   │   ├── middleware/             # Express middleware (auth, error handling)
│   │   │   ├── authMiddleware.ts
│   │   │   └── errorHandler.ts
│   │   ├── utils/                  # Helper functions (validation, logging)
│   │   │   ├── validationSchemas.ts (Joi schemas)
│   │   │   ├── logger.ts
│   │   │   └── queue.ts (BullMQ queue setup)
│   │   ├── jobs/                   # BullMQ job definitions
│   │   │   ├── commentMonitorJob.ts
│   │   │   └── dmSendJob.ts
│   │   └── workers/                # BullMQ worker processes
│   │       ├── dmWorker.ts
│   │       └── commentMonitorWorker.ts
│   ├── prisma/                     # Prisma migrations and client
│   │   └── migrations/
│   ├── .env.example
│   ├── tsconfig.json
│   ├── package.json
│   └── ...
2.2 Full-Stack Architecture (MVC Pattern)
Client (Frontend - View):

React.js application responsible for UI rendering, user interactions, and making API requests to the Backend.

Manages local UI state and synchronizes with server state using React Query.

Server (Backend - Model & Controller):

Controllers: (e.g., workflowController.ts) Receive HTTP requests from the frontend, validate inputs, delegate tasks to services, and send JSON responses. They act as the "C" in MVC.

Services (Business Logic - Model): (e.g., workflowService.ts, instagramApiService.ts) Contain the core business rules. They interact with the database (via Prisma), communicate with external APIs (Meta Graph API), and orchestrate complex operations. This represents the "M" (Model) logic.

Models (Data Persistence - Model): (Defined by schema.prisma and managed by Prisma) Represent the data structures and handle interactions with the PostgreSQL database. This is the "M" (Model) data layer.

Job Queues & Workers: BullMQ queues manage asynchronous tasks like fetching comments and sending DMs, ensuring reliability and scalability.

Database:

PostgreSQL: Primary data store for users, workflow configurations, saved DM templates, and monitoring data.

Redis: Used by BullMQ for job queues and pub/sub, also ideal for caching frequently accessed but less critical data, and for rate limiting mechanisms.

2.3 MCP-Enhanced Development Workflow (Full-Stack)
Configure Windsurf to leverage MCP servers for both frontend and backend development:

Backend Boilerplate Generation: Auto-generate Express routes, controllers, service stubs, and Prisma schema entries.

API Design: Assist in designing RESTful API endpoints and their request/response schemas.

ORM Model Generation: Generate Prisma models directly from database schema ideas or vice-versa.

Authentication Flow: Assist in setting up Passport.js strategies and JWT token handling.

Task Queue Definitions: Help in defining BullMQ job structures and worker implementations.

Validation: Generate Joi/Zod schemas for backend request validation.

Testing: Generate unit and integration tests for backend services and controllers.

Phase 3: Core Backend & Database Development
3.1 Database Design (Prisma Schema - models/schema.prisma)
This will be the heart of your data.

Code snippet

// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User Model
model User {
  id               String      @id @default(uuid())
  email            String      @unique
  passwordHash     String
  instagramUserId  String?     @unique // Meta's Instagram Business Account ID
  instagramAccessToken String?   // Encrypted Instagram Access Token
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  workflows        Workflow[]
  sessions         Session[]   // For token management
}

// Workflow Model (Main automation rule)
model Workflow {
  id               String           @id @default(uuid())
  userId           String
  user             User             @relation(fields: [userId], references: [id])
  name             String           // User-defined workflow name (e.g., "Price Inquiry DM")
  status           WorkflowStatus   @default(INACTIVE) // ACTIVE, INACTIVE, PAUSED
  trigger          TriggerConfig?   @relation(fields: [triggerId], references: [id])
  triggerId        String?          @unique // One-to-one relationship with TriggerConfig
  action           ActionConfig?    @relation(fields: [actionId], references: [id])
  actionId         String?          @unique // One-to-one relationship with ActionConfig
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  triggersCount    Int              @default(0) // How many times this workflow was triggered
  dmsSentCount     Int              @default(0) // How many DMs were sent by this workflow
  lastTriggeredAt  DateTime?
}

// Trigger Configuration (What initiates the workflow)
model TriggerConfig {
  id                   String             @id @default(uuid())
  workflowId           String             @unique
  workflow             Workflow           @relation(fields: [workflowId], references: [id])
  type                 TriggerType        // SpecificPost, AnyPost, NextPost
  targetPostId         String?            // The Instagram Post ID if type is SpecificPost
  keywords             String[]           // Array of keywords (e.g., ["price", "link", "shop"])
  matchAnyWord         Boolean            @default(false) // If true, any word triggers
  // Add more fields if needed for future trigger types (e.g., mentions, hashtags)
}

// Action Configuration (What the workflow does)
model ActionConfig {
  id                   String             @id @default(uuid())
  workflowId           String             @unique
  workflow             Workflow           @relation(fields: [workflowId], references: [id])
  sendOpeningDM        Boolean            @default(false)
  openingDMMessage     String?            @db.Text // Long text for DM
  openingDMLink        String?
  sendDMWithLink       Boolean            @default(false)
  dmWithLinkMessage    String?            @db.Text
  dmLink               String?
  // Add fields for other actions (e.g., add to CRM, tag user)
}

// Session (for authentication if not using JWTs only)
model Session {
  id           String    @id @default(uuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  token        String    @unique
  expiresAt    DateTime
  createdAt    DateTime  @default(now())
}

// Enum for workflow status
enum WorkflowStatus {
  ACTIVE
  INACTIVE
  PAUSED
  DRAFT
}

// Enum for trigger type
enum TriggerType {
  SPECIFIC_POST
  ANY_POST
  NEXT_POST // Conceptually, this might mean the next post created by the user
}
Database Migration Steps:

Bash

npx prisma migrate dev --name init # Create initial migration
npx prisma generate # Generate Prisma client
3.2 Backend - Authentication & User Management (authController.ts, authService.ts, userController.ts, userService.ts)
User Registration & Login:

API Endpoints: POST /api/auth/register, POST /api/auth/login.

Service Logic: Hash passwords (bcrypt), create JWTs for authenticated sessions.

Instagram OAuth2 Integration:

API Endpoints: GET /api/auth/instagram, GET /api/auth/instagram/callback.

Service Logic: Use passport-instagram-graph to handle the OAuth flow, obtain Instagram User ID and Access Token. Securely store the encrypted Instagram Access Token in the User model.

JWT Middleware: Protect API routes that require authentication using passport-jwt middleware.

3.3 Backend - Workflow Management (workflowController.ts, workflowService.ts)
CRUD Operations:

API Endpoints: POST /api/workflows, GET /api/workflows, GET /api/workflows/:id, PUT /api/workflows/:id, DELETE /api/workflows/:id.

Service Logic: Implement all business logic for creating, retrieving, updating, and deleting workflows. Ensure workflows are scoped to the authenticated user.

Validation: Use Joi/Zod to validate incoming workflow data against defined schemas.

3.4 Backend - Instagram API Integration (instagramApiService.ts)
Meta Graph API Client: Create a dedicated service to encapsulate all interactions with the Meta Graph API (Instagram Business API).

Features:

Fetching user's Instagram Business Account information.

Retrieving user's posts and reels (GET /{ig-user-id}/media).

Subscribing to webhooks for comments on specific media or the entire page.

Fetching comments for a specific post (for polling fallback or initial sync).

Sending direct messages (POST /{recipient-id}/messages).

Error Handling & Rate Limiting: Implement robust error handling for API calls, including graceful handling of Meta API rate limits and exponential backoff for retries.

3.5 Backend - DM Automation Logic (dmAutomationService.ts, jobs/, workers/)
Comment Monitoring (Primary: Webhooks):

Webhook Endpoint: POST /api/webhooks/instagram (must be publicly accessible and configured in Meta Developer Console).

Logic: When a new comment webhook is received:

Validate the webhook signature.

Parse comment data.

Enqueue a commentProcessJob to BullMQ.

Comment Monitoring (Fallback/Alternative: Polling):

Scheduler: Use node-cron or BullMQ scheduler to periodically enqueue commentPollJob for active workflows.

commentPollJob: In a worker, iterate through active workflows, fetch recent comments for their target posts/pages via instagramApiService, and then enqueue commentProcessJob for each new comment.

commentProcessJob (Worker - commentMonitorWorker.ts):

Logic:

Retrieve the full comment details from Instagram API.

Find matching workflows based on targetPostId and keywords (or matchAnyWord).

If a match is found and the user hasn't already received a DM for this comment (avoid duplicates), enqueue a sendDMJob to BullMQ.

sendDMJob (Worker - dmWorker.ts):

Logic:

Retrieve workflow and user details.

Construct the DM message(s) based on ActionConfig (opening DM, DM with link).

Use instagramApiService to send the DM to the commenter's Instagram user ID.

Update workflow dmsSentCount in the database.

Log success/failure.

3.6 Frontend Integration with Backend API (services/)
services/workflowService.ts:

Refactor mockInstagramAPI.js to services/api.ts (using Axios) for actual API calls to your backend endpoints (e.g., /api/workflows, /api/auth/instagram).

Use React Query to manage data fetching, caching, and mutations for workflows.

Authentication Flow: Implement actual login, logout, and Instagram connect flows, storing JWTs securely (e.g., in HttpOnly cookies or localStorage for simpler cases, but be aware of security implications).

Phase 4: Advanced Features & Refinement (Full-Stack)
4.1 Frontend - Advanced Features (as per your plan)
Workflow Persistence: Frontend will now load and save workflows via the backend API.

Real-time Previews: The preview remains primarily frontend-driven, but the initial post data comes from the backend.

Analytics Display: Frontend can fetch triggersCount and dmsSentCount from backend workflow data.

4.2 Backend - Advanced Features
Admin Dashboard (Optional): If needed, a simple admin interface for monitoring all active workflows, job queues, and errors.

Logging: Centralized logging (e.g., winston for Node.js, sending logs to a service like Logtail/Datadog).

Error Handling: Robust error handling middleware for Express.js.

4.3 Full-Stack Testing & Quality Assurance
Frontend: Unit tests (Jest/RTL), Integration tests, E2E tests (Cypress/Playwright) for user journeys interacting with the backend.

Backend:

Unit Tests: For individual services, controllers, and utility functions (Jest).

Integration Tests: For API endpoints, ensuring correct data flow through controllers, services, and database (Supertest).

Job Tests: Test BullMQ jobs and workers in isolation.

Security Testing: Manual and automated vulnerability scanning.

4.4 Deployment Configuration (Full-Stack)
Frontend Deployment:

Build: npm run build

Host: Vercel, Netlify, AWS S3 + CloudFront, GitHub Pages.

Backend Deployment:

Dockerize: Create a Dockerfile for your Node.js backend.

Hosting: Deploy your Dockerized backend to a cloud platform:

PaaS (simpler): Render, Heroku, DigitalOcean App Platform, Google Cloud Run.

IaaS (more control): AWS EC2/ECS, Google Cloud Compute Engine, Azure VMs.

Database Hosting: Use managed database services for PostgreSQL (AWS RDS, GCP Cloud SQL, DigitalOcean Managed Databases) and Redis (Redis Cloud, AWS ElastiCache).

Webhooks: Ensure your deployed backend has a public IP/domain name for Meta to send webhooks to.

CI/CD: Set up a Continuous Integration/Continuous Deployment pipeline (e.g., GitHub Actions) to automate building, testing, and deploying both your frontend and backend on code pushes.

4.5 MCP Development Workflow (Full-Stack Application)
Leverage MCP for:

API Schema Definition: Generate TypeScript interfaces for API requests/responses based on your Joi schemas.

Service Layer Generation: Automatically generate boilerplate for services that interact with Prisma models.

Controller Stubs: Generate controller methods with basic request parsing and service calls.

Database Migrations: Assist in generating Prisma migrations based on schema changes.

Job Definitions: Help in structuring BullMQ jobs and workers.

Security Best Practices: Get AI suggestions for securing routes, handling sensitive data, and preventing common vulnerabilities.

Performance Optimization: Analyze backend code for potential bottlenecks and suggest improvements.

