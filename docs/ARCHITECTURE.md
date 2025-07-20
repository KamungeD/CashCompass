# CashCompass - System Architecture

**Author:** Duncan Kamunge ([@KamungeD](https://github.com/KamungeD))  
**Last Updated:** July 2025  

---

## 🏗️ High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│  Express API    │────│   MongoDB       │
│   (Frontend)    │    │   (Backend)     │    │  (Database)     │
│                 │    │                 │    │                 │
│ • Tailwind CSS │    │ • JWT Auth      │    │ • User Data     │
│ • React Router │    │ • RESTful API   │    │ • Transactions  │
│ • Context API   │    │ • Validation    │    │ • Budgets       │
│ • Chart.js      │    │ • Error Handling│    │ • Categories    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
    ┌───▼────┐              ┌────▼────┐              ┌────▼────┐
    │Vercel/ │              │ Render/ │              │MongoDB  │
    │Netlify │              │Railway  │              │ Atlas   │
    └────────┘              └─────────┘              └─────────┘
```

## 📁 Project Structure

```
cashcompass/
├── 📋 Planning & Documentation
│   ├── README.md
│   ├── Development-Plan.md
│   ├── Development-Checklist.md
│   └── docs/
│       ├── REQUIREMENTS.md
│       ├── ARCHITECTURE.md
│       └── API.md
│
├── 🔧 Configuration
│   ├── package.json (workspace root)
│   ├── .env.example
│   ├── .gitignore
│   └── .github/workflows/
│
├── 🖥️ Backend (Node.js + Express)
│   ├── server.js
│   ├── package.json
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   └── Budget.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   └── budgets.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── transactionController.js
│   │   └── budgetController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   └── utils/
│       ├── validators.js
│       └── helpers.js
│
└── 🎨 Frontend (React + Tailwind)
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── components/
    │   │   ├── common/
    │   │   ├── forms/
    │   │   └── charts/
    │   ├── pages/
    │   │   ├── Dashboard/
    │   │   ├── Transactions/
    │   │   └── Budgets/
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── hooks/
    │   ├── services/
    │   └── utils/
    └── public/
```

## 🔄 Data Flow Architecture

### Authentication Flow
```
1. User submits login credentials
2. Frontend sends POST to /api/auth/login
3. Backend validates credentials
4. JWT token generated and returned
5. Frontend stores token in localStorage
6. Token included in subsequent API requests
7. Backend middleware validates token
```

### Transaction Management Flow
```
1. User creates transaction in form
2. Frontend validates input locally
3. POST request to /api/transactions
4. Backend validates and saves to MongoDB
5. Response sent back to frontend
6. UI updates with new transaction
7. Dashboard statistics refresh
```

### Budget Tracking Flow
```
1. User sets monthly budget limits
2. System calculates spent amounts from transactions
3. Real-time budget vs actual comparison
4. Alert notifications at 80% threshold
5. Visual progress bars in UI
```

## 🛡️ Security Architecture

### Authentication Security
- **JWT Tokens:** Stateless authentication with secure signing
- **Password Hashing:** bcrypt with salt rounds ≥ 12
- **Token Expiration:** 30-day expiration with refresh capability
- **Secure Storage:** JWT stored in httpOnly cookies (production)

### API Security
- **Rate Limiting:** 100 requests per 15-minute window
- **Input Validation:** Joi/Yup schema validation
- **CORS Configuration:** Restricted to allowed origins
- **Helmet.js:** Security headers and protection
- **Data Sanitization:** MongoDB injection prevention

### Environment Security
- **Environment Variables:** Sensitive data in .env files
- **Secret Management:** Secure JWT secret generation
- **Database Security:** MongoDB connection with authentication
- **HTTPS Enforcement:** SSL/TLS in production

## 📊 Database Architecture

### Collections Design
```javascript
// Users Collection
{
  _id: ObjectId,
  name: String,
  email: String (unique index),
  password: String (hashed),
  preferences: Object,
  createdAt: Date (index),
  updatedAt: Date
}

// Transactions Collection
{
  _id: ObjectId,
  userId: ObjectId (index, ref: Users),
  type: String (index),
  category: String (index),
  amount: Number,
  date: Date (index),
  description: String,
  createdAt: Date,
  updatedAt: Date
}

// Budgets Collection
{
  _id: ObjectId,
  userId: ObjectId (index, ref: Users),
  month: String (index),
  categories: Array,
  totalBudget: Number,
  totalSpent: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Database Indexing Strategy
- **Users:** email (unique), createdAt
- **Transactions:** userId, type, category, date (compound index)
- **Budgets:** userId, month (compound unique index)

## 🎨 Frontend Architecture

### Component Hierarchy
```
App
├── ThemeProvider
├── AuthProvider
└── Router
    ├── PublicRoutes
    │   ├── Login
    │   └── Register
    └── ProtectedRoutes
        ├── Layout (Navbar + Sidebar)
        ├── Dashboard
        ├── Transactions
        ├── Budgets
        └── Analytics
```

### State Management
- **AuthContext:** User authentication state
- **ThemeContext:** Dark/light mode preferences
- **Local State:** Component-specific state with hooks
- **Form State:** React Hook Form for form management

### Styling Architecture
- **Tailwind CSS:** Utility-first CSS framework
- **Design System:** Consistent colors, typography, spacing
- **Component Variants:** CVA (Class Variance Authority)
- **Theme Variables:** CSS custom properties for theme switching

## 🔧 Development Architecture

### Build Process
```
Development:
├── Backend: nodemon for auto-restart
├── Frontend: Vite for fast development
└── Database: Local MongoDB or Atlas

Production:
├── Backend: Express server on Render/Railway
├── Frontend: Static build on Vercel/Netlify
└── Database: MongoDB Atlas production cluster
```

### Testing Strategy
- **Unit Tests:** Jest for backend, React Testing Library for frontend
- **Integration Tests:** API endpoint testing with Supertest
- **E2E Tests:** Critical user flows (optional with Playwright)

### CI/CD Pipeline
```
GitHub Actions:
├── On Push: Run tests, check code quality
├── On PR: Run full test suite, security scan
└── On Merge: Deploy to production
```

## 📈 Performance Architecture

### Backend Optimization
- **Database Queries:** Proper indexing and aggregation
- **Caching:** Redis for session management (future)
- **Compression:** Gzip compression for responses
- **Rate Limiting:** Prevent API abuse

### Frontend Optimization
- **Code Splitting:** Lazy loading for routes
- **Bundle Optimization:** Tree shaking and minification
- **Image Optimization:** WebP format with fallbacks
- **Caching:** Service worker for static assets (future)

## 🚀 Deployment Architecture

### Environment Configuration
```
Development:
├── Local MongoDB
├── Local Express server (port 5000)
└── Vite dev server (port 3000)

Production:
├── MongoDB Atlas cluster
├── Express API on cloud platform
└── Static frontend on CDN
```

### Monitoring & Logging
- **Error Tracking:** Console logging in development
- **Performance Monitoring:** Basic timing metrics
- **Health Checks:** API endpoint monitoring
- **Analytics:** User interaction tracking (future)

---

## 🔄 Architecture Decisions

### Why MERN Stack?
- **JavaScript Everywhere:** Single language across full stack
- **JSON Communication:** Seamless data flow between layers
- **Rich Ecosystem:** Extensive npm packages and community
- **Scalability:** Horizontal scaling capabilities

### Why Tailwind CSS?
- **Utility-First:** Rapid development with utility classes
- **Consistency:** Design system built into the framework
- **Dark Mode:** First-class support for theme switching
- **Performance:** Purged CSS in production builds

### Why JWT Authentication?
- **Stateless:** No server-side session storage needed
- **Scalable:** Easy to implement across microservices
- **Mobile-Friendly:** Token-based for future mobile app
- **Secure:** Cryptographically signed tokens

---

**This architecture document will evolve as the project grows and new requirements emerge.**

**Author:** Duncan Kamunge ([@KamungeD](https://github.com/KamungeD))
