# SplitPay+ (Multi-Model Expense Sharing System)

## 📌 Project Overview
**SplitPay+** is an enterprise-grade expense sharing application (like Splitwise) that demonstrates a **Polyglot Persistence Architecture**.

Unlike traditional apps that rely on a single database, SplitPay+ leverages the "Best Tool for the Job" philosophy, orchestrating three distinct database technologies to achieve scalability, auditability, and computational efficiency.

**The Trinity of Data:**
1.  **MySQL 8.0**: The Financial Source of Truth (ACID Transactions).
2.  **MongoDB**: The Immutable Event Ledger (Audit Logs & Activity Feed).
3.  **Neo4j**: The Graph Computation Engine (Debt Simplification Algorithms).

> [!IMPORTANT]
> **All three databases are MANDATORY.**
> Removing any component breaks core functionality:
> - Without MySQL: No data integrity or relational structure.
> - Without MongoDB: No history, compliance trails, or "Recent Activity" feed.
> - Without Neo4j: No debt simplification or "Who owes whom" graph visualization.

---

## 🏗️ System Architecture

### 1. MySQL 8.0 (The Banker 🏦)
**Role**: Mandated Source of Truth.
MySQL handles the core relational data and enforces business rules via **Stored Procedures** and **Triggers**. It ensures money is never lost or double-counted.

-   **Data Stored**: Users, Groups, Expenses, Settlements.
-   **Key Mechanics**: ACID Transactions, Foreign Keys, Row-Level Locking.
-   **Logic Location**: Business logic resides *inside* the DB (PL/SQL), not the backend.

### 2. MongoDB (The Historian 📜)
**Role**: Event Store & Audit Log.
Every action in the system is captured as an immutable JSON document in MongoDB. This drives the **"Recent Activity"** UI and provides a debug/compliance trail that MySQL cannot efficiently handle.

-   **Data Stored**: User Logins, Expense Creations, Group Updates, Settlement Events.
-   **Why not MySQL?**: MySQL is optimized for *current state*. MongoDB is optimized for *event streams* and unstructured metadata (snapshots of receipts, complex JSON diffs) that would bloat relational tables.

**Sample Audit Document:**
```json
{
  "_id": "651a...",
  "action": "EXPENSE_ADDED",
  "entity": "EXPENSE",
  "entityId": 42,
  "userId": 5,
  "details": {
    "amount": 450,
    "currency": "INR",
    "split_between": [1, 5]
  },
  "timestamp": "2026-01-28T14:40:00Z"
}
```
*This document directly powers activity feeds like: "You added an expense (2 mins ago)".*

### 3. Neo4j (The Mathematician 🧠)
**Role**: Graph Computation & Optimization.
Neo4j maintains the live network of debts (`User A` OWES `User B`). It is used to run complex graph algorithms that are performant impossible in SQL.

-   **Data Stored**: Nodes (`User`) and Relationships (`OWES` with amount).
-   **Key Algorithm**: **Greedy Debt Minimization**.
    -   *Problem*: A owes B $10, B owes C $10.
    -   *Naive Solution*: 2 transactions (A->B, B->C).
    -   *Neo4j Solution*: Pathfinding detects circularity and reduces it to 1 transaction (A->C $10).
-   **Why not SQL?**: Recursive Common Table Expressions (CTEs) in SQL are slow for deep pathfinding. Neo4j handles traversal in O(1) time per hop.

---

## 🔄 The Data Flow (Life of an Expense)

1.  **Action**: User adds a dinner expense ($100) in the UI.
2.  **MySQL (Commit)**: 
    -   Backend calls `CALL sp_add_expense(...)`.
    -   MySQL validates balances, creates the record, and commits the transaction (ACID).
3.  **MongoDB (Audit)**:
    -   Upon success, the backend pushes an event to MongoDB: `{ action: "EXPENSE_ADDED", ... }`.
    -   The UI updates the "Recent Activity" feed instantly from this stream.
4.  **Neo4j (Compute)**:
    -   The backend syncs the debt to the Graph: `MATCH (u), (v) MERGE (u)-[:OWES]->(v)`.
    -   Neo4j re-calculates the most efficient settlement path.
5.  **UI (Visualize)**:
    -   The user sees the new expense in the list (MySQL).
    -   The "Debt Graph" updates to show the new connection (Neo4j).

---

## ⚖️ Why Multiple Databases?

| Feature | MySQL | MongoDB | Neo4j |
| :--- | :--- | :--- | :--- |
| **Primary Responsibility** | Structured Financial Data | Unstructured Event History | Relationship Optimization |
| **Data Model** | Relational Tables | JSON Documents | Nodes & Edges |
| **Query Style** | SQL (Joins/Aggregates) | MQL (Filtering/Time-series) | Cypher (Pattern Matching) |
| **Why is it here?** | Strict Consistency (ACID) | Flexible Schema & Logging | High-Performance Algorithms |
| **Replacement Consequence** | **Data Corruption** (Lost money) | **Blind Spots** (No audit trail) | **Inefficiency** (Complexity explodes) |

---

## 🚀 Installation & Setup

### Prerequisites
-   **MySQL 8.0+**
-   **MongoDB** (Local or Atlas)
-   **Neo4j Desktop** (or AuraDB)
-   **Node.js v18+**

### Step 1: Database Setup
1.  **MySQL**: Run `.\run_setup.bat` to install Schema & Procedures.
2.  **Env**: Create `backend/.env` with credentials for ALL THREE databases.
    ```env
    DATABASE_URL="mysql://root:pass@localhost:3306/splitpay_db"
    MONGO_URI="mongodb://localhost:27017/splitpay_logs"
    NEO4J_URI="bolt://localhost:7687"
    ```

### Step 2: Install Dependencies
Since this is a polyglot system, we need drivers for all DBs.
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Step 3: Start the System
Use the provided scripts to bundle the complex startup process:
1.  `.\start_backend.bat` (Connects to MySQL, Mongo, & Neo4j).
2.  `.\start_frontend.bat` (Launches the Next.js UI).

---

## 🧪 Verification
To verify the architecture is working:
1.  **Add an Expense**: See it appear in the **MySQL** `Expense` table.
2.  **Check Activity**: See the "Expense Added" log appear in the **MongoDB** collection.
3.  **View Graph**: See the new `OWES` edge created in the **Neo4j** browser.

**Author**: Antigravity (Agentic AI)
