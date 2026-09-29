# RideLink — Fare & Payment Microservice (Member 4)

> **Course**: IT3130 – Application Development Group Assignment  
> **Service Name**: Fare & Payment Service  
> **Port**: `3004`  
> **Technology Stack**: Node.js, Express, TypeScript, SQLite, Prisma ORM, Zod, Vitest, Swagger/OpenAPI 3.0  

---

## 1. Service Overview & Responsibilities

The **Fare & Payment Service** is one of the four independent core microservices in the RideLink backend ride-sharing architecture. Developed by **Member 4**, it exclusively owns:

1. **Estimated Ride Fare Calculation**: Calculates estimated costs before or during booking based on distance and configurable pricing rules.
2. **Final Ride Fare Calculation**: Computes the final payable amount upon ride completion with a full cost breakdown.
3. **Simulated Payment Processing**: Processes payments through multiple methods (`CASH`, `CARD`, `WALLET`) and records transaction states (`PENDING`, `SUCCESS`, `FAILED`).
4. **Receipt Generation & Management**: Issues unique transaction receipts strictly upon successful payment.
5. **Payment & Receipt Retrieval APIs**: Allows passenger payment history lookup, per-ride transactions, and direct receipt queries.
6. **Microservice Communication**: Exposes authenticated REST endpoints for inter-service communication with the **Ride Management Service (Member 3)**.

### 🚫 Domain Boundary Exclusions (What this service DOES NOT own)
* User account registration, password hashing, and login (Owned by **Account Service — Member 1**).
* Driver profiles, vehicles, and location dispatching (Owned by **Driver & Vehicle Service — Member 2**).
* Ride lifecycle states, pickup/drop-off route creation (Owned by **Ride Management Service — Member 3**).

---

## 2. Technology Stack

* **Runtime**: Node.js (v18+)
* **Framework**: Express.js
* **Language**: TypeScript
* **Database**: SQLite (isolated database per microservice)
* **ORM**: Prisma ORM
* **Validation**: Zod (strict schema-level request validation)
* **Testing**: Vitest + Supertest
* **API Documentation**: Swagger / OpenAPI 3.0 via `swagger-ui-express`
* **Security & Utility**: Helmet, CORS, jsonwebtoken, UUID v4

---

## 3. Project & Folder Structure

```
fare-payment-service/
├── prisma/
│   └── schema.prisma                  # Prisma ORM schema & SQLite config
├── src/
│   ├── config/                        # Environment & fare configuration
│   │   └── index.ts
│   ├── controllers/                   # HTTP request handlers
│   │   ├── fareController.ts
│   │   ├── paymentController.ts
│   │   └── receiptController.ts
│   ├── database/                      # Prisma client instance & seed script
│   │   ├── prisma.ts
│   │   └── seed.ts
│   ├── docs/                          # OpenAPI 3.0 Swagger specification
│   │   └── swagger.json
│   ├── middleware/                    # Auth, RBAC, Validation & Error handlers
│   │   ├── authMiddleware.ts
│   │   ├── errorHandler.ts
│   │   └── validate.ts
│   ├── routes/                        # Express API route declarations
│   │   ├── fareRoutes.ts
│   │   ├── paymentRoutes.ts
│   │   └── receiptRoutes.ts
│   ├── services/                      # Core business logic & calculation engine
│   │   ├── fareCalculator.ts
│   │   ├── fareService.ts
│   │   ├── paymentService.ts
│   │   └── receiptService.ts
│   ├── utils/                         # Custom error classes & helpers
│   │   └── AppError.ts
│   ├── validators/                    # Zod validation schemas
│   │   └── index.ts
│   ├── app.ts                         # Express app middleware & route mounting
│   └── server.ts                      # Server bootstrap & graceful shutdown
├── tests/                             # Vitest automated test suites
│   ├── api.test.ts                    # API integration tests
│   └── fareCalculator.test.ts         # Fare formula unit tests
├── .env.example                       # Environment variable template
├── .gitignore                         # Git exclusion rules
├── package.json                       # Service dependencies & scripts
├── RideLink_Fare_Payment_Service.postman_collection.json # Postman test suite
├── tsconfig.json                      # TypeScript configuration
└── README.md                          # Service documentation
```

---

## 4. Database Design & Models

In compliance with microservice architecture principles, this service owns its isolated database boundary (`fare_payment.db`). No other microservice has direct SQL/database access.

### Prisma Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model FareEstimate {
  id           String   @id @default(uuid())
  rideId       String
  passengerId  String
  distanceKm   Float
  baseFare     Float
  distanceFare Float
  bookingFee   Float
  totalFare    Float
  currency     String   @default("LKR")
  createdAt    DateTime @default(now())

  @@index([rideId])
  @@index([passengerId])
}

model Payment {
  id                   String   @id @default(uuid())
  rideId               String
  passengerId          String
  amount               Float
  paymentMethod        String   // CASH, CARD, WALLET
  status               String   @default("PENDING") // PENDING, SUCCESS, FAILED
  transactionReference String   @unique
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  receipt Receipt?

  @@index([rideId])
  @@index([passengerId])
  @@index([status])
}

model Receipt {
  id            String   @id @default(uuid())
  paymentId     String   @unique
  payment       Payment  @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  rideId        String
  passengerId   String
  amount        Float
  currency      String   @default("LKR")
  paymentMethod String
  issuedAt      DateTime @default(now())

  @@index([rideId])
  @@index([passengerId])
}
```

---

## 5. Fare Calculation Formula & Configuration

### Configurable Pricing Values (Loaded from `.env`)
* **Base fare**: `LKR 150`
* **Rate per kilometer**: `LKR 80`
* **Booking fee**: `LKR 30`
* **Minimum fare floor**: `LKR 250`

### Mathematical Formula
$$\text{Distance Fare} = \text{Distance (km)} \times \text{Rate Per Km}$$
$$\text{Raw Fare} = \text{Base Fare} + \text{Distance Fare} + \text{Booking Fee}$$
$$\text{Final Fare} = \max(\text{Minimum Fare}, \text{Raw Fare})$$

### Example Calculation (5 km Ride)
* Distance: $5\text{ km}$
* Base Fare: $\text{LKR } 150$
* Distance Fare: $5 \times 80 = \text{LKR } 400$
* Booking Fee: $\text{LKR } 30$
* Total Fare: $150 + 400 + 30 = \text{LKR } 580$ (Exceeds minimum LKR 250 floor $\implies$ $\text{LKR } 580$)

### Minimum Fare Floor Example (0.5 km Ride)
* Distance: $0.5\text{ km}$
* Distance Fare: $0.5 \times 80 = \text{LKR } 40$
* Raw Fare: $150 + 40 + 30 = \text{LKR } 220$
* Final Fare: $\max(250, 220) = \mathbf{\text{LKR } 250}$

---

## 6. Simulated Payment Processing

Because this is a university prototype, real banking gateways are not integrated. Instead:
* **Payment Methods**: `CASH`, `CARD`, `WALLET`.
* **Transaction References**: Auto-generated unique IDs in format `TXN-<UUID>-<TIMESTAMP>`.
* **Statuses**:
  * `SUCCESS`: Payment approved, transaction recorded, **receipt generated immediately**.
  * `FAILED`: Payment rejected, transaction recorded as `FAILED`, **NO receipt generated**.
  * `PENDING`: Payment initiated awaiting settlement.
* **Failure Simulation**: Clients can pass `"simulateFailure": true` in the request body to test edge cases, error recovery, and failed transaction handling.
* **Zero Sensitive Data**: No credit card numbers, CVVs, or bank pins are ever requested or stored.

---

## 7. REST API Endpoints Sitemap

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Service health status | No |
| `POST` | `/api/fares/estimate` | Calculate & store estimated fare breakdown | Bearer JWT |
| `GET` | `/api/fares/estimate/:id` | Retrieve saved fare estimate by ID | Bearer JWT |
| `POST` | `/api/fares/final` | Calculate final fare for completed ride | Bearer JWT |
| `POST` | `/api/payments` | Process simulated payment (CASH, CARD, WALLET) | Bearer JWT |
| `GET` | `/api/payments/:id` | Retrieve payment by payment ID | Bearer JWT |
| `GET` | `/api/payments/ride/:rideId` | Retrieve payment transactions for a ride | Bearer JWT |
| `GET` | `/api/payments/passenger/:passengerId` | Retrieve passenger payment history | Bearer JWT |
| `GET` | `/api/receipts/:id` | Retrieve receipt by receipt ID | Bearer JWT |
| `GET` | `/api/receipts/ride/:rideId` | Retrieve receipt for a specific ride | Bearer JWT |

---

## 8. Setup & Installation Instructions

### Prerequisites
* Node.js v18.0.0 or higher
* npm v9.0.0 or higher

### Step-by-Step Setup
1. **Navigate to the service folder**:
   ```bash
   cd fare-payment-service
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```

4. **Initialize Database Schema & Client**:
   ```bash
   npm run db:push
   ```

5. **(Optional) Seed Mock Data**:
   ```bash
   npm run db:seed
   ```

6. **Start Development Server**:
   ```bash
   npm run dev
   ```

7. **Verify Health Check**:
   Open: [http://localhost:3004/health](http://localhost:3004/health)

8. **Explore Interactive Swagger Documentation**:
   Open: [http://localhost:3004/api-docs](http://localhost:3004/api-docs)

9. **Run Automated Test Suite**:
   ```bash
   npm test
   ```

---

## 9. Inter-Service Communication Details

The Fare & Payment Service is designed to collaborate seamlessly with:
1. **Ride Management Service (Member 3)**:
   * When a ride is created or in progress, Ride Management calls `POST /api/fares/estimate` to obtain the fare estimate.
   * When a ride completes, Ride Management calls `POST /api/fares/final` passing the ride ID and actual trip distance.
   * Ride Management or Passenger mobile app then submits payment to `POST /api/payments`.
2. **Account Service (Member 1)**:
   * Provides JWT tokens validated using `JWT_SECRET`.
   * User IDs and Passenger IDs passed in payment requests correspond to account references.
3. **Driver & Vehicle Service (Member 2)**:
   * Drivers can view payment confirmations when collecting `CASH` payments or receiving trip settlements.

---

## 10. Example API Requests and Responses

### 1. Fare Estimate (`POST /api/fares/estimate`)
**Request:**
```json
{
  "rideId": "ride-uuid-001",
  "passengerId": "passenger-uuid-001",
  "distanceKm": 5.0
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Fare estimate calculated successfully",
  "data": {
    "id": "e98e2170-8bf1-4328-b80c-c766742617f0",
    "rideId": "ride-uuid-001",
    "passengerId": "passenger-uuid-001",
    "distanceKm": 5,
    "baseFare": 150,
    "distanceFare": 400,
    "bookingFee": 30,
    "totalFare": 580,
    "currency": "LKR",
    "createdAt": "2026-09-29T10:15:30.000Z"
  }
}
```

### 2. Final Fare Calculation (`POST /api/fares/final`)
**Request:**
```json
{
  "rideId": "ride-uuid-001",
  "passengerId": "passenger-uuid-001",
  "distanceKm": 7.2
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Final fare calculated successfully",
  "data": {
    "rideId": "ride-uuid-001",
    "passengerId": "passenger-uuid-001",
    "distanceKm": 7.2,
    "baseFare": 150,
    "distanceFare": 576,
    "bookingFee": 30,
    "totalFare": 756,
    "currency": "LKR"
  }
}
```

### 3. Create Payment (`POST /api/payments`)
**Request:**
```json
{
  "rideId": "ride-uuid-001",
  "passengerId": "passenger-uuid-001",
  "amount": 756,
  "paymentMethod": "CARD"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "payment": {
      "id": "3b29c916-d352-47ef-a0d4-3ff3d35aa771",
      "rideId": "ride-uuid-001",
      "passengerId": "passenger-uuid-001",
      "amount": 756,
      "paymentMethod": "CARD",
      "status": "SUCCESS",
      "transactionReference": "TXN-A8F1C34E-1727601330000",
      "createdAt": "2026-09-29T10:16:00.000Z",
      "updatedAt": "2026-09-29T10:16:00.000Z"
    },
    "receipt": {
      "id": "7ac19bbd-e448-4cb2-8176-a67b48316c0b",
      "paymentId": "3b29c916-d352-47ef-a0d4-3ff3d35aa771",
      "rideId": "ride-uuid-001",
      "passengerId": "passenger-uuid-001",
      "amount": 756,
      "currency": "LKR",
      "paymentMethod": "CARD",
      "issuedAt": "2026-09-29T10:16:00.000Z"
    }
  }
}
```

---

## 11. Known Limitations & Future Enhancements

1. **Surge / Peak Pricing**: Currently calculates standard distance-based fares; dynamic surge multipliers can be introduced based on regional driver availability.
2. **Real Payment Gateway Integration**: As an academic microservices demonstration, simulated payments are used. Future production releases can integrate Stripe or PayHere SDKs.
3. **Refunds & Disputes**: Partial refunds and dispute handling workflows are slated for future releases.
