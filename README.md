# RideLink — Driver & Vehicle Microservice (Member 2)

> **Course**: IT3130 – Application Development Group Assignment  
> **Service Name**: Driver & Vehicle Service  
> **Port**: `3002`  
> **Technology Stack**: Node.js, Express, TypeScript, SQLite, Prisma ORM, Zod, Vitest, Swagger/OpenAPI 3.0  

---

## 1. Service Purpose & Responsibilities

The **Driver & Vehicle Service** is one of the four core microservices forming the RideLink backend platform. This microservice exclusively owns and manages:

* **Driver Operational Profiles**: Operational info, driver status (`ACTIVE`, `INACTIVE`, `SUSPENDED`), driver license details, and timestamps.
* **Vehicle Management**: Registration of driver vehicles, technical specifications (make, model, year, color, seat capacity, vehicle type), unique registration numbers, and approval status (`APPROVED`, `PENDING`, `REJECTED`).
* **Driver Availability Management**: Availability state tracking (`AVAILABLE`, `UNAVAILABLE`, `ON_TRIP`) governed by business rules (must be active and have an approved vehicle).
* **Service Area Configuration**: Driver geographical operating zones (`city`, `zoneName`, `centerLatitude`, `centerLongitude`, `radiusKm`).
* **Simulated Current Driver Location**: Real-time position tracking (`latitude`, `longitude`, `heading`, `lastUpdated`).
* **Eligible Driver Retrieval Algorithm**: Spatial and operational filtering algorithm invoked by the **Ride Management Service** during ride dispatching.

### 🚫 Domain Boundary Exclusions (What this service DOES NOT own)
* User registration, password hashing, login, or JWT token issuance (Owned by **Account Service — Member 1**). Stores only `accountId` references.
* Passenger accounts or ride creation / ride lifecycle / fare calculation / payment processing (Owned by **Ride Management — Member 3** and **Fare & Payment — Member 4**).

---

## 2. Database Ownership & Boundary

In strict compliance with microservice architecture principles, this service **owns its database boundary (`driver_vehicle_service.db`)**. No other microservice is permitted direct SQL/database access to this service's tables. All interactions must take place via authenticated REST APIs.

### Database ER Diagram / Schema Structure

```
+------------------------------------+
|               Driver               |
+------------------------------------+
| id (PK, String/UUID)               |
| accountId (FK -> Account, Unique)  |
| licenseNumber (Unique, String)     |
| licenseExpiry (DateTime)           |
| driverStatus (ACTIVE/INACTIVE)     |
| availabilityStatus (AVAIL/UNAVAIL) |
+------------------------------------+
       | 1             | 1             | 1
       |               |               |
       v 1             v 1             v 1
+----------------+ +--------------+ +--------------------+
|    Vehicle     | | ServiceArea  | |   DriverLocation   |
+----------------+ +--------------+ +--------------------+
| id (PK)        | | id (PK)      | | id (PK)            |
| driverId (FK)  | | driverId(FK) | | driverId (FK)      |
| regNumber (UQ) | | city, zone   | | latitude, longitude|
| vehicleType    | | centerLat/Lon| | heading, lastUpdate|
| make,model,year| | radiusKm     | +--------------------+
| capacity,status| +--------------+
+----------------+
```

---

## 3. Key Business Rules & Validation

1. **Driver Operational Profile**:
   - `accountId` and `licenseNumber` must be strictly unique.
   - `licenseExpiry` must be a valid future date.
   - Transitioning driver status to `INACTIVE` or `SUSPENDED` automatically revokes availability (resets `availabilityStatus` to `UNAVAILABLE`).

2. **Vehicle Registration**:
   - Driver must exist before a vehicle can be registered.
   - Registration number must be unique across all vehicles.
   - Year must be between `1990` and `currentYear + 1`.
   - Capacity must be $\ge 1$.
   - Vehicle types allowed: `SEDAN`, `SUV`, `VAN`, `LUXURY`, `BIKE`.

3. **Driver Availability State Machine**:
   - To transition to `AVAILABLE` or `ON_TRIP`:
     1. Driver operational status MUST be `ACTIVE`.
     2. Driver MUST have a registered vehicle.
     3. Registered vehicle status MUST be `APPROVED`.
   - Any request violating these conditions is rejected with HTTP `422 Unprocessable Entity` (`INACTIVE_DRIVER_CANNOT_BE_AVAILABLE` or `NO_VEHICLE_REGISTERED`).

4. **Simulated Location**:
   - Coordinates strictly validated: Latitude $\in [-90, 90]$, Longitude $\in [-180, 180]$.

---

## 4. Eligible Driver Retrieval Algorithm

When **Ride Management Service** receives a passenger ride request, it invokes `POST /api/v1/drivers/eligible`.

### Matching Logic Pipeline:
1. **Filter Active & Available Drivers**: `driverStatus == ACTIVE` AND `availabilityStatus == AVAILABLE`.
2. **Filter Approved Vehicles**: Driver has an `APPROVED` vehicle matching `requiredVehicleType` (if specified) and `capacity >= requiredCapacity`.
3. **Validate Driver License**: `licenseExpiry > currentTime`.
4. **Spatial Haversine Calculation**:
   Calculates the great-circle distance $d$ in kilometers between passenger pickup $(\text{lat}_1, \text{lon}_1)$ and driver position $(\text{lat}_2, \text{lon}_2)$:
   $$d = 2 R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
   Where $R = 6371\text{ km}$.
5. **Service Area Check**: Verified if $d \le \text{serviceArea.radiusKm}$ AND $d \le \text{maxSearchRadiusKm}$.
6. **Result Sorting**: Returns candidate list sorted by closest distance first.

---

## 5. API Endpoints Sitemap

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/drivers` | Driver / Admin | Create driver operational profile |
| `GET` | `/api/v1/drivers` | Admin / Service | List all drivers (with optional filters) |
| `GET` | `/api/v1/drivers/:id` | Authenticated | Get driver profile by Driver ID |
| `GET` | `/api/v1/drivers/account/:accountId` | Authenticated | Get driver profile by Account ID |
| `PUT` | `/api/v1/drivers/:id` | Driver / Admin | Update driver profile details |
| `PATCH`| `/api/v1/drivers/:id/status` | Admin / Driver | Update operational status (`ACTIVE`/`INACTIVE`) |
| `POST` | `/api/v1/vehicles` | Driver / Admin | Register vehicle for driver |
| `GET` | `/api/v1/vehicles/:id` | Authenticated | Get vehicle by vehicle ID |
| `GET` | `/api/v1/vehicles/driver/:driverId` | Authenticated | Get vehicle by driver ID |
| `PUT` | `/api/v1/vehicles/:id` | Driver / Admin | Update vehicle details |
| `PATCH`| `/api/v1/drivers/:driverId/availability` | Driver / Service | Update driver availability status |
| `PUT` | `/api/v1/drivers/:driverId/service-area` | Driver / Admin | Set/update driver service area |
| `PUT` | `/api/v1/drivers/:driverId/location` | Driver / Admin | Update simulated current driver location |
| `POST` | `/api/v1/drivers/eligible` | Internal Service | **Ride Management API**: Search eligible drivers |

---

## 6. How to Setup and Run

### Prerequisites
* Node.js v18+ or Node.js v24+
* npm

### Step-by-Step Execution
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Initialize Database & Seed Mock Data**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Access Interactive Swagger Documentation**:
   Open browser at: `http://localhost:3002/api-docs`

5. **Run Automated Test Suite**:
   ```bash
   npm test
   ```

---

## 7. Viva Examination Q&A Preparation Guide

If asked by the examiner during your viva defense:

* **Q: Why does this service have its own SQLite database instead of sharing Account Service's database?**  
  *A: Microservices principles require absolute Database-per-Service ownership. Sharing databases introduces tight coupling and data security risks. My service stores only an `accountId` foreign reference.*

* **Q: How does Ride Management Service request available drivers without direct database access?**  
  *A: Ride Management sends a HTTP POST request to `/api/v1/drivers/eligible` authenticated via the `X-Internal-Service-Key` inter-service secret header.*

* **Q: What happens if an INACTIVE driver tries to set their status to AVAILABLE?**  
  *A: The availability service validates business rules and rejects the request with HTTP `422 Unprocessable Entity`.*

* **Q: How is distance calculated between passenger pickup and driver location?**  
  *A: We use the spherical Haversine formula implemented in `src/utils/haversine.ts` calculating distance in kilometers based on Earth's 6,371 km radius.*
