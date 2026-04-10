# EvenUP: Next-Generation Shared Expense Management
**Technical Project Report**
*Author: jils*

---

## 1. Abstract
**EvenUP** is a sophisticated fintech solution designed to eliminate the friction and complexity associated with shared group expenses. Unlike standard split-billing apps, EvenUP integrates game theory (Trust Scores) and graph-based optimization (Simplify Debts) with a high-fidelity, interactive user interface. This report details the technical architecture, core algorithms, and UI/UX design paradigms that differentiate EvenUP as a premium financial tool.

## 2. Problem Statement
Group expenditures—whether for travel, dining, or shared housing—often result in:
1.  **Circular Debts**: A owes B, B owes C, and C owes A. This increases the total number of transactions and overhead.
2.  **Delayed Settlements**: Lack of accountability leads to outstanding balances.
3.  **Complex Splitting**: Difficulty in managing non-equal splits (exact amounts or percentages).

EvenUP addresses these by providing an automated, intelligent, and transparent platform for real-time tracking and debt optimization.

## 3. High-Level System Architecture
EvenUP follows a **De-coupled Tiered Architecture**, ensuring scalability and maintainability:

### 🏛️ Backend (The Engine)
-   **Framework**: FastAPI (Python) – Chosen for high performance (Asynchronous ASGI) and auto-generated documentation.
-   **Database**: MongoDB (NoSQL) – Used for its flexibility in handling varying expense structures and activity logs.
-   **Authentication**: JWT (JSON Web Tokens) with a security-first approach (stateless auth).
-   **Async Integration**: Motor (Async MongoDB driver) to handle non-blocking DB operations.

### 🎨 Frontend (The Experience)
-   **Framework**: React (Vite) – High-speed development and optimized production bundles.
-   **Styling**: Vanilla CSS + Tailwind CSS integration – Utilizing **Glassmorphism** and neon aesthetics for a premium look.
-   **Data Flow**: Axios Interceptors with a unified TypeScript API layer ensuring robust communication.
-   **Visual Effects**: Custom CSS-based 3D Tilt effects and animated transitions for balance updates.

---

## 4. The "Intelligence": Core Algorithms

### 🧠 A. Smart Settlement Optimizer (Simplify Debts)
EvenUP employs a custom algorithm to reduce transactional overhead. The "Simplify Debts" feature recalculates the minimum number of transactions required to clear all balances across multiple groups.
-   **Logic**: It aggregates all net balances for every user. Instead of multiple small transfers, it uses a **Greedy Balance Matching** approach to settle from the largest debtor to the largest creditor, effectively eliminating circular debt.

### 🏆 B. The Trust Score System
To gamify financial reliability, EvenUP implements a **Trust Score** algorithm (0-100).
-   **Metrics**: Factors in payment frequency, speed of settlement, and group activity.
-   **Ranks**: 
    -   *Gold Settler*: Fastest payments and high reliability.
    -   *Newcomer*: Initial state for new users.
    -   *Quick Payer*: Consistently settling within 24 hours.

### 📸 C. Smart Scan (AI Mock)
Simulates receipt processing using a structured parsing logic that fills expense details (title, amount, category) automatically, streamlining the user workflow.

---

## 5. Technical Implementation Details

### 🗄️ Database Document Schema (Example: Expenses)
```json
{
  "_id": "64f...21",
  "group_id": "64f...ea",
  "title": "Roadtrip Fuel",
  "amount_minor": 250000,
  "paid_by": "64f...01",
  "split_type": "percent",
  "splits": [
    { "user_id": "64f...01", "share_minor": 125000 },
    { "user_id": "64f...02", "share_minor": 125000 }
  ],
  "category": "travel",
  "created_at": "2024-03-27T..."
}
```

### 🔐 Security & Optimization
-   **Password Hashing**: Uses `bcrypt` with passlib to ensure sensitive data protection.
-   **Cross-Origin Policy**: Configured `CORSMiddleware` to allow secure communication with the frontend.
-   **Code Efficiency**: Unified API clients in the frontend to prevent redundant network requests and configuration drift.

---

## 6. Features & Value Propositions
1.  **Visual Excellence**: Interactive 3D effects on stat cards and high-end dark mode aesthetics.
2.  **Personal Budgeting**: Real-time spending progress bars (Green → Orange → Red) based on user-defined limits.
3.  **Comprehensive Analytics**: Category-wise breakdown (Pie charts) and monthly spending trends (Line charts).
4.  **Activity Tracking**: A real-time audit log of all creations, updates, and settlements.

## 7. Conclusion & Future Scope
EvenUP represents a unique intersection of finance and user-centric design. Future versions aim to integrate **OCR-ready AI** for real receipt scanning and **Multi-currency support** with live exchange rate APIs.

---
*Report generated for university submission by EvenUP AI Development Suite.*
