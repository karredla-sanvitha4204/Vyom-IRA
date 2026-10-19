# Vyom-IRA — VYOMIRA Airline Management System
> **Brand**: VYOMIRA  
> **Tagline**: *Connecting Earth and Sky.*

VYOMIRA is a full-stack smart airline management and reservation system featuring two distinct web experiences: a premium consumer-facing **Passenger Portal** and a protected enterprise **Admin Operations Console**, accompanied by an operational Java core module.

---

## 🌟 Architecture & Features

### 1. Passenger Portal (`/`)
- **Modern Flight Search**: Search non-stop and connecting domestic flights across major Indian hubs (Hyderabad, Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Kochi, Goa).
- **4 Distinct Travel Classes**:
  - Economy
  - Premium Economy
  - Business Class
  - First Class
- **Interactive Seat Selection**: Dynamic seat map preventing double-booking with real-time seat availability checks.
- **My Bookings & Cancellation**: View confirmed bookings, ticket references, and manage passenger itineraries with instant seat release upon cancellation.
- **Animated Sky Authentication (`/auth`)**: Role-based login and registration with interactive cloud drifting and flight animations.

### 2. Protected Admin Dashboard (`/admin/dashboard`)
- **Enterprise Operations Sidebar**: Dedicated operational layout with fast access to Dashboard metrics, Flight management, All Bookings, Passenger Manifests, Real-time Alerts, and Staff accounts.
- **Live System Health Monitor**: Real-time operational pulse tracking backend API and database connectivity.
- **Real-Time Booking Notifications**: Instant toast alerts and persistent notification bell displaying passenger name, booking reference (`VY-xxxx`), flight number, travel class, and confirmed fare.
- **Booking Inspection Modal**: Comprehensive detail view for administrative verification and audits.
- **Role-Based Access Control**: Strict server-side JWT verification (`HTTP 403 Forbidden` for unauthorized passenger access to administrative APIs).

### 3. Java Airline Management System (`airline/`)
- Core console system implementing flight boarding queues, passenger stack operations, and gate hashing algorithms.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router 6, Lucide React, Vanilla CSS design tokens.
- **Backend**: Node.js, Express.js (Modular MVC architecture).
- **Database**: MongoDB with Mongoose ODM.
- **Authentication**: JSON Web Tokens (JWT) with bcrypt password hashing.
- **Core Module**: Java 17+ (Eclipse / Command-line project).

---

## 📁 Repository Structure

```
Vyom-IRA/
├── airline/                         # Java Airline Management System
│   ├── src/                         # Java source files (Flight, Boarding, Main, etc.)
│   ├── .classpath                   # Eclipse classpath configuration
│   └── .project                     # Eclipse project descriptor
├── backend/                         # Node.js Express REST API
│   ├── config/                      # Database connection and seeding scripts
│   ├── controllers/                 # Modular MVC controllers
│   ├── middleware/                  # JWT auth and role authorization guards
│   ├── models/                      # Mongoose schemas (Flight, Booking, User, etc.)
│   ├── routes/                      # Express route modules
│   ├── services/                    # Pricing, notification, and booking services
│   ├── .env.example                 # Environment configuration template
│   ├── package.json                 # Backend dependencies
│   └── server.js                    # Express bootstrap server
├── frontend/                        # React + Vite application
│   ├── public/                      # Static assets and icons
│   ├── src/
│   │   ├── components/              # Shared components (Navbar, ProtectedRoute)
│   │   ├── layouts/                 # PassengerLayout and AdminLayout
│   │   ├── pages/                   # AuthPage, PassengerHome, AdminDashboard, etc.
│   │   ├── services/                # Axios API client
│   │   └── App.jsx                  # Route definitions and layout groups
│   ├── index.html                   # HTML entry point
│   ├── package.json                 # Frontend dependencies
│   └── vite.config.js               # Vite configuration
├── .gitignore                       # Ignored build artifacts, dependencies, and secrets
└── README.md                        # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (running locally on port 27017 or remote cluster)
- [Java JDK](https://www.oracle.com/java/technologies/downloads/) (v17 or higher, for Java console app)

---

### 1. Database Configuration

1. Ensure MongoDB is active locally:
   ```bash
   mongod --dbpath <your-db-path>
   ```
2. Navigate to `backend/` and copy `.env.example` to `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Configure your environment variables in `.env`:
   ```ini
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/airline_db
   JWT_SECRET=your_secure_random_jwt_secret
   ```

---

### 2. Backend Setup & Startup

From the `backend` folder:
```bash
# Install dependencies
npm install

# Start the backend server
node server.js
```
The server will run on `http://localhost:5000` and automatically seed flight schedules and the default administrator account if not present.

---

### 3. Frontend Setup & Startup

From the `frontend` folder:
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
The application will launch at `http://localhost:3000`.

---

### 4. Running the Java Application

To run the Java core console application:
```bash
cd airline/src
javac airline/*.java
java airline.Main
```
Or import the `airline` directory into Eclipse or IntelliJ IDEA as an existing Java project.

---
