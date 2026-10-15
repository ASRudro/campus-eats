# CampusEats – Skip the Lunch Queue 🍽️⚡
> **University CSE Group Project | Full-Stack Cafeteria Pre-Ordering System**

CampusEats is an enterprise-grade full-stack university web application developed to eliminate the frustrating 30-minute rush hour queues at university canteens. Students can browse real-time cafeteria menus, pre-order meals for scheduled 15-minute pickup windows, maintain personal daily spending and calorie caps with an automated dual-layer guardrail, coordinate split group trays, plan Mon–Fri lunches, and earn loyalty rewards.

---

## 📑 Table of Contents
1. [Key Features & Viva Talking Points](#key-features--viva-talking-points)
2. [Technology Stack](#technology-stack)
3. [System Architecture & Project Structure](#system-architecture--project-structure)
4. [User Roles & Permissions (RBAC)](#user-roles--permissions-rbac)
5. [Core Algorithms & Mathematical Logic](#core-algorithms--mathematical-logic)
   - [Budget & Calorie Guardrail (WOW Factor)](#1-budget--calorie-guardrail-wow-factor)
   - [Estimated Wait-Time Algorithm](#2-estimated-wait-time-algorithm)
   - [One-Tap Smart Reorder Formula](#3-one-tap-smart-reorder-formula)
   - [Group Order Partitioning](#4-group-order-partitioning)
6. [Demo Accounts & Credentials](#demo-accounts--credentials)
7. [Database Setup & Schema](#database-setup--schema)
8. [Installation & Step-by-Step Execution](#installation--step-by-step-execution)
9. [REST API Endpoints Specification](#rest-api-endpoints-specification)
10. [Security & Production Hardening](#security--production-hardening)

---

## 🌟 Key Features & Viva Talking Points

- **Dual-Layer Budget & Calorie Guardrail (WOW Factor)**: Real-time progress bars calculate today's cumulative spending and calories against user limits. Orders that exceed limits are blocked by both the client-side UI and verified via transactional server-side SQL queries.
- **Scheduled 15-Minute Pickup Slots**: Prevents canteen bottlenecking by capping orders per time window (e.g., 12:00 PM – 2:00 PM).
- **Dynamic Kitchen Queue Dashboard**: Tablet-optimized interface for cafeteria chefs to transition orders (`Pending` → `Confirmed` → `Preparing` → `Ready` → `Picked Up`) and toggle instant food stock availability.
- **Flashing "READY FOR PICKUP" Indicator**: Pulsing high-contrast visual alert on the student order tracker when chefs mark their meal ready.
- **Verifiable Digital Order Receipts (`CE-2026-XXXXXX`)**: Itemized breakdowns showing price snapshots, calories, pickup windows, and printable slips.
- **One-Tap Instant Reorder**: Repopulates previous meal items into the cart while re-querying current menu prices (preventing stale price replay attacks).
- **Mon–Fri Weekly Lunch Planner**: Schedule meals for Monday through Friday and dispatch that day's scheduled meal to the cart with 1 click.
- **Split Group Ordering (`GRP-XXXXX`)**: A host student generates a 6-character room code; batchmates join, select individual trays, and individual budget/calorie checks are enforced on each participant.
- **Loyalty Rewards Engine**: Accumulates 1 point for every ৳50 spent, with a redemption catalog for free snacks and discount vouchers.
- **Admin Analytics Dashboard (Chart.js)**: Computes dynamic KPIs from SQL records: Sales revenue by day, peak ordering hours, and top 5 best-selling dishes.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, React Router v6, Axios, Lucide React, Chart.js, react-chartjs-2, Vite |
| **Backend** | Node.js (v20+), Express.js, JWT (`jsonwebtoken`), `bcryptjs`, CORS, Dotenv |
| **Database** | MySQL (via `mysql2/promise` connection pooling) + Resilient embedded SQLite fallback |
| **Architecture** | RESTful API, Role-Based Access Control (RBAC), Parameterized SQL Queries |
| **Image Handling** | High-resolution CDN & Cloudinary storage integration with zero-broken-image fallbacks |

---

## 📂 System Architecture & Project Structure

```
campus-eats/
│
├── database/
│   ├── schema.sql              # Clean normalized MySQL DDL script
│   └── seed.sql                # Demo accounts (bcrypt hashed) & 14+ dishes
│
├── backend/
│   ├── config/
│   │   └── db.js               # Resilient DB pool (MySQL + auto-embedded fallback)
│   ├── controllers/
│   │   ├── authController.js   # Registration, JWT login, profile guardrail limits
│   │   ├── menuController.js   # Menu search, category filters, stock toggles
│   │   ├── orderController.js  # Server guardrail enforcement, checkout, queue
│   │   ├── favoriteController.js # Bookmark student favorite dishes
│   │   ├── reviewController.js # 1-5 star ratings, feedback, admin moderation
│   │   ├── scheduleController.js # Mon-Fri weekly meal scheduler
│   │   ├── groupController.js  # Group lobbies, individual limit enforcement
│   │   ├── loyaltyController.js # Points balance, transactions, reward redemption
│   │   └── adminController.js  # Real SQL aggregation for KPIs & peak charts
│   ├── middleware/
│   │   ├── auth.js             # JWT verification & RBAC authorization
│   │   └── validate.js         # Input bounds, formats, and sanitization
│   ├── utils/
│   │   └── waitTimeCalculator.js # Understandable kitchen queuing formula
│   ├── routes/                 # Express REST route definitions
│   ├── test_api.js             # Automated API integration test suite
│   ├── .env.example
│   └── server.js               # API Server entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Role-aware navigation & live guardrail pill
│   │   │   ├── Footer.jsx      # University project branding & credentials
│   │   │   ├── FoodCard.jsx    # Menu card with error-free image fallback
│   │   │   ├── GuardrailBar.jsx# Live visual budget & calorie progress bars
│   │   │   ├── DigitalReceipt.jsx # Official printable receipt modal
│   │   │   ├── StatusBadge.jsx # Animated status indicators (Ready pulse)
│   │   │   ├── StarRating.jsx  # Interactive & display star ratings
│   │   │   └── ProtectedRoute.jsx # Client-side route protection
│   │   ├── context/
│   │   │   ├── AuthContext.jsx # Session, role state, daily usage sync
│   │   │   └── CartContext.jsx # Shopping cart & real-time guardrail math
│   │   ├── pages/              # 12 responsive page views
│   │   ├── services/api.js     # Axios client with JWT interceptor
│   │   ├── App.jsx             # Route definitions
│   │   ├── index.css           # Canteen emerald green stylesheet
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
│
├── .env.example
├── package.json                # Root orchestration scripts
└── README.md                   # Full documentation & viva guide
```

---

## 👥 User Roles & Permissions (RBAC)

The application enforces 3 distinct roles on **both the React frontend and Express backend**:

1. **Student (`student`)**:
   - Browse food, filter categories, search dishes.
   - View details, post reviews and 1–5 star ratings.
   - Configure personal Daily Budget & Calorie Limits.
   - Select pickup window and complete checkout.
   - Track orders with digital receipt and one-tap reorder.
   - Create/join split Group Orders and organize Weekly Schedules.
   - Accumulate and redeem loyalty points.
   - *Forbidden*: Kitchen queue and Admin management pages.

2. **Kitchen Staff (`kitchen`)**:
   - Tablet-optimized view of incoming orders sorted by pickup priority.
   - Update order lifecycle: `Pending` → `Confirmed` → `Preparing` → `Ready` → `Picked Up`.
   - Toggle cafeteria food stock (`In Stock` / `Sold Out`) in real-time.
   - *Forbidden*: Admin analytics, financial reports, user management.

3. **Administrator (`admin`)**:
   - Dynamic KPI analytics: Today's sales, active tickets, student accounts, average order value.
   - Visual charts: Daily sales trends, peak pickup windows, best-selling dishes.
   - Full CRUD over menu items, categories, pickup time slots, and loyalty catalog.
   - User account management and role promotion.
   - Review moderation (removal of inappropriate comments).

---

## 🧮 Core Algorithms & Mathematical Logic

### 1. Budget & Calorie Guardrail (WOW Factor)
To promote student financial wellness and healthy eating, students set daily caps in their profile (e.g., ৳300 / 1800 kcal).
$$\text{Projected Expense} = \sum_{\text{today's orders}} \text{subtotal} + \sum_{\text{cart}} (\text{unit\_price} \times \text{quantity})$$
$$\text{Projected Calories} = \sum_{\text{today's orders}} \text{calories} + \sum_{\text{cart}} (\text{calories} \times \text{quantity})$$

- **Client Check**: `CartContext` updates `budgetPercent` and `caloriePercent`. If $\text{Projected} > \text{Limit}$, the checkout button is disabled and a warning alert is rendered.
- **Server Enforcement**: `POST /api/orders` queries:
  ```sql
  SELECT COALESCE(SUM(subtotal), 0) as spent_today, COALESCE(SUM(total_calories), 0) as calories_today
  FROM orders WHERE user_id = ? AND pickup_date = CURDATE() AND status != 'Cancelled';
  ```
  If $\text{spent\_today} + \text{cart\_subtotal} > \text{daily\_budget}$, the server rejects the order with `400 Bad Request` and returns an informative guardrail error.

### 2. Estimated Wait-Time Algorithm
$$\text{Estimated Wait Time (mins)} = \max_{i \in \text{order}}(\text{prep\_time}_i) + (\text{Active Orders Ahead} \times 3 \text{ mins})$$
- **Viva Explanation**: Food items within an order can be prepared concurrently in the kitchen, so base time is bounded by the longest preparation dish. Kitchen queuing delay scales linearly with active orders (`Pending` or `Preparing`).

### 3. One-Tap Smart Reorder Formula
When students click "Reorder" on a previous receipt:
- Item IDs are fetched from `order_items`.
- The server cross-checks current records in `menu_items`.
- Available items are loaded with **today's current prices** into the cart, completely mitigating stale-price replay attacks while notifying the student if an old dish was discontinued.

### 4. Group Order Partitioning
- In group lobbies (`GRP-XXXXX`), each student selects their own items.
- Item validation checks that participant's personal daily budget and calorie limits:
  Student A's Biryani will **never** cause Student B's checkout to be rejected, ensuring complete privacy and isolation of dietary limits.

---

## 🔑 Demo Accounts & Credentials

Pre-seeded accounts with secure bcrypt hashing:

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Admin** | `admin@campuseats.com` | `Admin123!` | Full admin analytics, user & menu management |
| **Kitchen Staff** | `kitchen@campuseats.com` | `Kitchen123!` | Kitchen ticket queue & stock toggles |
| **Student (Demo 1)**| `tanvir@campuseats.com` | `Student123!`| Pre-ordering, guardrail (৳350 / 1800 kcal), loyalty |
| **Student (Demo 2)**| `nafis@campuseats.com`  | `Student123!`| Batchmate account for group ordering tests |

> **Viva Tip**: The Login page features 1-click **Quick-Fill Buttons** for Admin, Kitchen, and Student so you can switch roles instantly during your viva evaluation.

---

## 🗄️ Database Setup & Schema

The application includes production-grade MySQL scripts in `database/`:
- `database/schema.sql`: 13 normalized tables (`users`, `categories`, `menu_items`, `pickup_slots`, `orders`, `order_items`, `favorites`, `ratings`, `weekly_schedules`, `group_orders`, `group_order_items`, `loyalty_rewards`, `loyalty_transactions`).
- `database/seed.sql`: Realistic seed data with 14 dishes across 6 categories.

### Importing to MySQL (XAMPP / Workbench / Command Line)
1. Start Apache and MySQL in XAMPP.
2. Open terminal or phpMyAdmin and run:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/seed.sql
   ```
3. Set your database credentials in `backend/.env`.

> **Zero-Configuration Fallback**: If MySQL is not running when you launch the server, `backend/config/db.js` automatically initializes an embedded SQLite database populated with identical schema and seed data so your presentation never crashes!

---

## 🚀 Installation & Step-by-Step Execution

### Prerequisites
- Node.js (v18 or v20+)
- npm

### 1. Clone & Configure
```bash
# Navigate to the project directory
cd campus-eats

# Create .env from template
cp .env.example .env
cp backend/.env.example backend/.env
```

### 2. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Run Automated Backend Tests
Run the built-in verification suite to validate all endpoints, guardrail rejections, and orders:
```bash
cd backend
node test_api.js
```
*Expected Output:*
```
1. Health check: ✅ PASS
2. Menu listing (count: 14): ✅ PASS
3. Student Login: ✅ PASS
4. Daily Usage (Budget: ৳350, Spent: ৳160): ✅ PASS
5. Guardrail Rejection (Over budget order blocked by backend): ✅ PASS
6. Valid Order Checkout & Digital Receipt: ✅ PASS
7. Kitchen Queue: ✅ PASS
8. Kitchen marks order as Ready: ✅ PASS
9. Admin Dashboard KPIs: ✅ PASS
```

### 4. Start the Application

Open two terminal windows:

**Terminal 1 (Backend API Server):**
```bash
cd backend
npm start
# Server starts on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Frontend starts on http://localhost:3000
```

Open your browser and navigate to: **`http://localhost:3000`**

---

## 📡 REST API Endpoints Specification

### Authentication & Profile (`/api/auth`)
- `POST /api/auth/register` — Register new student account
- `POST /api/auth/login` — Authenticate and receive JWT
- `GET /api/auth/me` — Get profile of authenticated user
- `PUT /api/auth/profile` — Update name, phone, daily budget, and calorie limits
- `GET /api/auth/daily-usage` — Real-time consumption & expenditure today

### Menu & Cafeteria Catalog (`/api/menu`)
- `GET /api/menu` — List food with search (`?search=`), category (`?category=`), sort (`?sort=`)
- `GET /api/menu/categories` — List all food categories
- `GET /api/menu/pickup-slots` — List available 15-minute pickup windows
- `GET /api/menu/:id` — Food details with rating averages and student reviews
- `POST /api/menu` — *(Admin)* Create new food dish
- `PUT /api/menu/:id` — *(Admin)* Edit food item
- `DELETE /api/menu/:id` — *(Admin)* Delete food item
- `PATCH /api/menu/:id/availability` — *(Kitchen/Admin)* Toggle In Stock / Sold Out

### Orders & Kitchen Processing (`/api/orders`)
- `POST /api/orders` — Checkout order with dual-guardrail validation & receipt generation
- `GET /api/orders/my` — Student active and historical orders
- `GET /api/orders/:id` — Digital receipt by order number
- `GET /api/orders/reorder/:id` — Smart reorder validator with current prices
- `GET /api/orders/kitchen/queue` — *(Kitchen/Admin)* Kitchen queue sorted by pickup time
- `PATCH /api/orders/:id/status` — *(Kitchen/Admin)* Progress status (`Confirmed`, `Preparing`, `Ready`, `Picked Up`)

### Groups, Schedules, Favorites & Loyalty
- `GET|POST /api/favorites` — Manage bookmarked favorite dishes
- `GET|POST /api/schedules` — Mon–Fri weekly meal pre-planning
- `POST /api/groups` — Host group session with shareable code (`GRP-XXXXX`)
- `POST /api/groups/join` — Join group lobby by code
- `POST /api/groups/:id/finalize` — Finalize group tray into confirmed kitchen tickets
- `GET /api/loyalty/my` — Loyalty balance and point accrual history
- `POST /api/loyalty/redeem/:rewardId` — Redeem free items and vouchers

### Admin Analytics (`/api/admin`)
- `GET /api/admin/dashboard` — Live KPI metrics (Today's Sales, Orders, AOV)
- `GET /api/admin/sales` — Daily sales trends for charts
- `GET /api/admin/peak-times` — Pickup slot distribution
- `GET /api/admin/best-selling` — Top dishes by `SUM(quantity)`
- `GET /api/admin/users` — Campus user directory & role management

---

## 🔒 Security & Production Hardening

1. **Password Hashing**: Uses `bcryptjs` with 10 salt rounds. Plaintext passwords are never stored or returned by any API.
2. **Stateless JWT Authorization**: Token-based authentication with expiration checks and role-based route middleware.
3. **SQL Injection Prevention**: Parameterized queries (`?` placeholders) used across all database interactions.
4. **Input Boundary Validation**: Strict checks on numeric types (prices $\ge 0$, calories $\ge 0$, prep time $\ge 1$), email formatting regex, and ratings ($1 \le \text{rating} \le 5$).
5. **No Broken Images**: High-resolution CDN images with automatic React `onError` event handling to ensure no broken icons appear.
6. **Environment Isolation**: Secrets, database credentials, and ports managed via `.env`.

---

## 🎓 University CSE Viva Questions & Answers

**Q1: Why did you implement the Budget & Calorie Guardrail on both the frontend and backend?**  
*Answer:* Frontend validation provides an immediate, frictionless user experience with visual progress indicators. However, client-side validation can easily be bypassed by manipulating HTTP requests. Enforcing the guardrail inside the transactional `POST /api/orders` backend controller guarantees data integrity and prevents students from bypassing financial and dietary limits.

**Q2: How does the estimated wait time algorithm work?**  
*Answer:* We use the formula $\text{Wait Time} = \max(\text{prep\_time of items}) + (\text{Active Orders Ahead} \times 3\text{ mins})$. This accurately reflects a cafeteria setting where kitchen staff cook order items simultaneously, while queue throughput scales with orders in `Pending` or `Preparing` status.

**Q3: How do you prevent stale price issues in the Reorder feature?**  
*Answer:* Instead of replaying the historic prices stored in old receipts, the `/api/orders/reorder/:id` endpoint queries the current active `menu_items` table. This recalculates total prices and calories at today's rates and alerts students if an item was discontinued.

---

**Developed with ❤️ for University Students & Canteen Management.**
