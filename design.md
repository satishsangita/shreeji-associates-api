# Shreeji Associates — Mobile App Design

## Brand Identity
- **Primary Color**: #1A3C8F (Deep Navy Blue — trust, authority, law)
- **Accent Color**: #F5A623 (Amber Gold — prestige, Indian legal tradition)
- **Background**: #F4F6FB (Light Blue-Grey)
- **Surface**: #FFFFFF
- **Text Primary**: #1A1A2E
- **Text Secondary**: #6B7280
- **Success**: #22C55E
- **Error**: #EF4444
- **Warning**: #F59E0B

## Screen List

1. **Dashboard** (`/`) — Home tab with stats, upcoming hearings, recent activity
2. **Title Report** (`/title-report`) — Generate property title search reports
3. **Mortgage Deed** (`/mortgage-deed`) — Draft mortgage deed documents
4. **Sale Deed** (`/sale-deed`) — Draft sale deed documents
5. **AI Assistant** (`/ai-assistant`) — Chat with Google Gemini for Indian law queries

## Primary Content & Functionality

### Dashboard
- Header: "Welcome back, Advocate Satish" + date
- Stats row: Open Cases, Total Clients, Upcoming Hearings, Pending Cases (colored icon circles)
- Upcoming Hearings table: Date, Case, Purpose
- Quick action buttons: New Case, New Client, New Task
- Recent documents section

### Title Report
- Form: Property address, survey number, owner name, district, taluka
- Property description textarea
- Date range for title search
- Generate Report button
- Preview/download generated report

### Mortgage Deed
- Form: Mortgagor name/address, Mortgagee name/address
- Property schedule description
- Loan amount, interest rate, repayment period
- Execution date
- Generate Document button
- Preview pane on right

### Sale Deed
- Form: Seller name/address, Buyer name/address
- Property address/schedule description
- Sale amount, advance amount
- Upload reference documents (optional)
- Generate Document button

### AI Assistant
- Chat interface with bubble messages
- System: "AI Legal Assistant — Powered by Gemini · Indian Law Specialist"
- Greeting: "Namaste! I am your AI Legal Assistant tailored for Indian Law..."
- Input bar: "Ask for judgments on section 138 NI Act..."
- Disclaimer: "AI responses may be inaccurate. Always verify with official legal texts."
- Supports: BNS, BNSS, IPC, CrPC, case laws, drafting suggestions

## Key User Flows

1. **View Dashboard** → See stats → Tap upcoming hearing → (future: case detail)
2. **Generate Sale Deed** → Tap Sale Deed tab → Fill seller/buyer/property info → Tap Generate → View document
3. **Generate Title Report** → Tap Title Report tab → Enter property details → Generate → View report
4. **Generate Mortgage Deed** → Tap Mortgage Deed tab → Fill mortgagor/mortgagee details → Generate
5. **AI Chat** → Tap AI Assistant tab → Type legal question → Receive Gemini response

## Navigation
Bottom tab bar with 5 items:
- Dashboard (house icon)
- Title Report (document.text icon)
- Mortgage Deed (building.columns icon)
- Sale Deed (doc.badge.plus icon)
- AI Assistant (brain / sparkles icon)

## Layout Principles
- Portrait 9:16, one-handed usage
- Cards with subtle shadow for content sections
- Navy blue header/tab bar
- Amber gold for primary action buttons
- iOS HIG compliant spacing and typography
