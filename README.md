
# Financial Wellness & Tax AI Agent

## Overview

A secure, AI-powered financial wellness assistant that helps employees understand their payslip, deductions, and tax-saving opportunities using document-grounded explanations. This system reduces operational load on Payroll, HR, and Finance teams by providing instant, personalized responses while maintaining strict user-level privacy for sensitive financial information.

## Features

- Authentication - JWT-based authentication with role-based access control
- Payslip Processing - Upload PDF or images, extract data using AI vision
- AI-Powered Q&A - Ask natural language questions with grounded responses
- Tax Simulation - See impact of additional investments on tax liability
- Investment Checklist - Personalized proof submission checklist
- YTD Summary - Year-to-date salary and tax summary
- Trend Analysis - Salary comparison across months
- Salary Breakdown - Detailed view of earnings and deductions
- Data Privacy - User-level data isolation and audit logging

## Technology Stack

- Backend: Node.js, Express.js, TypeScript
- AI: LLM Wrapper API (Gemini/Claude models)
- Frontend: HTML, CSS, JavaScript (Vanilla)
- Security: JWT, Role-Based Access Control
- Testing: Jest

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Internet connection (for LLM API access)

## Installation

1. Clone the repository:
```bash
git clone git@github.com:mohin-sheikh/ai-financial-assistant.git
cd ai-financial-assistant.git
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file:
```bash
cp .env.example .env
```

4. Update .env with your LLM API token:
```env
LLM_API_TOKEN=your_api_token_here
```

5. Build the project:
```bash
npm run build
```

6. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

7. Open http://localhost:3000 in your browser

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee 1 | john.doe@company.com | demo123 |
| Employee 2 | jane.smith@company.com | demo123 |
| Admin | admin@company.com | admin123 |

## API Documentation

### Authentication APIs

#### Login - Employee
- **Method:** POST
- **Endpoint:** `/api/auth/login`
- **Description:** Authenticate employee user and get JWT token
- **Request Body:**
```json
{
  "email": "john.doe@company.com",
  "password": "demo123"
}
```
- **Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "role": "employee"
  }
}
```

#### Login - Admin
- **Method:** POST
- **Endpoint:** `/api/auth/login`
- **Description:** Authenticate admin user with full access
- **Request Body:**
```json
{
  "email": "admin@company.com",
  "password": "admin123"
}
```

#### Logout
- **Method:** POST
- **Endpoint:** `/api/auth/logout`
- **Description:** Logout current user session
- **Headers:** Authorization: Bearer {token}

### Payslip Management APIs

#### Upload Payslip
- **Method:** POST
- **Endpoint:** `/api/payslip/upload`
- **Description:** Upload and process payslip (PDF or image)
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
```json
{
  "userId": "user-123",
  "fileBase64": "base64_encoded_file",
  "fileName": "payslip_june_2026.pdf",
  "mimeType": "application/pdf"
}
```
- **Response:**
```json
{
  "message": "Payslip uploaded and processed successfully",
  "document": {
    "id": "doc-123",
    "fileName": "payslip_june_2026.pdf",
    "processed": true,
    "extractedData": {
      "basicSalary": 52000,
      "hra": 20800,
      "pf": 6240,
      "netPay": 73760
    }
  }
}
```

#### Get All Payroll Records
- **Method:** GET
- **Endpoint:** `/api/payslip/records`
- **Description:** Get all payroll records for authenticated user
- **Headers:** Authorization: Bearer {token}
- **Response:**
```json
{
  "records": [
    {
      "id": "rec-1",
      "month": "January",
      "year": 2026,
      "grossPay": 84500,
      "netPay": 72000,
      "basicSalary": 50000,
      "hra": 20000,
      "tds": 5800,
      "pf": 6000
    }
  ]
}
```

#### Get Specific Payroll Record
- **Method:** GET
- **Endpoint:** `/api/payslip/records/{recordId}`
- **Description:** Get detailed breakdown of a specific payroll record
- **Headers:** Authorization: Bearer {token}
- **Response:**
```json
{
  "record": {
    "id": "rec-1",
    "month": "June",
    "year": 2026,
    "grossPay": 86900,
    "netPay": 73760
  },
  "breakdown": {
    "earnings": {
      "basicSalary": { "amount": 52000, "label": "Basic Salary" },
      "hra": { "amount": 20800, "label": "House Rent Allowance" }
    },
    "deductions": {
      "pf": { "amount": 6240, "label": "Provident Fund" },
      "tds": { "amount": 6200, "label": "Income Tax (TDS)" }
    },
    "summary": {
      "grossPay": 86900,
      "totalDeductions": 13140,
      "netPay": 73760
    }
  }
}
```

#### Compare Two Months
- **Method:** POST
- **Endpoint:** `/api/payslip/compare`
- **Description:** Compare payroll between two months
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
```json
{
  "month1": "January",
  "year1": 2026,
  "month2": "June",
  "year2": 2026
}
```
- **Response:**
```json
{
  "record1": { "month": "January", "year": 2026, "netPay": 72000 },
  "record2": { "month": "June", "year": 2026, "netPay": 73760 },
  "differences": {
    "basicSalary": {
      "current": 52000,
      "previous": 50000,
      "difference": 2000,
      "percentage": 4
    },
    "hra": {
      "current": 20800,
      "previous": 20000,
      "difference": 800,
      "percentage": 4
    }
  }
}
```

#### Get YTD Summary
- **Method:** GET
- **Endpoint:** `/api/payslip/ytd`
- **Description:** Get Year-to-Date summary
- **Headers:** Authorization: Bearer {token}
- **Response:**
```json
{
  "totalRecords": 6,
  "yearToDate": {
    "gross": 520000,
    "net": 440000,
    "taxPaid": 36000,
    "pf": 38000
  },
  "averageMonthly": {
    "gross": 86666.67,
    "net": 73333.33,
    "tax": 6000
  },
  "latestMonth": {
    "month": "June",
    "year": 2026,
    "gross": 86900,
    "net": 73760,
    "tax": 6200
  }
}
```

#### Get Trend Analysis
- **Method:** GET
- **Endpoint:** `/api/payslip/trends`
- **Description:** Get salary trends across months
- **Headers:** Authorization: Bearer {token}
- **Response:**
```json
{
  "period": "January 2026 to June 2026",
  "grossPay": {
    "start": 84500,
    "end": 86900,
    "change": 2400,
    "percentageChange": 2.84
  },
  "netPay": {
    "start": 72000,
    "end": 73760,
    "change": 1760,
    "percentageChange": 2.44
  },
  "monthlyData": [
    { "month": "January", "year": 2026, "grossPay": 84500, "netPay": 72000 },
    { "month": "February", "year": 2026, "grossPay": 85200, "netPay": 72600 }
  ]
}
```

### AI Query APIs

#### Ask General Question
- **Method:** POST
- **Endpoint:** `/api/query/ask`
- **Description:** Ask AI question about your payroll
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
```json
{
  "question": "Why is my net salary lower this month?"
}
```
- **Response:**
```json
{
  "question": "Why is my net salary lower this month?",
  "response": "Your net salary decreased by ₹2,500 this month. This was due to an increase in TDS deduction from ₹5,800 to ₹6,200, while your gross pay remained similar at ₹86,900. The higher tax deduction was likely due to reaching a higher tax bracket based on your year-to-date earnings.",
  "grounded": true,
  "dataUsed": {
    "recordsCount": 6,
    "hasLatestRecord": true
  }
}
```

#### Ask About HRA
- **Method:** POST
- **Endpoint:** `/api/query/ask`
- **Description:** Get detailed HRA breakdown
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
```json
{
  "question": "How much HRA did I receive and what is the exemption?"
}
```
- **Response:**
```json
{
  "question": "How much HRA did I receive and what is the exemption?",
  "response": "Latest Month (June 2026)\nHRA Received: ₹19,553\nHRA Exemption (tax-free): ₹9,777\n\nMonth-by-Month Summary:\nJune 2026: ₹19,553\nMay 2026: ₹19,740\nApril 2026: ₹20,649\nTotal YTD: ₹1,21,493",
  "grounded": true,
  "dataUsed": {
    "recordsCount": 6,
    "hasLatestRecord": true
  }
}
```

#### Ask About Tax
- **Method:** POST
- **Endpoint:** `/api/query/ask`
- **Description:** Get tax summary and recommendations
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
```json
{
  "question": "What is my total tax for the year and how can I save more?"
}
```

#### Ask About Deductions
- **Method:** POST
- **Endpoint:** `/api/query/ask`
- **Description:** Get breakdown of all deductions
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
```json
{
  "question": "What deductions were applied this month?"
}
```

#### Ask About PF
- **Method:** POST
- **Endpoint:** `/api/query/ask`
- **Description:** Get PF explanation and contribution details
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
```json
{
  "question": "Explain PF to me and how much has been contributed?"
}
```

#### Explain Salary Component
- **Method:** POST
- **Endpoint:** `/api/query/explain`
- **Description:** Get detailed explanation of a salary component
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
```json
{
  "component": "specialAllowance"
}
```
- **Response:**
```json
{
  "component": "specialAllowance",
  "value": 10500,
  "explanation": "Special Allowance is a flexible component of your salary paid to compensate for specific job requirements. In your case, you received ₹10,500 in June 2026. This is fully taxable and included in your gross income. It is often used to adjust total compensation without affecting other allowances."
}
```

#### Get FAQs
- **Method:** GET
- **Endpoint:** `/api/query/faqs`
- **Description:** Get frequently asked questions
- **Headers:** Authorization: Bearer {token}
- **Response:**
```json
{
  "faqs": [
    {
      "question": "Why is my net salary lower this month?",
      "answer": "Check your TDS, PF, or other deductions. Compare with previous months."
    }
  ]
}
```

### Tax Service APIs

#### Get Tax Summary
- **Method:** GET
- **Endpoint:** `/api/tax/summary`
- **Description:** Get complete tax summary
- **Headers:** Authorization: Bearer {token}
- **Response:**
```json
{
  "annualIncome": 520000,
  "totalDeductions": 185000,
  "taxableIncome": 285000,
  "taxLiability": 1750,
  "cess": 70,
  "totalTax": 1820,
  "effectiveTaxRate": 0.35,
  "monthlyTax": 151.67,
  "inHandSalary": 43181.67
}
```

#### Simulate Tax Savings - 50K
- **Method:** POST
- **Endpoint:** `/api/tax/simulate`
- **Description:** Simulate tax savings with ₹50,000 additional investment
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
```json
{
  "additionalInvestment": 50000,
  "section": "sec80C"
}
```
- **Response:**
```json
{
  "result": {
    "currentTax": 1820,
    "proposedTax": 1450,
    "taxSavings": 370,
    "monthlySavings": 30.83,
    "additionalInvestment": 50000,
    "roi": "0.74%"
  },
  "explanation": "By investing additional ₹50,000 in Section 80C, your tax liability reduces from ₹1,820 to ₹1,450. You save ₹370 annually."
}
```

#### Simulate Tax Savings - 1L
- **Method:** POST
- **Endpoint:** `/api/tax/simulate`
- **Description:** Simulate tax savings with ₹1,00,000 additional investment
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
```json
{
  "additionalInvestment": 100000,
  "section": "sec80C"
}
```

#### Simulate Tax Savings - 1.5L
- **Method:** POST
- **Endpoint:** `/api/tax/simulate`
- **Description:** Simulate tax savings with ₹1,50,000 additional investment (max limit)
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
```json
{
  "additionalInvestment": 150000,
  "section": "sec80C"
}
```

#### Simulate Tax Savings - Section 80D
- **Method:** POST
- **Endpoint:** `/api/tax/simulate`
- **Description:** Simulate tax savings with health insurance (Section 80D)
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
```json
{
  "additionalInvestment": 25000,
  "section": "sec80D"
}
```

#### Get Investment Checklist
- **Method:** GET
- **Endpoint:** `/api/tax/checklist`
- **Description:** Generate personalized investment proof checklist
- **Headers:** Authorization: Bearer {token}
- **Response:**
```json
{
  "checklist": [
    "Investment Proof Checklist for June 2026",
    "========================================",
    "Section 80C: ₹1,50,000 declared",
    "Submit proofs for: Life Insurance, PPF, ELSS, NSC, etc.",
    "Section 80D: ₹25,000 declared",
    "Submit health insurance premium receipts",
    "HRA: ₹20,800 received",
    "Submit rent receipts worth ₹10,400",
    "Total declared: ₹1,85,000",
    "Deadline: Usually January 31st of the assessment year"
  ],
  "formatted": "Investment Proof Checklist for June 2026\n========================================\nSection 80C: ₹1,50,000 declared\n..."
}
```

#### Get Tax Recommendations
- **Method:** GET
- **Endpoint:** `/api/tax/recommendations`
- **Description:** Get personalized tax planning recommendations
- **Headers:** Authorization: Bearer {token}
- **Response:**
```json
{
  "recommendations": [
    "Tax Planning Recommendations for FY 2026",
    "========================================",
    "Maximize Section 80C:",
    "Invest ₹50,000 more to save ₹370 in tax",
    "Available options: PPF, ELSS, Life Insurance",
    "Optimize HRA:",
    "Claim additional ₹10,400 HRA exemption",
    "Submit rent receipts and rent agreement"
  ],
  "formatted": "Tax Planning Recommendations for FY 2026\n========================================"
}
```

### System Health API

#### Health Check
- **Method:** GET
- **Endpoint:** `/health`
- **Description:** Check if server is running
- **Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-22T10:30:00.000Z"
}
```

## Quick API Testing Workflow

1. Login to get token
2. Set token in Authorization header
3. Test all APIs with the token

## Postman Collection

A complete Postman collection is available in the `contrib/` directory:

- `postman_collection.json` - All API endpoints with examples
- `postman_environment.json` - Environment variables for testing

### Importing Postman Collection

1. Open Postman
2. Click "Import"
3. Select the JSON file from `contrib/postman_collection.json`
4. Import the environment from `contrib/postman_environment.json`
5. Select the environment
6. Run "Login - Employee" first to get the token

## Architecture

```
Frontend (HTML/CSS/JS) - http://localhost:3000
         |
         v
Express.js API Server
  |
  +-- Routes Layer (auth/payslip/tax/query)
  |     |
  |     v
  +-- Middleware (Auth/RBAC/RateLimit)
  |     |
  |     v
  +-- Core Services (Payroll/Tax/Document)
  |     |
  |     v
  +-- External Services (LLM Wrapper API)
  |
  +-- In-Memory Data Store (Mock Data)
```

## Project Structure

```
financial-wellness-ai-agent/
├── src/
│   ├── config/               # Configuration files
│   │   └── llm.config.ts
│   ├── core/                 # Core business logic
│   │   ├── payroll.service.ts
│   │   ├── tax.service.ts
│   │   └── document.service.ts
│   ├── models/               # Data models
│   │   └── index.ts
│   ├── security/             # Authentication and authorization
│   │   └── auth.middleware.ts
│   ├── services/             # External service integrations
│   │   └── llm.service.ts
│   ├── routes/               # API routes
│   │   ├── auth.routes.ts
│   │   ├── payslip.routes.ts
│   │   ├── tax.routes.ts
│   │   └── query.routes.ts
│   ├── prompts/              # AI prompt engineering
│   │   └── grounding.prompts.ts
│   ├── utils/                # Helpers and utilities
│   │   ├── logger.ts
│   │   └── error-handler.ts
│   ├── data/                 # Mock data
│   │   └── mock-data.ts
│   ├── app.ts                # Express app setup
│   └── server.ts             # Server entry point
├── public/                   # Static frontend files
│   └── index.html
├── tests/                    # Unit and integration tests
│   ├── unit/
│   └── integration/
├── contrib/                  # Contribution files
│   ├── postman_collection.json
│   └── postman_environment.json
├── .env.example              # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Security

- JWT-based authentication with expiry
- Role-based access control (Employee, Admin, Payroll)
- User-level data isolation
- Rate limiting (100 requests per 15 minutes)
- Audit logging for all user actions
- Input validation and sanitization
- Helmet.js for security headers

## Testing

```bash
# Run all tests
npm test

# Run tests with watch mode
npm run test:watch

# Run specific test file
npm test -- tests/unit/tax.service.test.ts
```

## Assumptions and Limitations

- Simplified tax slabs for demonstration
- All data stored in memory (demo only)
- OCR is simulated or uses AI vision
- No persistent database
- Mock data pre-populated for demo
- No production-grade security implementation

## Troubleshooting

| Issue | Solution |
|-------|----------|
| LLM_API_TOKEN not set | Check .env file and set token |
| CORS error | Server running on port 3000, check CORS config |
| No payroll records | Login with valid demo credentials |
| Invalid token | Re-login to get fresh token |
| Rate limiting | Wait 15 minutes or restart server |

## Quick Start Commands

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the server
npm start

# Development mode with auto-reload
npm run dev

# Run tests
npm test
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment mode | development |
| LLM_API_URL | LLM Wrapper API URL | https://llm-wrapper-... |
| LLM_API_TOKEN | API authentication token | (required) |
| JWT_SECRET | JWT signing secret | dev-secret-key |
| LOG_LEVEL | Logging level | info |

## Future Enhancements

- Persistent database (PostgreSQL/MongoDB)
- Real OCR integration
- Multi-month comparison charts
- PDF payslip generation
- Email notifications
- Mobile responsive UI
- Export to Excel/CSV
- Advanced tax rules
- Multi-company support
