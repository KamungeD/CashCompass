# CashCompass - API Documentation

**Base URL:** `https://cashcompass-backend-jp53.onrender.com/api/v1`

## 🔐 Authentication
- **Type:** JWT (JSON Web Tokens)
- **Header:** `Authorization: Bearer <token>`
- **Token Expiration:** 30 days

## 📊 Response Format
All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### ❌ Error Format
Error responses include detailed information:

```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ],
  "statusCode": 400
}
```

---

## 🔐 Authentication Endpoints

### Register User
Create a new user account.

**Endpoint:** `POST /auth/register`  
**Authentication:** None required  
**Rate Limit:** 5 requests per 15 minutes  

#### Request Body:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!"
}
```

#### Validation Rules:
- `name`: 2-50 characters, letters and spaces only
- `email`: Valid email format, unique in database
- `password`: Minimum 8 characters, mixed case, numbers, special chars
- `confirmPassword`: Must match password

#### Success Response (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64a7b8c9d12e3f4567890123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "preferences": {
        "currency": "USD",
        "theme": "light",
        "notifications": true
      },
      "createdAt": "2025-07-20T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Account created successfully"
}
```

#### Error Responses:
- `400 Bad Request`: Validation errors
- `409 Conflict`: Email already exists
- `429 Too Many Requests`: Rate limit exceeded

---

### Login User
Authenticate existing user.

**Endpoint:** `POST /auth/login`  
**Authentication:** None required  
**Rate Limit:** 10 requests per 15 minutes  

#### Request Body:
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64a7b8c9d12e3f4567890123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "preferences": {
        "currency": "USD",
        "theme": "light",
        "notifications": true
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

#### Error Responses:
- `400 Bad Request`: Missing credentials
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded

---

### Get Current User
Retrieve current user profile.

**Endpoint:** `GET /auth/me`  
**Authentication:** Required  

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64a7b8c9d12e3f4567890123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "preferences": {
        "currency": "USD",
        "theme": "light",
        "notifications": true
      },
      "createdAt": "2025-07-20T10:30:00.000Z",
      "updatedAt": "2025-07-20T10:30:00.000Z"
    }
  }
}
```

#### Error Responses:
- `401 Unauthorized`: Invalid or expired token

---

### Update User Profile
Update user information and preferences.

**Endpoint:** `PUT /auth/profile`  
**Authentication:** Required  

#### Request Body:
```json
{
  "name": "John Smith",
  "preferences": {
    "currency": "EUR",
    "theme": "dark",
    "notifications": false
  }
}
```

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64a7b8c9d12e3f4567890123",
      "name": "John Smith",
      "email": "john.doe@example.com",
      "preferences": {
        "currency": "EUR",
        "theme": "dark",
        "notifications": false
      },
      "updatedAt": "2025-07-20T11:15:00.000Z"
    }
  },
  "message": "Profile updated successfully"
}
```

---

## 💰 Transaction Endpoints

### Get All Transactions
Retrieve user's transactions with filtering and pagination.

**Endpoint:** `GET /transactions`  
**Authentication:** Required  

#### Query Parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `type` (string): Filter by 'income' or 'expense'
- `category` (string): Filter by category name
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)
- `minAmount` (number): Minimum amount filter
- `maxAmount` (number): Maximum amount filter
- `search` (string): Search in description
- `sortBy` (string): Sort field (date, amount, category)
- `sortOrder` (string): 'asc' or 'desc' (default: 'desc')

#### Example Request:
```
GET /transactions?page=1&limit=10&type=expense&category=Food&startDate=2025-07-01&endDate=2025-07-31&sortBy=date&sortOrder=desc
```

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "64a7b8c9d12e3f4567890124",
        "type": "expense",
        "category": "Food",
        "amount": 25.50,
        "description": "Lunch at cafe",
        "date": "2025-07-20T00:00:00.000Z",
        "paymentMethod": "card",
        "createdAt": "2025-07-20T12:30:00.000Z",
        "updatedAt": "2025-07-20T12:30:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Create Transaction
Add a new transaction.

**Endpoint:** `POST /transactions`  
**Authentication:** Required  

#### Request Body:
```json
{
  "type": "expense",
  "category": "Food",
  "amount": 25.50,
  "description": "Lunch at cafe",
  "date": "2025-07-20",
  "paymentMethod": "card"
}
```

#### Validation Rules:
- `type`: Required, must be 'income' or 'expense'
- `category`: Required, 2-50 characters
- `amount`: Required, positive number, max 2 decimal places
- `description`: Optional, max 200 characters
- `date`: Required, valid date format
- `paymentMethod`: Optional, enum: ['cash', 'card', 'bank', 'digital']

#### Success Response (201):
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "64a7b8c9d12e3f4567890125",
      "type": "expense",
      "category": "Food",
      "amount": 25.50,
      "description": "Lunch at cafe",
      "date": "2025-07-20T00:00:00.000Z",
      "paymentMethod": "card",
      "userId": "64a7b8c9d12e3f4567890123",
      "createdAt": "2025-07-20T12:30:00.000Z",
      "updatedAt": "2025-07-20T12:30:00.000Z"
    }
  },
  "message": "Transaction created successfully"
}
```

---

### Get Single Transaction
Retrieve a specific transaction.

**Endpoint:** `GET /transactions/:id`  
**Authentication:** Required  

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "64a7b8c9d12e3f4567890125",
      "type": "expense",
      "category": "Food",
      "amount": 25.50,
      "description": "Lunch at cafe",
      "date": "2025-07-20T00:00:00.000Z",
      "paymentMethod": "card",
      "createdAt": "2025-07-20T12:30:00.000Z",
      "updatedAt": "2025-07-20T12:30:00.000Z"
    }
  }
}
```

#### Error Responses:
- `404 Not Found`: Transaction doesn't exist or doesn't belong to user

---

### Update Transaction
Modify an existing transaction.

**Endpoint:** `PUT /transactions/:id`  
**Authentication:** Required  

#### Request Body:
```json
{
  "category": "Groceries",
  "amount": 30.75,
  "description": "Weekly groceries"
}
```

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "64a7b8c9d12e3f4567890125",
      "type": "expense",
      "category": "Groceries",
      "amount": 30.75,
      "description": "Weekly groceries",
      "date": "2025-07-20T00:00:00.000Z",
      "paymentMethod": "card",
      "updatedAt": "2025-07-20T13:15:00.000Z"
    }
  },
  "message": "Transaction updated successfully"
}
```

---

### Delete Transaction
Remove a transaction.

**Endpoint:** `DELETE /transactions/:id`  
**Authentication:** Required  

#### Success Response (200):
```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

---

### Get Transaction Summary
Retrieve transaction analytics and summary.

**Endpoint:** `GET /transactions/summary`  
**Authentication:** Required  

#### Query Parameters:
- `month` (string): Specific month (YYYY-MM, default: current month)
- `year` (string): Specific year (YYYY, default: current year)

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": 5000.00,
      "totalExpenses": 3500.00,
      "netAmount": 1500.00,
      "transactionCount": 45,
      "categorySummary": [
        {
          "category": "Food",
          "totalAmount": 850.00,
          "count": 12,
          "percentage": 24.3
        }
      ],
      "monthlyTrend": [
        {
          "month": "2025-07",
          "income": 5000.00,
          "expenses": 3500.00
        }
      ]
    }
  }
}
```

---

## 📊 Budget Endpoints

### Get All Budgets
Retrieve user's budgets.

**Endpoint:** `GET /budgets`  
**Authentication:** Required  

#### Query Parameters:
- `year` (string): Filter by year (YYYY)
- `month` (string): Filter by month (YYYY-MM)
- `active` (boolean): Filter by active status

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "budgets": [
      {
        "id": "64a7b8c9d12e3f4567890126",
        "month": "2025-07",
        "categories": [
          {
            "name": "Food",
            "limit": 800.00,
            "spent": 650.00,
            "alertThreshold": 80,
            "remaining": 150.00,
            "percentageUsed": 81.25
          }
        ],
        "totalBudget": 4000.00,
        "totalSpent": 3200.00,
        "isActive": true,
        "createdAt": "2025-07-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### Create Budget
Create a new monthly budget.

**Endpoint:** `POST /budgets`  
**Authentication:** Required  

#### Request Body:
```json
{
  "month": "2025-08",
  "categories": [
    {
      "name": "Food",
      "limit": 800.00,
      "alertThreshold": 80
    },
    {
      "name": "Transport",
      "limit": 300.00,
      "alertThreshold": 75
    }
  ]
}
```

#### Validation Rules:
- `month`: Required, format YYYY-MM, cannot be past month
- `categories`: Required array, minimum 1 category
- `categories[].name`: Required, 2-50 characters
- `categories[].limit`: Required, positive number
- `categories[].alertThreshold`: Optional, 1-100 (default: 80)

#### Success Response (201):
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "64a7b8c9d12e3f4567890127",
      "month": "2025-08",
      "categories": [
        {
          "name": "Food",
          "limit": 800.00,
          "spent": 0.00,
          "alertThreshold": 80,
          "remaining": 800.00,
          "percentageUsed": 0
        }
      ],
      "totalBudget": 1100.00,
      "totalSpent": 0.00,
      "isActive": true,
      "createdAt": "2025-07-20T14:00:00.000Z"
    }
  },
  "message": "Budget created successfully"
}
```

---

### Get Current Budget
Retrieve current month's budget.

**Endpoint:** `GET /budgets/current`  
**Authentication:** Required  

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "64a7b8c9d12e3f4567890126",
      "month": "2025-07",
      "categories": [
        {
          "name": "Food",
          "limit": 800.00,
          "spent": 650.00,
          "alertThreshold": 80,
          "remaining": 150.00,
          "percentageUsed": 81.25,
          "status": "warning"
        }
      ],
      "totalBudget": 4000.00,
      "totalSpent": 3200.00,
      "totalRemaining": 800.00,
      "percentageUsed": 80.00,
      "daysRemaining": 11,
      "projectedSpending": 4200.00,
      "isActive": true
    }
  }
}
```

---

### Update Budget
Modify an existing budget.

**Endpoint:** `PUT /budgets/:id`  
**Authentication:** Required  

#### Request Body:
```json
{
  "categories": [
    {
      "name": "Food",
      "limit": 900.00,
      "alertThreshold": 85
    }
  ]
}
```

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "64a7b8c9d12e3f4567890126",
      "month": "2025-07",
      "categories": [
        {
          "name": "Food",
          "limit": 900.00,
          "spent": 650.00,
          "alertThreshold": 85,
          "remaining": 250.00,
          "percentageUsed": 72.22
        }
      ],
      "totalBudget": 4100.00,
      "totalSpent": 3200.00,
      "updatedAt": "2025-07-20T14:30:00.000Z"
    }
  },
  "message": "Budget updated successfully"
}
```

---

### Delete Budget
Remove a budget (only if no transactions exist for that month).

**Endpoint:** `DELETE /budgets/:id`  
**Authentication:** Required  

#### Success Response (200):
```json
{
  "success": true,
  "message": "Budget deleted successfully"
}
```

#### Error Responses:
- `400 Bad Request`: Cannot delete budget with existing transactions

---

## 🏷️ Category Endpoints

### Get All Categories
Retrieve default and user custom categories.

**Endpoint:** `GET /categories`  
**Authentication:** Required  

#### Query Parameters:
- `type` (string): Filter by 'income' or 'expense'
- `custom` (boolean): Filter by custom categories only

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "64a7b8c9d12e3f4567890128",
        "name": "Food",
        "type": "expense",
        "icon": "utensils",
        "color": "#f59e0b",
        "isDefault": true,
        "usageCount": 25
      },
      {
        "id": "64a7b8c9d12e3f4567890129",
        "name": "Freelance Work",
        "type": "income",
        "icon": "briefcase",
        "color": "#10b981",
        "isDefault": false,
        "usageCount": 8
      }
    ]
  }
}
```

---

### Create Custom Category
Add a new custom category.

**Endpoint:** `POST /categories`  
**Authentication:** Required  

#### Request Body:
```json
{
  "name": "Pet Expenses",
  "type": "expense",
  "icon": "heart",
  "color": "#8b5cf6"
}
```

#### Success Response (201):
```json
{
  "success": true,
  "data": {
    "category": {
      "id": "64a7b8c9d12e3f4567890130",
      "name": "Pet Expenses",
      "type": "expense",
      "icon": "heart",
      "color": "#8b5cf6",
      "isDefault": false,
      "userId": "64a7b8c9d12e3f4567890123",
      "createdAt": "2025-07-20T15:00:00.000Z"
    }
  },
  "message": "Category created successfully"
}
```

---

## 📈 Analytics Endpoints

### Get Spending Trends
Retrieve spending trends over time.

**Endpoint:** `GET /analytics/spending-trends`  
**Authentication:** Required  

#### Query Parameters:
- `period` (string): 'month', 'quarter', 'year' (default: 'month')
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "period": "2025-07",
        "totalIncome": 5000.00,
        "totalExpenses": 3500.00,
        "netAmount": 1500.00,
        "transactionCount": 45,
        "averageDailySpending": 112.90
      }
    ],
    "summary": {
      "averageMonthlyIncome": 4800.00,
      "averageMonthlyExpenses": 3600.00,
      "trendDirection": "increasing",
      "changePercentage": 5.2
    }
  }
}
```

---

### Get Category Breakdown
Analyze spending by category.

**Endpoint:** `GET /analytics/category-breakdown`  
**Authentication:** Required  

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "breakdown": [
      {
        "category": "Food",
        "totalAmount": 850.00,
        "percentage": 24.3,
        "transactionCount": 12,
        "averageAmount": 70.83,
        "trend": "increasing"
      }
    ],
    "topCategories": [
      {
        "category": "Food",
        "amount": 850.00
      }
    ]
  }
}
```

---

### Get Income vs Expense Analysis
Compare income and expenses over time.

**Endpoint:** `GET /analytics/income-vs-expense`  
**Authentication:** Required  

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "comparison": [
      {
        "period": "2025-07",
        "income": 5000.00,
        "expenses": 3500.00,
        "savings": 1500.00,
        "savingsRate": 30.0
      }
    ],
    "summary": {
      "totalIncome": 25000.00,
      "totalExpenses": 18000.00,
      "totalSavings": 7000.00,
      "averageSavingsRate": 28.0,
      "bestMonth": "2025-05",
      "worstMonth": "2025-03"
    }
  }
}
```

---

### Get Budget Performance
Analyze budget vs actual spending.

**Endpoint:** `GET /analytics/budget-performance`  
**Authentication:** Required  

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "performance": [
      {
        "month": "2025-07",
        "budgeted": 4000.00,
        "actual": 3500.00,
        "variance": -500.00,
        "variancePercentage": -12.5,
        "status": "under_budget"
      }
    ],
    "summary": {
      "averageVariance": -8.3,
      "monthsOverBudget": 2,
      "monthsUnderBudget": 4,
      "bestPerformance": "2025-06",
      "worstPerformance": "2025-04"
    }
  }
}
```

---

## 📋 Error Codes Reference

### HTTP Status Codes
- `200 OK`: Successful GET, PUT, DELETE requests
- `201 Created`: Successful POST requests
- `400 Bad Request`: Invalid request data or validation errors
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: User doesn't have permission for this resource
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: Resource already exists (duplicate email, budget)
- `422 Unprocessable Entity`: Valid JSON but semantic errors
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side error

### Custom Error Codes
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Account not found
- `VALID_001`: Required field missing
- `VALID_002`: Invalid data format
- `VALID_003`: Value out of range
- `BUDGET_001`: Budget already exists for month
- `BUDGET_002`: Cannot delete budget with transactions
- `TRANS_001`: Transaction not found
- `TRANS_002`: Insufficient permissions

---

## 🔒 Security Considerations

### Rate Limiting
- **Authentication endpoints:** 5-10 requests per 15 minutes
- **General API endpoints:** 100 requests per 15 minutes
- **Analytics endpoints:** 50 requests per 15 minutes

### Data Validation
- All input data validated on server-side
- SQL injection prevention with parameterized queries
- XSS protection with input sanitization
- CSRF protection with SameSite cookies

### Password Security
- Minimum 8 characters with complexity requirements
- bcrypt hashing with salt rounds ≥ 12
- Password reset tokens expire in 1 hour
- Account lockout after 5 failed attempts

---

## 📊 Pagination

All list endpoints support pagination with consistent parameters:

### Request Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

### Response Format:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔄 Versioning

API versioning is handled through the URL path:
- Current version: `/api/v1/`
- Future versions: `/api/v2/`, `/api/v3/`, etc.

### Backwards Compatibility
- Previous versions supported for 12 months
- Breaking changes only in major versions
- Deprecation notices provided 3 months in advance

---

## 📞 Support

### Documentation Updates
This API documentation is automatically updated with each release.

### Rate Limits
Current rate limits are designed for typical usage patterns. Contact support for higher limits if needed.

### Error Reporting
Report API issues with:
- Request/response details
- Timestamp
- User ID (if applicable)
- Steps to reproduce

---

**This API documentation serves as the definitive guide for CashCompass backend integration.**

**Author:** Duncan Kamunge ([@KamungeD](https://github.com/KamungeD))
