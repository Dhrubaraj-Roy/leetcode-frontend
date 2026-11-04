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

### 6. Application Shell & Routing View (`src/App.jsx`)
The main application container featuring:
- **Initial Auth Check**: Dispatches `checkAuth()` on mount to restore user session from HTTP-only cookies.
- **Navigation Bar**: Clean brand header with logo, title, user name, and responsive toggle buttons for Sign In / Sign Up.
- **Auth State View Switcher**: Smoothly switches between Login and Signup forms without requiring routing boilerplate.
- **Authenticated Profile Card**: Displays user details (`firstName`, `emailId`, `role` badge) and an interactive Logout button upon successful login.

### 7. Styling & Theme Configuration (`src/index.css` & `index.html`)
- Configured daisyUI 5 with Tailwind CSS 4 using direct CSS imports (`@import "tailwindcss";` and `@plugin "daisyui";`).
- Applied dark theme (`data-theme="dark"`) out of the box for a sleek LeetCode aesthetic.
- Embedded SVG favicon to eliminate 404 console errors.

---

## Folder Structure

```
leetcode-frontend/
├── src/
│   ├── components/
│   │   ├── Login.jsx         # Login form component with validation & Redux dispatch
│   │   └── Signup.jsx        # 3-input signup form component with auto-redirect
│   ├── lib/
│   │   └── api.js            # Axios client configured with credentials & base URL
│   ├── schemas/
│   │   └── authSchema.js     # Zod validation schemas for signup & login
│   ├── store/
│   │   ├── authSlice.js      # Redux slice with Axios thunks (register, login, check, logout)
│   │   └── index.js          # Redux store configuration
│   ├── App.jsx               # Navigation bar & authentication flow view
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
| **Profile** | `getProfile()` | `GET /profile` | None | `Cookie: token=...` | Fetches full authenticated user profile data |
| **Logout** | `dispatch(logoutUser())` | `POST /logout` | None | `Cookie: token=...` | Clears cookie & blacklists JWT in Redis |

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
