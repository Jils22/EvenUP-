# COVER PAGE

**PROJECT REPORT ON**  
**EvenUP: A Full-Stack Expense-Sharing and Financial Consensus Application**

Submitted in partial fulfillment of the requirements for the award of the degree of  
**Bachelor of Technology / Bachelor of Science**  
in  
**Computer Science and Engineering**

**Submitted By:**  
[Your Name / Team Names]  
[Roll Number / Registration Number]

**Under the Guidance of:**  
[Guide/Professor Name]  
[Designation]

**Department of Computer Science and Engineering**  
**[University/College Name]**  
**[Year]**

---

# CERTIFICATE

This is to certify that the project report entitled **"EvenUP: A Full-Stack Expense-Sharing and Financial Consensus Application"** is the bona fide work of **[Your Name]** ([Roll Number]), submitted to **[University/College Name]** in partial fulfillment of the requirements for the award of the degree of Bachelor of Technology in Computer Science and Engineering. This autonomous project has been carried out under my supervision and guidance. The results embodied in this project report have not been submitted to any other University or Institute for the award of any degree or diploma.

\
\
**________________________**  
**[Guide Name]**  
[Designation]  
Department of Computer Science and Engineering  
[University/College Name]

\
**________________________**  
**Head of the Department**  
Department of Computer Science and Engineering  
[University/College Name]

---

# ACKNOWLEDGEMENT

I would like to express my profound gratitude to everyone who supported me throughout the course of this project. 

I am deeply thankful to my guide, **[Guide Name]**, for their continuous encouragement, invaluable suggestions, and technical insights that helped in shaping the EvenUP project. Their expertise and patient guidance during the challenging phases of system architecture and development were indispensable.

I also extend my sincere thanks to the Head of the Computer Science and Engineering Department, **[HOD Name]**, and the faculty members for providing all the necessary facilities and a conducive academic environment.

Finally, I would like to thank my family, friends, and peers whose moral support and constructive feedback contributed significantly to the successful completion of this endeavor.

---

# ABSTRACT

The effective management of shared financial commitments among peers, roommates, or travel groups has historically been a tedious and conflict-prone process. Disputes over disproportionate expenses, forgotten debts, and complex settlement calculations are common challenges. **EvenUP** is a comprehensive full-stack expense-sharing platform designed to alleviate these issues by automating the calculation, tracking, and settlement of shared expenses. 

Built using a modern technology stack—React.js on the frontend, Python FastAPI on the backend, and MongoDB for database management—EvenUP offers an intuitive digital environment akin to Splitwise, augmented with advanced functionalities. The system implements a robust algorithmic engine to calculate minimal debt transfers, automatically generating optimized settlement routes among group members. The project features group creation, detailed expense categorization, global ledger balances, PDF/CSV export capabilities, and a highly responsive dashboard for financial analytics. By leveraging JWT-based authentication and a secure API structure, EvenUP ensures the confidentiality and integrity of user financial data, providing a scalable and fault-tolerant solution to real-world peer-to-peer expense management.

---

# 1. INTRODUCTION

## 1.1 Background
The rapid growth of collaborative living, group travel, and shared workspaces has highlighted the critical need for transparent financial accounting. When individuals share expenses, keeping accurate track of who paid for what—and calculating who owes whom—can become mathematically complex. Traditional methods, such as utilizing spreadsheets or physical ledgers, are prone to human error, lack transparency, and often lead to social friction.

## 1.2 Purpose
The EvenUP application addresses these pain points by offering a centralized, real-time platform where users can record expenditures, track individual balances, and seamlessly process settlements across multiple distinct groups. The core purpose is to replace ambiguous and error-prone verbal or manual accounting with a strict, automated digital ledger system that transparently computes net balances.

## 1.3 Technologies Used
- **Frontend Framework:** React.js (with React Router for single-page application routing)
- **Styling:** Tailwind CSS (providing responsive and consistent UI components)
- **Backend Architecture:** FastAPI (Python-based framework prioritizing high performance and asynchronous programming)
- **Database Schema:** MongoDB (NoSQL database providing scalable document storage) via PyMongo
- **Authentication:** JSON Web Tokens (JWT) for secure, stateless user sessions

## 1.4 Key Features
- **Comprehensive Group Management:** Functionality allowing users to create, view, and manage different expense groups (e.g., "Paris Trip", "Apartment Utilities").
- **Optimized Settlement Engine:** An internal algorithm designed to minimize the total number of monetary transactions required to settle all debts within a group.
- **Global Financial Dashboard:** Real-time calculation and visualization of an individual's absolute net credit or debit across all active groups.
- **Data Exporting Module:** Functionality to export categorized expense data in CSV formatting for offline review or record-keeping.
- **Progressive UI/UX:** The inclusion of toast notifications, interactive balance cards, and real-time activity feeds for an engaging user experience.

---

# 2. OBJECTIVES

The development of the EvenUP system is guided by the following core, measurable objectives:
1. **Automate Debt Calculation:** Develop an algorithmic backend engine capable of computing minimal settlement transactions accurately for groups of up to 50 users.
2. **Eliminate Data Redundancy:** Design a non-relational database structure in MongoDB to store user, group, and expense data with normalized references to ensure consistent data retrieval.
3. **Achieve High-Performance API Responses:** Implement FastAPI to ensure the core expense-saving and retrieval endpoints respond within an average time of <200 milliseconds.
4. **Secure User Authorization:** Incorporate JWT authentication with encrypted password hashing (bcrypt) to protect user ledgers from unauthorized access.
5. **Ensure Cross-Device Compatibility:** Utilize Tailwind CSS to create a responsive web interface that functions seamlessly on mobile, tablet, and desktop viewports.
6. **Provide Data Portability:** Implement a feature that allows users to export full group expense history to CSV files within three clicks.
7. **Implement Global Aggregation:** Formulate a dashboard querying system to dynamically display a user's absolute total debt or credit across distinct and disparate groups.
8. **Facilitate Transparent Settlements:** Equip the system with explicit debt-clearing interfaces that log payment records permanently into the database ledger.

---

# 3. SYSTEM ANALYSIS

## 3.1 Identification of Need
Current systems utilized for expense sharing fall into two broad categories: manual ledgers (physical books or Excel) which are tedious and highly prone to loss of data, and existing enterprise software which may be overly complex or restricted by paywalls. A critical need exists for an open-architecture, highly responsive platform that minimizes operational friction while providing complete visibility into algorithmic debt resolution.

## 3.2 Existing System vs Proposed System
**Existing System (Manual / General Apps):**
- Difficult to determine who definitively owes whom after numerous overlapping transactions.
- Lacks a centralized and secure area accessible simultaneously by all involved parties.
- Fails to optimize settlements (e.g., A owes B $10, B owes C $10; traditional tracking requires two transactions, whereas optimization requires one: A pays C $10).

**Proposed System (EvenUP):**
- Completely automated mathematical resolution of intertwined debts utilizing a localized settlement algorithm.
- Immediate global syncing of balances across all group participants.
- A highly focused, user-centric dashboard avoiding the bloat of traditional banking software, utilizing visually distinct progress and cost indicators.

## 3.3 Feasibility Study
- **Technical Feasibility:** Python (FastAPI), React, and MongoDB comprise a proven, highly resilient technology stack. Open-source libraries are available for JWT, password hashing, and API management, validating the project's technical execution.
- **Economic Feasibility:** The project relies exclusively on open-source technologies and frameworks. Hosting can be achieved through free-tier cloud providers (e.g., Render, Vercel, MongoDB Atlas), ensuring near-zero capital expenditure during deployment.
- **Operational Feasibility:** The intuitive, flat-hierarchy interface minimizes the learning curve. End-users only need basic familiarity with web interfaces to participate, logging and checking expenses autonomously.

## 3.4 Project Planning
1. **Requirement Phase:** Gathering core Splitwise-style logic requirements, user specifications, and defining the system architecture.
2. **Design Phase:** Establishing MongoDB schema structures, creating wireframes for React components, and defining RESTful API endpoints.
3. **Development Phase:** Iterative programming; separating backend endpoint implementation from frontend integration.
4. **Testing Phase:** Implementing unit testing (Pytest) on backend logic and conducting manual end-to-end integration tests on UI flows.
5. **Deployment Phase:** Cloud provisioning and environmental variable configuration.

## 3.5 Project Scheduling
*Note: This report utilizes textual descriptors of required tracking charts.*
- **Gantt Chart Details:** The timeline is broken into 12 total weeks. Weeks 1-2 define architecture and wireframes. Weeks 3-5 focus purely on authentication and database linking. Weeks 6-8 encompass the core logic (expense addition and calculating settlement minimalization). Weeks 9-10 involve React UI styling and state management. Weeks 11-12 are designated for Pytest debugging, deployment, and documentation.
- **PERT Chart Details:** The critical path connects User Auth directly to Group Creation, progressing identically into Expense Tracking, and finalizing in Balance Computation, mapping the uncompromising sequential dependency of backend features.

---

# 4. SOFTWARE REQUIREMENT SPECIFICATION (SRS)

## 4.1 Functional Requirements
- **User Role:**
  - Secure account registration, login, and token generation.
  - Ability to create groups, invite users (via email/ID mapping), and view membership.
  - Ability to add detailed expenditures specifying exact amounts, descriptions, and categories.
  - Capability to execute and record settlements against debts to other users.
  - Ability to generate CSV exports of localized group expenses.
- **System Automated Tasks:**
  - Active re-computation of inter-group debt upon every newly recorded expense.
  - Global aggregation of an individual's financial standing calculated asynchronously for dashboard rendering.

## 4.2 Non-Functional Requirements
- **Performance:** App initial load time must be <2.0 seconds. API latency to backend services should not exceed >300ms to maintain real-time application feel.
- **Security:** All user passwords must be salted and hashed. API endpoints must intercept and reject unauthorized requests failing JWT validation.
- **Scalability:** The MongoDB structure must be optimized using correct indexing to handle tens of thousands of expense documents without algorithmic degradation.
- **Reliability:** Backend error handling must catch schema validation errors gracefully, returning specific HTTP status codes (e.g., 400 Bad Request, 422 Unprocessable Entity).

## 4.3 System Requirements
- **Hardware:**
  - Server: Minimum 1GB RAM, 1 CPU Core (Cloud VPS/Container).
  - Client: Modern Smartphone or PC with a minimum screen width of 320px.
- **Software:**
  - Python 3.9+ environment.
  - Node.js v16+ for React environment.
  - Modern web browser (Chrome, Safari, Firefox).
- **Network:** Continuous internet connection for data synchronization.

## 4.4 Constraints and Assumptions
- Active internet is continuously required (no offline caching implemented).
- Standard fiat monetary units are assumed (precision to two decimal points).

---

# 5. SOFTWARE ENGINEERING MODEL

The **Agile Methodology** (specifically an iterative, feature-driven approach) was selected as the foundational software engineering model for the EvenUP project. 

**Justification:**
Given the complexities involved in building the "minimal transfer settlement" algorithm, the software required continuous integration and immediate testing feedback loops. Utilizing the traditional Waterfall model would have delayed critical UI/UX testing until late in the lifecycle. By using Agile, the system was built in functional increments—starting with User Auth, progressing to Group CRUD, implementing the logic engine, and finally layering on the React frontend. This allowed the logic layer to be individually stress-tested with `pytest` independent of visual development, ensuring stability through each sprint.

---

# 6. DATA MODELS & DIAGRAMS

## 6.1 Data Flow Diagrams (DFD)
- **Level 0 DFD (Context Diagram):** 
  - *External Entity:* User.
  - *Main Process:* EvenUP Application System.
  - *Data Flow:* The User sends 'Authentication Data', 'Expense Details', 'Group Details', and 'Settlement Confirmations' to the process. The System returns 'Net Balances', 'Expense Feeds', 'Dashboards', and 'CSV Reports' back to the User.
- **Level 1 DFD:**
  - *Processes:* 1.0 Manage Authentication, 2.0 Manage Groups, 3.0 Add/Edit Expense, 4.0 Calculate Settlements, 5.0 Generate Reports.
  - *Data Stores:* D1: User Store, D2: Group Store, D3: Expense Store.
  - *Data Flow Example:* Process 3.0 pushes 'Cost Data' to D3. Process 4.0 pulls all 'Cost Data' from D3, evaluates minimal debts, and pushes 'Debt Ratios' dynamically to the frontend client.

## 6.2 Entity-Relationship (ER) Diagram
- **Entity: User** [Attributes: UserID (PK), Name, Email, PasswordHash, CreatedAt]
- **Entity: Group** [Attributes: GroupID (PK), GroupName, CreatedBy, CreatedAt, MemberIDs]
- **Entity: Expense** [Attributes: ExpenseID (PK), GroupID (FK), PaidBy (FK), Amount, Description, Category, SplitMethod]
- **Entity: Settlement** [Attributes: SettlementID (PK), PayerID (FK), PayeeID (FK), GroupID (FK), Amount, Status]
- **Relationships:**
  - User -> Creates/Joins -> Group (Many-to-Many)
  - User -> Pays -> Expense (One-to-Many)
  - Group -> Contains -> Expense (One-to-Many)

## 6.3 Use Case Diagram
- **Actors:** Registered User
- **System Boundary:** EvenUP Application Core
- **Use Cases:** 
  - User -> (Register / Login)
  - User -> (Create Group / Add Members)
  - User -> (Add Expense)
  - User -> (View Dashboard / Owed Balances) <<includes>> (Calculate Settlement Engine)
  - User -> (Clear/Settle Debt)
  - User -> (Export CSV data)

## 6.4 System Flowchart
1. **Start**
2. User accesses platform -> Check Auth Token.
3. If Valid -> Route to **Dashboard**; If Invalid -> Route to **Login**.
4. Inside Dashboard -> Select Group.
5. In Group -> Choose Action (Add Expense, View Balances, Settle).
6. If 'Add Expense' -> Enter Details -> Validate -> Update Database -> Trigger recalculation module.
7. Return updated balances to User Interface.
8. **End**

---

# 7. SYSTEM DESIGN

## 7.1 Architecture Design
EvenUP utilizes a decoupled **Three-Tier Architecture / Client-Server Model**:
1. **Presentation Layer (Client):** Developed as a Single Page Application (SPA) using React.js. It handles routing locally and interfaces purely through HTTP Requests.
2. **Application Logic Layer (Server):** The FastAPI Python application that processes requests, enforces algorithmic debt calculation, validates data via Pydantic models, and executes HTTP middleware logic.
3. **Data Access Layer (Database):** A MongoDB instance communicating asynchronously with the backend API to store schemaless JSON-like collections.

## 7.2 Modular Design
The system is bifurcated into distinct modular domains to enforce separation of concerns:
- **Authentication Module:** Handles `/login`, `/register`, JWT issuance, and verification.
- **Group Management Module:** Facilitates group provision, tracking participating members, and aggregating localized history.
- **Expense Controller Hub:** Orchestrates expense logging, ensuring category alignment and distributing payment fractions to targeted users.
- **Debt Resolution Module:** The pure-math algorithmic processor that evaluates the network of debts and trims cyclical redundancies.
- **Notification & Export Module:** Governs user toast notifications and CSV compiling capabilities.

## 7.3 Database Design
Implemented within MongoDB Collections:
- `users`: `_id` (ObjectId), `name` (String), `email` (String, Unique), `hashed_password` (String), `created_at` (Datetime).
- `groups`: `_id` (ObjectId), `name` (String), `members` (Array of ObjectIds referencing users), `created_by` (ObjectId).
- `expenses`: `_id` (ObjectId), `group_id` (ObjectId), `paid_by` (ObjectId), `amount` (Double), `description` (String), `category` (String), `splits` (Array of objects specifying user id and proportional debt), `timestamp` (Datetime).
- `settlements`: `_id` (ObjectId), `group_id` (ObjectId), `payer` (ObjectId), `receiver` (ObjectId), `amount` (Double).

## 7.4 UI Design
- **Login/Register:** Centered, minimalist card design featuring floating label inputs to maximize layout cleanliness against a soft gradient background.
- **Global Dashboard:** Features dynamic 'Balance Cards' indicating net positive (green) or net negative (red) statuses. A vertical split view provides a grouped list on the sidebar and summary statistics centrally.
- **Group Detail Screen:** Includes prominently placed 'Settle Up' and 'Export CSV' buttons. Provides a tabbed interface distinguishing between "Recent Expenses" (a chronological feed with category icons) and "Balances" (showing optimized debt transfers graphically).

---

# 8. IMPLEMENTATION & CODING STANDARDS

- **API Standardization:** All backend endpoints enforce strict RESTful conventions using HTTP verbs accurately (`GET` for retrieval, `POST` for mutation, `PUT` for updates).
- **Validation:** Pydantic is widely deployed across the backend specifically validating payload constraints dynamically before any data touches the MongoDB layer.
- **Frontend State:** The React interface leverages `axios` integrated context layers and React Query to cache and mutate global application state effectively without excessive prop drilling.
- **Error Handling:** Backend intercepts all schema failure or database fault errors, returning explicit, human-readable JSON error strings mapping directly to the frontend's unified unified Toast notification handler seamlessly.
- **Naming Conventions:** Enforced specific snake_case for all Python variables/functions, PascalCase for React Components, and camelCase for JavaScript variables.

---

# 9. TESTING

Testing involves three synchronized layers: Modular Unit Tests, API Integration Tests, and E2E UI verification.

## 9.1 Test Case Table

| Test ID | Description | Input | Expected Output | Actual Result | Status |
|---|---|---|---|---|---|
| TC-01 | User Registration | Valid Email, Name, PW | Code 201; MongoDB inserts row | Insert successful, user created | Pass |
| TC-02 | Auth Rejection | Wrong Password | Code 401; "Invalid Credentials" | Received 401 | Pass |
| TC-03 | Debt Logic 1 | A pays $30 for A,B,C | B owes A $10, C owes A $10 | Engine outputs correct map | Pass |
| TC-04 | Debt Minimization | cyclical debt (A->B->C->A) | Redundant paths removed entirely | Engine outputs zero transfers | Pass |
| TC-05 | CSV Export UI | Click 'Export CSV' btn | Download prompt triggered | File downloads with valid data | Pass |
| TC-06 | Dashboard Metrics | Add -$50 and +$20 records | Total Dashboard Balance: -$30 | Reflected precisely | Pass |

---

# 10. SECURITY MEASURES

- **Stateless Authentication:** JSON Web Tokens (JWT) encapsulate the user identity securely. The cryptographic signature implies tokens cannot be tampered with client-side.
- **Secure Handling of Secrets:** Database URIs and API Secret Keys are aggressively stripped from source control, relying strictly on environment (`.env`) variables.
- **Password Hashes:** User credentials are obfuscated instantly utilizing `bcrypt` algorithms via `passlib`; plain text passwords are never stored or transmitted inadvertently.
- **Authorization Enforcement:** The backend implements dependency injections mechanism (`get_current_user`) requiring validity headers for every sensitive route to verify membership scope explicitly before revealing Group details.

---

# 11. COST ESTIMATION

Using a standardized cost breakdown modeled on independent development paradigms:
- **Development Work (Human Capital Estimate):** 300 Hours (Frontend, Backend, Database architecture) valued at a nominal academic open-source equivalent. 
- **Software Metrics:** Functional Point Analysis estimates ~65 core unadjusted functional points across CRUD operations and algorithmic engines.
- **Infrastructure Cost (Production Estimate):**
  - MongoDB Atlas Cloud Database Configuration: $0.00 / mo (Utilizing generous free M0 Sandbox).
  - Web Hosting (Vercel): $0.00 / mo (Frontend React).
  - API Compute (Render/Railway): $0.00 / mo (Free Tier Python Worker).
- **Total Operational Expense:** Entirely subsidized by modern PaaS free-tiers for the current traffic parameters.

---

# 12. FUTURE SCOPE

While currently robust, EvenUP sets the architectural stage for multiple progressive expansions:
- **AI Financial Advisor Integration:** Implementation of LLM endpoints analyzing group expenditures to provide intelligent suggestions on spending trends and automatic categorization of complex receipts.
- **Blockchain Consensus Mechanisms:** Employing zero-trust verifiable proofs requiring absolute digital consensus among group members before an expense mathematically anchors into the ledger.
- **Mobile Application Porting:** Migrating the React.js web interface to React Native to deliver a dedicated application to both iOS and Android App Stores featuring push notification integration.
- **OCR Receipt Scanning:** Incorporating computer vision libraries to autonomously draft expenses by photographing till receipts.

---

# 13. BIBLIOGRAPHY

1. Flask/FastAPI Official Documentation (https://fastapi.tiangolo.com)
2. React.js and Context API Technical Manuals (https://reactjs.org/docs)
3. Mongodb schema design patterns for applications (https://www.mongodb.com)
4. Splitwise Algorithmic Case Studies - "How to minimize cash flow in a network" (Academic Graph Theory models).
5. "Clean Architecture: A Craftsman's Guide to Software Structure and Design" - Robert C. Martin.

---

# 14. GLOSSARY

- **API (Application Programming Interface):** A set of protocols for building and interacting with software applications.
- **E2E (End-to-End Testing):** A methodology to test whether the flow of an application is performing as designed from start to finish.
- **FastAPI:** A modern web framework for building APIs with Python 3.7+ based on standard Python type hints.
- **JWT (JSON Web Token):** An open standard that defines a compact and self-contained way for securely transmitting information between parties as a JSON object.
- **MongoDB:** A source-available cross-platform document-oriented database program classified as a NoSQL database program.
- **React.js:** A free and open-source front-end JavaScript library for building user interfaces based on UI components.
- **Pydantic:** A Python library for data parsing and validation utilizing type annotations.
- **Tailwind CSS:** A utility-first CSS framework for rapidly building custom user interfaces.
