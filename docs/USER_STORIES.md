# CashCompass - User Stories & Acceptance Criteria

**Author:** Duncan Kamunge ([@KamungeD](https://github.com/KamungeD))  
**Project:** Personal Finance Management Application  
**Last Updated:** July 2025  

---

## 📋 Epic Overview

This document outlines the complete user journey for CashCompass, organized into four main epics. Each epic contains detailed user stories with specific acceptance criteria that will guide development and testing.

---

## 🔐 Epic 1: User Management & Authentication

### User Story 1.1: User Registration
**As a** new user  
**I want to** create an account with my email and password  
**So that** I can start tracking my finances securely  

#### Acceptance Criteria:
- [ ] User can access registration form from landing page
- [ ] Registration requires: name (2-50 chars), valid email, strong password
- [ ] Password must be at least 8 characters with mixed case and numbers
- [ ] Email validation prevents duplicate accounts
- [ ] Successful registration redirects to dashboard
- [ ] User receives welcome message after registration
- [ ] Form shows appropriate error messages for invalid inputs

#### Technical Requirements:
- Email validation regex pattern
- Password hashing with bcrypt (salt rounds ≥ 12)
- JWT token generation on successful registration
- Responsive form design with Tailwind CSS

#### Test Scenarios:
- ✅ Valid registration with all required fields
- ❌ Registration with existing email address
- ❌ Registration with weak password
- ❌ Registration with invalid email format
- ❌ Registration with missing required fields

---

### User Story 1.2: User Login
**As a** returning user  
**I want to** log in with my email and password  
**So that** I can access my financial data  

#### Acceptance Criteria:
- [ ] User can access login form from landing page
- [ ] Login requires valid email and password combination
- [ ] Successful login redirects to dashboard
- [ ] Failed login shows clear error message
- [ ] JWT token stored securely for session management
- [ ] "Remember me" option for extended sessions
- [ ] Form accessible via keyboard navigation

#### Technical Requirements:
- Secure password comparison with bcrypt
- JWT token with 30-day expiration
- Rate limiting (5 attempts per 15 minutes)
- HTTPS enforcement in production

#### Test Scenarios:
- ✅ Successful login with valid credentials
- ❌ Login with incorrect password
- ❌ Login with non-existent email
- ❌ Login with empty fields
- ❌ Exceeding rate limit triggers lockout

---

### User Story 1.3: Profile Management
**As a** logged-in user  
**I want to** view and update my profile information  
**So that** I can keep my account details current  

#### Acceptance Criteria:
- [ ] User can view current profile information
- [ ] User can update name and email address
- [ ] User can change password with current password verification
- [ ] User can set preferences (currency, theme, notifications)
- [ ] Changes saved immediately with confirmation message
- [ ] Email change requires verification
- [ ] Profile picture upload (future enhancement)

#### Technical Requirements:
- Form validation for profile updates
- Secure password change workflow
- Email verification for address changes
- Preference storage in user document

#### Test Scenarios:
- ✅ Update name successfully
- ✅ Change password with correct current password
- ❌ Change password with incorrect current password
- ❌ Update email to existing address
- ✅ Update user preferences

---

### User Story 1.4: Secure Logout
**As a** logged-in user  
**I want to** securely log out of my account  
**So that** my financial data remains protected  

#### Acceptance Criteria:
- [ ] Logout button accessible from all protected pages
- [ ] Logout clears authentication token
- [ ] Logout redirects to landing page
- [ ] No access to protected routes after logout
- [ ] Confirmation message for successful logout

#### Technical Requirements:
- Token invalidation on logout
- Clear localStorage/sessionStorage
- Redirect unauthorized requests to login

#### Test Scenarios:
- ✅ Successful logout from any page
- ✅ Cannot access protected routes after logout
- ✅ Token cleared from storage

---

## 💰 Epic 2: Transaction Management

### User Story 2.1: Add Transaction
**As a** user  
**I want to** add income and expense transactions  
**So that** I can track all my financial activities  

#### Acceptance Criteria:
- [ ] Quick-access "Add Transaction" button on dashboard
- [ ] Form supports both income and expense types
- [ ] Required fields: type, amount, category, date
- [ ] Optional fields: description, payment method
- [ ] Amount validation (positive numbers only)
- [ ] Category selection from predefined and custom options
- [ ] Date picker with default to today
- [ ] Form submission saves to database and updates UI

#### Technical Requirements:
- React Hook Form with Yup validation
- Real-time form validation with error messages
- Optimistic UI updates
- Category dropdown with search functionality

#### Test Scenarios:
- ✅ Add valid expense transaction
- ✅ Add valid income transaction
- ❌ Submit transaction with negative amount
- ❌ Submit transaction without required fields
- ✅ Add transaction with optional description

---

### User Story 2.2: View Transaction List
**As a** user  
**I want to** view all my transactions in an organized list  
**So that** I can review my financial history  

#### Acceptance Criteria:
- [ ] Transactions displayed in reverse chronological order
- [ ] Each transaction shows: date, type, category, amount, description
- [ ] Visual distinction between income (green) and expenses (red)
- [ ] Pagination for large transaction lists (20 per page)
- [ ] Loading states during data fetch
- [ ] Empty state message when no transactions exist
- [ ] Responsive design for mobile viewing

#### Technical Requirements:
- Efficient pagination with MongoDB skip/limit
- Loading skeletons with Tailwind animations
- Responsive grid layout
- Color coding with theme support

#### Test Scenarios:
- ✅ Display transactions with proper formatting
- ✅ Pagination works correctly
- ✅ Empty state shows when no transactions
- ✅ Responsive layout on mobile devices

---

### User Story 2.3: Edit Transaction
**As a** user  
**I want to** edit existing transactions  
**So that** I can correct mistakes or update information  

#### Acceptance Criteria:
- [ ] Edit button accessible from transaction list
- [ ] Pre-populated form with current transaction data
- [ ] Same validation rules as adding transactions
- [ ] Changes saved immediately upon submission
- [ ] Cancel option returns to transaction list
- [ ] Confirmation message for successful updates
- [ ] Optimistic UI updates

#### Technical Requirements:
- Form pre-population with existing data
- PUT request to update endpoint
- Optimistic updates with rollback on error
- Proper error handling and user feedback

#### Test Scenarios:
- ✅ Successfully edit transaction amount
- ✅ Successfully change transaction category
- ✅ Cancel edit returns to list unchanged
- ❌ Edit with invalid data shows errors
- ✅ Optimistic update works correctly

---

### User Story 2.4: Delete Transaction
**As a** user  
**I want to** delete transactions I no longer need  
**So that** I can keep my financial records accurate  

#### Acceptance Criteria:
- [ ] Delete button accessible from transaction list
- [ ] Confirmation dialog before deletion
- [ ] Immediate removal from UI after confirmation
- [ ] Undo option within 5 seconds (future enhancement)
- [ ] Success message after deletion
- [ ] Budget calculations update automatically

#### Technical Requirements:
- Confirmation modal with Tailwind styling
- DELETE request to API endpoint
- Optimistic UI removal
- Real-time budget recalculation

#### Test Scenarios:
- ✅ Successfully delete transaction with confirmation
- ✅ Cancel deletion keeps transaction
- ✅ Budget updates after deletion
- ✅ UI updates immediately

---

### User Story 2.5: Search & Filter Transactions
**As a** user  
**I want to** search and filter my transactions  
**So that** I can quickly find specific financial records  

#### Acceptance Criteria:
- [ ] Search bar filters by description and category
- [ ] Filter by transaction type (income/expense)
- [ ] Filter by date range (from/to dates)
- [ ] Filter by amount range (min/max)
- [ ] Filter by category
- [ ] Multiple filters can be applied simultaneously
- [ ] Clear filters option resets all filters
- [ ] Search results update in real-time

#### Technical Requirements:
- Debounced search input (300ms delay)
- MongoDB aggregation for complex filtering
- URL state for shareable filtered views
- Responsive filter panel

#### Test Scenarios:
- ✅ Search by description finds correct transactions
- ✅ Date range filter works accurately
- ✅ Category filter shows only matching transactions
- ✅ Multiple filters work together
- ✅ Clear filters resets to all transactions

---

## 📊 Epic 3: Budget Management

### User Story 3.1: Create Monthly Budget
**As a** user  
**I want to** set monthly budget limits for different categories  
**So that** I can control my spending  

#### Acceptance Criteria:
- [ ] Create budget for current or future months
- [ ] Set budget limits for each expense category
- [ ] Total budget calculation automatically updates
- [ ] Budget limits must be positive numbers
- [ ] Category-wise budget allocation
- [ ] Default alert threshold at 80% of limit
- [ ] Save button creates budget in database

#### Technical Requirements:
- Dynamic form with add/remove category functionality
- Real-time budget total calculation
- Form validation for positive numbers
- MongoDB budget document creation

#### Test Scenarios:
- ✅ Create budget with multiple categories
- ✅ Total budget calculates correctly
- ❌ Create budget with negative limits
- ✅ Save budget successfully
- ❌ Create duplicate budget for same month

---

### User Story 3.2: Track Budget Progress
**As a** user  
**I want to** see how much I've spent against my budget  
**So that** I can stay within my limits  

#### Acceptance Criteria:
- [ ] Visual progress bars for each budget category
- [ ] Percentage and amount spent vs. limit
- [ ] Color coding: green (under budget), yellow (approaching), red (over)
- [ ] Real-time updates when transactions are added
- [ ] Total budget overview at the top
- [ ] Days remaining in current month
- [ ] Projected spending based on current rate

#### Technical Requirements:
- MongoDB aggregation for spent calculations
- Real-time budget updates via WebSocket (future)
- Progress bar components with Tailwind
- Color-coded status indicators

#### Test Scenarios:
- ✅ Progress bars show correct percentages
- ✅ Colors change based on spending levels
- ✅ Real-time updates when adding transactions
- ✅ Projected spending calculates accurately
- ✅ Total budget overview is correct

---

### User Story 3.3: Budget Alerts
**As a** user  
**I want to** receive alerts when approaching budget limits  
**So that** I can adjust my spending behavior  

#### Acceptance Criteria:
- [ ] Alert at 80% of category budget by default
- [ ] Customizable alert thresholds per category
- [ ] Visual alerts in dashboard and budget pages
- [ ] Alert notifications don't repeat within 24 hours
- [ ] Dismiss option for alerts
- [ ] Email notifications (future enhancement)
- [ ] Push notifications (future enhancement)

#### Technical Requirements:
- Alert calculation during transaction creation
- In-app notification system
- Toast notifications with react-toastify
- Alert state management in context

#### Test Scenarios:
- ✅ Alert triggers at 80% threshold
- ✅ Custom threshold works correctly
- ✅ Alerts don't repeat within 24 hours
- ✅ Dismiss alert removes from view
- ✅ Multiple category alerts display correctly

---

### User Story 3.4: Budget History
**As a** user  
**I want to** view my past budget performance  
**So that** I can learn from my spending patterns  

#### Acceptance Criteria:
- [ ] List of previous months' budgets
- [ ] Performance summary (over/under budget)
- [ ] Category-wise performance comparison
- [ ] Ability to copy previous budget to new month
- [ ] Export budget reports (future enhancement)
- [ ] Year-over-year comparisons (future enhancement)

#### Technical Requirements:
- Historical budget query with MongoDB
- Budget performance calculations
- Copy budget functionality
- Export to CSV/PDF (future)

#### Test Scenarios:
- ✅ Display previous budgets correctly
- ✅ Performance summary is accurate
- ✅ Copy budget to new month works
- ✅ Category comparisons are correct
- ✅ Historical data loads efficiently

---

## 📈 Epic 4: Analytics & Insights

### User Story 4.1: Spending Overview Charts
**As a** user  
**I want to** see visual charts of my spending patterns  
**So that** I can understand my financial habits  

#### Acceptance Criteria:
- [ ] Pie chart showing spending by category
- [ ] Bar chart comparing monthly spending
- [ ] Line chart showing spending trends over time
- [ ] Charts support dark/light theme
- [ ] Interactive tooltips with detailed information
- [ ] Date range selector for chart data
- [ ] Responsive design for mobile viewing

#### Technical Requirements:
- Chart.js or Recharts integration
- Theme-aware chart colors
- Responsive chart configurations
- MongoDB aggregation for chart data

#### Test Scenarios:
- ✅ Pie chart displays correct category breakdown
- ✅ Charts adapt to dark/light theme
- ✅ Interactive tooltips show accurate data
- ✅ Date range filtering works correctly
- ✅ Charts are responsive on mobile

---

### User Story 4.2: Financial Trends Analysis
**As a** user  
**I want to** view monthly and yearly financial trends  
**So that** I can track my financial progress  

#### Acceptance Criteria:
- [ ] Income vs. expense comparison charts
- [ ] Monthly savings rate calculation
- [ ] Year-over-year growth analysis
- [ ] Spending category trends
- [ ] Net worth tracking (future enhancement)
- [ ] Financial goal progress (future enhancement)

#### Technical Requirements:
- Complex MongoDB aggregation pipelines
- Trend calculation algorithms
- Multi-axis chart configurations
- Data caching for performance

#### Test Scenarios:
- ✅ Income vs expense trends are accurate
- ✅ Savings rate calculates correctly
- ✅ Year-over-year comparisons work
- ✅ Category trends show properly
- ✅ Data loads efficiently

---

### User Story 4.3: Financial Reports
**As a** user  
**I want to** generate and export financial reports  
**So that** I can share or archive my financial data  

#### Acceptance Criteria:
- [ ] Monthly financial summary report
- [ ] Category-wise spending report
- [ ] Budget vs. actual spending report
- [ ] Custom date range reports
- [ ] Export to PDF format
- [ ] Export to CSV format
- [ ] Email reports (future enhancement)

#### Technical Requirements:
- Report generation with proper formatting
- PDF export library integration
- CSV data export functionality
- Email service integration (future)

#### Test Scenarios:
- ✅ Monthly reports generate correctly
- ✅ Custom date ranges work properly
- ✅ PDF export formats correctly
- ✅ CSV export includes all data
- ✅ Reports reflect accurate calculations

---

### User Story 4.4: Financial Insights
**As a** user  
**I want to** receive personalized financial insights  
**So that** I can improve my financial management  

#### Acceptance Criteria:
- [ ] Spending pattern analysis
- [ ] Unusual transaction detection
- [ ] Budget optimization suggestions
- [ ] Savings opportunities identification
- [ ] Spending category recommendations
- [ ] Monthly financial health score

#### Technical Requirements:
- Machine learning algorithms (future)
- Pattern recognition logic
- Insight generation algorithms
- Personalized recommendation engine

#### Test Scenarios:
- ✅ Insights are relevant and accurate
- ✅ Unusual transactions are detected
- ✅ Suggestions are actionable
- ✅ Health score reflects actual financial state
- ✅ Recommendations update with new data

---

## 🎯 Definition of Done

For each user story to be considered complete, it must meet the following criteria:

### Development Criteria:
- [ ] **Functionality:** Feature works as described in acceptance criteria
- [ ] **Code Quality:** Code follows project standards and best practices
- [ ] **Testing:** Unit tests written with ≥80% coverage
- [ ] **Documentation:** Code is self-documenting with necessary comments
- [ ] **Responsive:** Works on mobile, tablet, and desktop devices

### Design Criteria:
- [ ] **Accessibility:** WCAG 2.1 AA compliance
- [ ] **Theme Support:** Works in both light and dark modes
- [ ] **User Experience:** Intuitive and user-friendly interface
- [ ] **Error Handling:** Graceful error handling with user feedback
- [ ] **Loading States:** Appropriate loading indicators

### Technical Criteria:
- [ ] **Performance:** Meets performance requirements (< 2s response)
- [ ] **Security:** Follows security best practices
- [ ] **Integration:** Properly integrated with backend API
- [ ] **Browser Support:** Works in all supported browsers
- [ ] **Mobile First:** Responsive design starting with mobile

### Review Criteria:
- [ ] **Peer Review:** Code reviewed by another developer
- [ ] **Manual Testing:** Feature manually tested by reviewer
- [ ] **User Acceptance:** Meets user story acceptance criteria
- [ ] **Documentation Updated:** Relevant documentation updated
- [ ] **Demo Ready:** Feature ready for stakeholder demonstration

---

## 📝 User Story Prioritization

### Phase 1 (MVP - Weeks 1-2):
1. User Registration & Login (1.1, 1.2)
2. Add & View Transactions (2.1, 2.2)
3. Basic Budget Creation (3.1)
4. Simple Dashboard with Charts (4.1)

### Phase 2 (Enhanced Features - Week 3):
1. Edit & Delete Transactions (2.3, 2.4)
2. Budget Tracking & Alerts (3.2, 3.3)
3. Search & Filter (2.5)
4. Profile Management (1.3)

### Phase 3 (Advanced Features - Week 4):
1. Financial Trends (4.2)
2. Budget History (3.4)
3. Reports & Export (4.3)
4. Financial Insights (4.4)

---

**This user story document serves as the definitive guide for feature development and will be updated as requirements evolve.**

**Author:** Duncan Kamunge ([@KamungeD](https://github.com/KamungeD))
