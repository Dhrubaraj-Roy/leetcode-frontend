# LeetCode Clone - Frontend

[![LeetCode](https://img.shields.io/badge/LeetCode-FFA116?style=for-the-badge&logo=LeetCode&logoColor=black)](https://leetcode.com/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![daisyUI](https://img.shields.io/badge/daisyUI_5-5A0EF8?style=for-the-badge&logo=daisyui&logoColor=white)](https://daisyui.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)](https://react-hook-form.com/)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-1E1E1E?style=for-the-badge&logo=visualstudiocode&logoColor=007ACC)](https://microsoft.github.io/monaco-editor/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ESM-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

This is the frontend for the full-stack LeetCode Clone project, built step by step using **React**, **Vite**, **daisyUI**, **Tailwind CSS**, and **React Hook Form with Zod**. It connects seamlessly with the LeetCode clone backend for authentication, coding problem solving, and real-time code evaluation.

Architecture Diagram:
TLDraw - https://www.tldraw.com/f/-1wZ1l0c492YWuhoW7-cT?d=v23.-15.1420.962.page

Backend Repository:
GitHub - https://github.com/Dhrubaraj-Roy/leetcode-clone

---

## Project Timeline and Progress Log

I am documenting my progress with dates as I build each part of the frontend step by step.

### Milestone 1: Frontend Initialization, Vite Setup & daisyUI Styling
- Date: November 2, 2026
- What I completed:
  1. Initialized the frontend repository with Vite and React 19 in ESM (`"type": "module"`).
  2. Integrated Tailwind CSS 4 with `@tailwindcss/vite` and daisyUI 5, eliminating obsolete PostCSS and `tailwind.config.js` configuration files.
  3. Configured the default dark theme in `index.html` (`data-theme="dark"`) with responsive full-height layout containers.
  4. Configured development proxy in `vite.config.js` to route `/api/*` requests directly to the backend Express server at `http://localhost:3000`, resolving CORS obstacles and ensuring smooth HTTP-only cookie exchange during local testing.
  5. Configured `.gitignore` and `.env.example` following production best practices.

### Milestone 2: Schema Validation & Signup Page Implementation
- Date: November 2, 2026
- What I completed:
  1. Created a centralized validation module `src/schemas/authSchema.js` using **Zod**.
  2. Implemented `signupSchema` with strict input validation aligned with the backend's `validateSignUpData` rules:
     - `firstName`: Required, trimmed non-empty string.
     - `email`: Required, validated against standard email syntax.
     - `password`: Enforces minimum 8 characters, at least one lowercase letter, one uppercase letter, one digit, and one special character (matching `validator.isStrongPassword` on the backend).
  3. Installed and connected `@hookform/resolvers` and `react-hook-form` for minimal, zero-lag form state management.
  4. Designed and created the Signup component (`src/components/Signup.jsx`) containing only three inputs: **First Name**, **Email**, and **Password**.
  5. Implemented interactive features including show/hide password visibility toggle, clear inline error messages, a daisyUI loading spinner during submission, and responsive error/success alerts.
  6. Built `src/lib/api.js` using Axios with `withCredentials: true` to call `POST /register` with payload mapping (`firstName`, `emailId`, `password`).

### Milestone 3: Login Page Implementation & Auth State Management
- Date: November 2, 2026
- What I completed:
  1. Added `loginSchema` to `src/schemas/authSchema.js` requiring a valid email address and password.
  2. Created the Login component (`src/components/Login.jsx`) utilizing daisyUI cards, form-control inputs, and icons.
  3. Added `loginUser`, `logoutUser`, and `getProfile` API functions to `src/lib/api.js` for `POST /login`, `POST /logout`, and `GET /profile`.
  4. Updated `src/App.jsx` with a modern top navigation bar and an authentication view switcher allowing one-click toggling between **Sign In** and **Sign Up**.
  5. Built an authenticated dashboard preview displaying the logged-in user's name, email, role badge, and a functional logout trigger that calls the backend logout endpoint.
  6. Verified complete production build with `npm run build` with 0 warnings or errors.

### Milestone 4: Redux Toolkit State Management, Axios Thunks & Auto-Redirect on Signup
- Date: November 4, 2026
- What I completed:
  1. Integrated `@reduxjs/toolkit` and `react-redux` for centralized, predictable authentication state management.
  2. Configured the global Redux store in `src/store/index.js` and wrapped the application tree with `<Provider store={store}>` in `src/main.jsx`.
  3. Created `src/store/authSlice.js` with 4 asynchronous Axios thunks configured with `{ withCredentials: true }`:
     - `registerUser`: Sends registration payload to `POST /register`, automatically storing user info and setting `isAuthenticated = true` on success.
     - `loginUser`: Authenticates credentials against `POST /login` and handles rejection with backend error message forwarding.
     - `checkAuth`: Hits `GET /check` on startup to detect active sessions cleanly without throwing client-side console errors.
     - `logoutUser`: Hits `POST /logout` to trigger server-side Redis token blacklisting and resets client auth state.
  4. Dispatched `checkAuth()` in `src/App.jsx` on mount to maintain persistent user sessions across browser refreshes.
  5. Enhanced signup workflow: newly registered users now automatically redirect to the home page upon account creation with zero manual login required.
  6. Resolved component unmounting on submission by separating `isCheckingAuth` from action `isLoading`, keeping forms mounted and displaying inline "Invalid credentials" error alerts seamlessly.
  7. Configured auto-clearing for error alerts when the user edits email or password inputs.
  8. Embedded SVG favicon in `index.html` to eliminate 404 console errors.

### Milestone 5: Problem Browsing Homepage, Dynamic Multi-Filtering & Solved Tracking
- Date: November 5, 2026
- What I completed:
  1. Built the `problems` Redux slice (`src/store/problemSlice.js`) with two asynchronous Axios thunks:
     - `getAllProblems`: Calls `GET /problem/all` to fetch the complete coding problem collection with limit support.
     - `getSolvedProblems`: Calls `GET /problem/solved` with `{ withCredentials: true }` to retrieve unique problems solved by the logged-in user.
  2. Configured dynamic filtering state: status (`"all"` / `"solved"`), difficulty (`"all"` / `"easy"` / `"medium"` / `"hard"`), tag (`"all"` / dynamic string), and search query.
  3. Created the comprehensive Homepage component (`src/components/Home.jsx`):
     - **Filter 1 (Status)**: Toggle between "All Problems" and "Solved Problems", leveraging an $O(1)$ `useMemo` hash Set of solved problem IDs to instantly detect solved status.
     - **Filter 2 (Difficulty)**: Dropdown filter for All Difficulties, Easy, Medium, and Hard with color-coded daisyUI badges.
     - **Filter 3 (Tags)**: Dynamically extracts all unique tags from the problem database (e.g. `#array`, `#string`, `#hash-table`) and populates both the filter dropdown and interactive clickable tag pills in the problem table.
     - **Real-Time Search Bar**: Live filtering across problem titles and tags.
     - **Stats Progress Widget**: Displays total solved count and an animated radial progress bar (`solvedCount / totalCount`).
     - **Problem Table**: Responsive zebra table showing status checkmarks (green `CheckCircle2` for solved vs gray `Circle` for unsolved), difficulty badges, tag pills, and "Solve" action buttons.
  4. Integrated the Homepage into `src/App.jsx` as the primary dashboard view while keeping problem exploration accessible to public visitors.
  5. Added `fetchAllProblems` and `fetchSolvedProblems` helper functions to `src/lib/api.js`.

### Milestone 6: Role-Based Admin Panel Routing, Problem Management & Security Safeguards
- Date: November 7, 2026
- What I completed:
  1. Enforced strict role-based routing rules in `src/App.jsx`:
     - **Admin Routing**: If the user is authenticated (`isAuthenticated === true`) and their role is admin (`user?.role === "admin"`), they automatically land on the **Admin Panel** (`currentView = "admin"`).
     - **Fallback / Home Routing**: If unauthenticated or authenticated as a standard user (`user?.role !== "admin"`), any attempt to access the Admin Panel redirects to the **Home page** (`currentView = "home"`).
     - **Post-Logout Routing**: Logging out resets the view safely back to the Home page.
  2. Created the Admin Panel component (`src/components/AdminPanel.jsx`):
     - **Security Guard**: Client-side privilege verification that immediately prevents unauthorized access and offers a return-to-home trigger.
     - **Live Platform Metrics**: Metric cards showing real-time counts for Total Challenges, Easy, Medium, and Hard problems.
     - **Problem Management Table**: Responsive table with live searching, difficulty filtering, problem descriptions, tags, and administrative Update / Delete triggers.
     - **Three Core Admin Actions**: "Create Problem" (navigates to `/problem/create`), "Update Problem" (opens modal with pre-filled fields), and "Delete Problem" (deletes challenge with confirmation).
  3. Extended Redux `problemSlice` (`src/store/problemSlice.js`) with admin actions:
     - `deleteProblem`: Dispatches `DELETE /problem/delete/:id` with `{ withCredentials: true }` and optimistic removal from state.
     - `createProblem`: Dispatches `POST /problem/create` with verified test cases and solution code.
     - `updateProblem`: Dispatches `PUT /problem/update/:id` with modified problem fields.
  4. Updated the top navigation bar to render an **ADMIN** badge, an Admin Panel / Problems switcher for administrators, and instant logout handling.

### Milestone 7: Dedicated Problem Creation Route, Multi-Test-Case Architecture & JSON Importer
- Date: November 8, 2026
- What I completed:
  1. Implemented dedicated route at `/problem/create` in `src/App.jsx` with browser History API URL synchronization (`pushState` and `popstate`) and admin-only access guards.
  2. Built the Problem Creation page (`src/components/CreateProblem.jsx`):
     - **Clean Inputs with Placeholders**: Form fields start completely blank so admins can type a new problem without deleting dummy values, while comprehensive formatting examples are placed strictly in input placeholders.
     - **Two Test Cases Requirement & Dynamic Controls**: Both visual (visible) and written (hidden) test case sections explicitly instruct: *"You have to upload two test cases."* By default, each section displays only one input with an option to add another one (`+ Add Visible Test Case` / `+ Add Hidden Test Case`).
     - **Form Validation**: Enforces that at least two visible test cases and two hidden test cases are filled before submission.
     - **Dual-Language Code (Python & C++)**: Configured tabbed interface allowing admins to provide complete reference solution code and starter templates for both Python and C++.
     - **Import / Paste JSON**: Built a modal enabling admins to paste raw challenge JSON to instantly auto-populate all form fields, test cases, and code solutions in one click.
     - **Alert Notification on Success**: Dispatches `POST /problem/create`, triggers `alert("Problem was created successfully!")`, renders an in-app DaisyUI alert banner, and redirects back to the Admin Panel.
  3. Verified complete production build with `npm run build` (0 warnings or errors).

### Milestone 8: Monaco Code Editor Integration, Problem Route & Split Workspace UI
- Date: November 8, 2026
- What I completed:
  1. Integrated `@monaco-editor/react` (v4.7.0) with dark theme (`vs-dark`), syntax highlighting, automatic responsive layout, custom tab sizing, and line numbering.
  2. Implemented dedicated problem route at `/problem/:id` in `src/App.jsx` with History API URL synchronization (`pushState` / `popstate`) so clicking any problem from the problem list routes straight to the code editor.
  3. Built the Problem Detail and Code Workspace component (`src/components/ProblemDetail.jsx`):
     - **Top Action Header**: Unified sleek bar with LeetCode logo, `< Problem List` back link, `Run` button, and green `Submit` button (strictly no extraneous settings or notification buttons).
     - **Split Workspace Layout**: Full-height responsive layout with independent scrolling for description and code execution.
     - **Left Panel (Problem Information)**:
       - **Description Tab**: Renders challenge title, difficulty badge, tags, problem description, and formatted example test cases with Input, Output, and Explanation.
       - **Editorial Tab**: Algorithmic intuition, step-by-step logic, time/space complexity analysis, and complete reference solution walkthrough.
       - **Submissions Tab**: Real-time table fetching the user's historical submissions from `GET /submit/:problemId` (status badge, language, runtime, memory, and date).
     - **Right Panel (Monaco Code Editor & Console Drawer)**:
       - **Language Switcher**: Toggle between Python 3 and C++ with automatic starter code population from backend `startCode` templates.
       - **Reset Code**: Restores initial starter template for the active language with confirmation guard.
       - **Bottom Drawer - Testcase Tab**: Case pill selectors (`Case 1`, `Case 2`, etc.) showing input and expected output.
       - **Bottom Drawer - Test Result Tab**: Live evaluation results from Judge0 displaying verdict (`Accepted`, `Wrong Answer`, `Runtime Error`), execution time, memory usage, and per-case output vs. expected output comparisons.
  4. Added API execution functions in `src/lib/api.js`:
     - `runCodeApi`: Calls `POST /problem/run/:problemId` to test against visible example test cases without database writes.
     - `submitCodeApi`: Calls `POST /problem/solve/:problemId` to evaluate against all test cases (visible + hidden) via Judge0 and record submission.
     - `fetchProblemSubmissionsApi`: Calls `GET /submit/:problemId` to retrieve submission history.
  5. Verified complete production build with `npm run build` (0 errors or warnings).

---

## What I Built So Far

### 1. Zod Validation Schemas (`src/schemas/authSchema.js`)
Created reusable Zod schemas that validate user inputs on the client before triggering API network requests:
- **`signupSchema`**:
  - `firstName`: `z.string().trim().min(1, "First name is required")`
  - `email`: `z.string().trim().min(1, "Email is required").email("Please enter a valid email address")`
  - `password`: `z.string().min(8, "Password must be at least 8 characters long")` with regex checks for lowercase, uppercase, digits, and special characters matching backend validation.
- **`loginSchema`**:
  - `email`: `z.string().trim().min(1, "Email is required").email("Please enter a valid email address")`
  - `password`: `z.string().min(1, "Password is required")`

### 2. Redux Toolkit Auth Store (`src/store/authSlice.js` & `src/store/index.js`)
Global state management handling all user authentication operations:
- **State Properties**:
  - `user`: Holds the authenticated user object (`id`, `firstName`, `lastName`, `emailId`, `role`) or `null`.
  - `isAuthenticated`: Boolean flag indicating whether the user is logged in.
  - `isCheckingAuth`: Boolean flag active only during the initial session check on app boot.
  - `isLoading`: Boolean flag active during active login or registration form submissions.
  - `error`: Stores backend or network error messages (e.g., `"Invalid credentials"`).
- **Async Thunks**:
  - `registerUser`: Calls `POST /register`, registers user, and auto-authenticates.
  - `loginUser`: Calls `POST /login`, receives session cookie, and updates state.
  - `checkAuth`: Calls `GET /check`, checks cookie validity, and restores session without console errors.
  - `logoutUser`: Calls `POST /logout`, invalidates JWT, and clears auth state.
- **Reducers**:
  - `clearError`: Resets error state when user modifies input fields.

### 3. API Service Layer (`src/lib/api.js`)
Centralized Axios instance pre-configured for backend communication:
- **`withCredentials: true`**: Automatically sends and receives HTTP-only cookies (`token`) issued by the backend JWT authentication system.
- **`baseURL`**: Points to `/api` (proxied by Vite to `http://localhost:3000` in development) or `VITE_API_URL` in production.
- Exported helper functions for standalone API operations.

### 4. Signup Component (`src/components/Signup.jsx`)
A clean, minimal, production-grade signup card built with daisyUI, React Hook Form, and Redux:
- Strictly contains three inputs:
  1. **First Name**: Input with User icon.
  2. **Email Address**: Input with Mail icon.
  3. **Password**: Input with Lock icon and Show/Hide toggle.
- Uses `zodResolver(signupSchema)` for instantaneous client-side validation.
- Dispatches `registerUser` via Redux Toolkit and auto-redirects to home upon completion.
- Handles backend errors gracefully with responsive error alerts.
- Displays a daisyUI `loading-spinner` on the submit button while the request is in flight.
- Provides a switch link to navigate to the Login page.

### 5. Login Component (`src/components/Login.jsx`)
A companion authentication component matching the styling of the Signup page:
- Form fields: Email Address and Password.
- Show/Hide password toggle button.
- Built-in validation via `zodResolver(loginSchema)`.
- Dispatches `loginUser` via Redux Toolkit.
- Displays real-time error feedback (e.g. `"Invalid credentials"`) in a red daisyUI alert banner.
- Auto-clears error alerts on input change.
- Provides a switch link to navigate to the Signup page.

### 6. Problem Slice & Redux Store (`src/store/problemSlice.js` & `src/store/index.js`)
Dedicated state management module for coding problems:
- **State Properties**:
  - `problems`: Array of all available coding problem objects.
  - `solvedProblems`: Array of problems solved by the authenticated user.
  - `filters`: Object tracking active filters (`status`, `difficulty`, `tag`, and `search`).
  - `isLoading`: Boolean loading flag during API data fetches.
  - `error`: Error message string if requests fail.
- **Async Thunks**:
  - `getAllProblems`: Calls `GET /problem/all` to fetch the problem collection.
  - `getSolvedProblems`: Calls `GET /problem/solved` to fetch solved problem records.
  - `deleteProblem`: Calls `DELETE /problem/delete/:id` (Admin only) to remove a problem.
  - `createProblem`: Calls `POST /problem/create` (Admin only) to create a verified problem.
- **Filter Actions**:
  - `setStatusFilter`: Switches between `"all"` and `"solved"`.
  - `setDifficultyFilter`: Filters by `"all"`, `"easy"`, `"medium"`, or `"hard"`.
  - `setTagFilter`: Filters by dynamically extracted problem tags.
  - `setSearchQuery`: Filters by problem title or keyword.
  - `resetFilters`: Resets all filters back to default.

### 7. Admin Panel Component (`src/components/AdminPanel.jsx`)
Administrative management console restricted to users with `role: "admin"` providing 3 core problem operations:
- **1. Create Problem**: Navigates to the dedicated `/problem/create` route to publish a new challenge.
- **2. Update Problem**: Each problem row contains an "Update Problem" button. When clicked, the modal opens with all current values already pre-filled (title, difficulty, description, tags, test cases, solution code) so the admin can simply edit the desired value and save.
- **3. Delete Problem**: Each problem row contains a "Delete Problem" button that prompts for confirmation and removes the challenge from the database.
- **Access Guard**: Instant verification preventing unauthorized regular users or unauthenticated visitors from accessing administrative tools.
- **Platform Analytics**: Real-time summary cards displaying Total Challenges, Easy, Medium, and Hard problem counts.
- **Problem Directory**: Searchable, filterable table listing challenges with tag badges, difficulty ratings, and action controls.

### 8. Problem Creation Page (`src/components/CreateProblem.jsx`)
Dedicated creation interface mounted at route `/problem/create`:
- **Clean Inputs with Helpful Placeholders**: Form fields start completely blank so users can author new problems without deleting placeholder data, while comprehensive syntax examples are placed strictly in input placeholders.
- **Two Test Cases Requirement & Dynamic Controls**: Explicitly instructs *"You have to upload two test cases."* in both visual and written test case sections. Displays 1 test case by default with `+ Add Test Case` controls to add the required second case.
- **Dual-Language Code (Python & C++)**: Tabbed editor supporting complete reference solutions and user starter templates for both Python and C++.
- **Import / Paste JSON**: Modal enabling admins to paste raw challenge JSON to instantly auto-populate all form fields, test cases, and code solutions in one click.
- **Alert Notification**: Triggers `alert("Problem was created successfully!")` and an in-app DaisyUI alert banner upon creation, automatically redirecting back to the Admin Panel.

### 9. Homepage Component (`src/components/Home.jsx`)
The main problem exploration dashboard featuring:
- **3 Dynamic Filters**:
  1. **Status Filter**: Tab toggle for "All Problems" vs "Solved Problems". Utilizes an $O(1)$ `useMemo` hash Set of solved problem IDs for instant checkmark evaluation.
  2. **Difficulty Filter**: Dropdown filter for Easy, Medium, and Hard with color-coded daisyUI badges.
  3. **Tag Filter**: Dynamically extracts all unique tags from MongoDB (e.g. `#array`, `#string`) for both dropdown selection and interactive row tag pills.
- **Live Search Bar**: Real-time filtering across problem titles and tags.
- **Solved Stats Progress Bar**: Radial progress indicator displaying `solvedCount / totalCount` with percentage.
- **Problems Table**: Responsive table showing status icons (green `CheckCircle2` for solved vs gray `Circle` for unsolved), difficulty badges, tag badges, and "Solve" action buttons.

### 10. Application Shell & Role-Based Routing (`src/App.jsx`)
The main application container featuring:
- **Role-Based Routing**:
  - If authenticated user has `role === "admin"`, routes to the **Admin Panel** (`currentView = "admin"`).
  - Otherwise (guests, regular users with `role === "user"`), routes to the **Home page** (`currentView = "home"`).
- **Initial Auth Check**: Dispatches `checkAuth()` on mount to restore user session from HTTP-only cookies without throwing console errors.
- **Navigation Bar**: Sticky brand header with logo, title, user info, admin badge, and responsive switcher for Admin Panel / Problems / Sign In / Sign Up.
- **Secure View Switcher**: Smoothly handles authenticated and public states with zero unauthorized leaks.

### 11. Styling & Theme Configuration (`src/index.css` & index.html)
- Configured daisyUI 5 with Tailwind CSS 4 using direct CSS imports (`@import "tailwindcss";` and `@plugin "daisyui";`).
- Applied dark theme (`data-theme="dark"`) out of the box for a sleek LeetCode aesthetic.
- Embedded SVG favicon to eliminate 404 console errors.

---

## Folder Structure

```
leetcode-frontend/
├── src/
│   ├── components/
│   │   ├── AdminPanel.jsx    # Admin dashboard for problem management & catalog stats
│   │   ├── CreateProblem.jsx # Dedicated page/route for /problem/create with alert confirmation
│   │   ├── Home.jsx          # Homepage with 3 filters, stats, and problem table
│   │   ├── Login.jsx         # Login form component with validation & Redux dispatch
│   │   └── Signup.jsx        # 3-input signup form component with auto-redirect
│   ├── lib/
│   │   └── api.js            # Axios client configured with credentials & base URL
│   ├── schemas/
│   │   └── authSchema.js     # Zod validation schemas for signup & login
│   ├── store/
│   │   ├── authSlice.js      # Redux slice with Axios thunks (register, login, check, logout)
│   │   ├── problemSlice.js   # Redux slice with problem fetching, admin actions & filters
│   │   └── index.js          # Redux store configuration combining auth & problem reducers
│   ├── App.jsx               # Navigation bar & role-based view router
│   ├── index.css             # Tailwind CSS & daisyUI 5 imports
│   └── main.jsx              # React DOM mounting entrypoint with Redux Provider
├── .env.example              # Example environment variable file
├── .gitignore                # Production git ignore configuration
├── index.html                # HTML entrypoint with dark theme & SVG favicon
├── package.json              # Dependencies and build scripts
├── readme.md                 # Project documentation and progress log
└── vite.config.js            # Vite configuration with /api backend proxy
```

---

## Environment Variables

Create a `.env` file in the root directory if you need to override the backend API URL (defaults to `/api` proxy in development):

```env
# Backend API base URL
VITE_API_URL=/api
```

---

## How It Connects to the Backend

The frontend is specifically tailored to interact with the [LeetCode Clone Backend](https://github.com/Dhrubaraj-Roy/leetcode-clone):

| Action | Frontend Trigger | Backend Endpoint | Request Body | Headers / Cookies | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Register** | `dispatch(registerUser())` | `POST /register` | `{ firstName, emailId, password }` | Sets `token` HTTP-only cookie | Creates user, authenticates session, auto-redirects to home |
| **Login** | `dispatch(loginUser())` | `POST /login` | `{ emailId, password }` | Sets `token` HTTP-only cookie | Validates credentials, sets user in Redux |
| **Check Auth** | `dispatch(checkAuth())` | `GET /check` | None | `Cookie: token=...` | Verifies active session on reload (no 401 console error) |
| **Get All Problems** | `dispatch(getAllProblems())` | `GET /problem/all` | None | Optional `Cookie: token=...` | Fetches coding problems with allowlisted public fields |
| **Get Solved Problems** | `dispatch(getSolvedProblems())` | `GET /problem/solved` | None | `Cookie: token=...` | Fetches unique solved problems for logged-in user |
| **Create Problem** | `dispatch(createProblem())` | `POST /problem/create` | `{ title, description, difficulty, tags, ... }` | `Cookie: token=...` (Admin) | Verifies solution via Judge0 & creates new challenge |
| **Update Problem** | `dispatch(updateProblem({ id, problemData }))` | `PUT /problem/update/:id` | `{ title, description, difficulty, tags, ... }` | `Cookie: token=...` (Admin) | Updates fields of existing challenge in database |
| **Delete Problem** | `dispatch(deleteProblem(id))` | `DELETE /problem/delete/:id` | None | `Cookie: token=...` | Deletes problem from database (Admin only) |
| **Get Problem by ID** | `fetchProblemById(id)` | `GET /problem/get/:id` | None | Optional `Cookie: token=...` | Fetches full challenge details, starter code, and test cases |
| **Run Code** | `runCodeApi({ problemId, language, code })` | `POST /problem/run/:problemId` | `{ language, code }` | `Cookie: token=...` | Runs code against visible example test cases via Judge0 |
| **Submit Code** | `submitCodeApi({ problemId, language, code })` | `POST /problem/solve/:problemId` | `{ language, code }` | `Cookie: token=...` | Evaluates code against visible + hidden test cases via Judge0 |
| **Get Submissions** | `fetchProblemSubmissionsApi(problemId)` | `GET /submit/:problemId` | None | `Cookie: token=...` | Fetches user's past submission history for problem |
| **Profile** | `getProfile()` | `GET /profile` | None | `Cookie: token=...` | Fetches full authenticated user profile data |
| **Logout** | `dispatch(logoutUser())` | `POST /logout` | None | `Cookie: token=...` | Clears cookie & blacklists JWT in Redis, routes to home |

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Vite Development Server
```bash
npm run dev
```
The application will be running at `http://localhost:5173`. Ensure your backend server is also running on `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```
