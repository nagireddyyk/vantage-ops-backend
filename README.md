# Vantage Ops API

Node.js + Express + Sequelize + MySQL backend.

## Setup
1. Copy `.env.example` to `.env` and fill in your own credentials.
2. Install dependencies: `npm install`
3. Apply the new role/assignment schema migration after backing up your database:
   `npm run fix:sales-workflow-schema`
4. Start API: `npm run dev` or `npm start`.

The existing product, quote, order, purchase-order, ticket, and authentication endpoints remain. See `README-SALES-WORKFLOW.md` for role rules, new API endpoints, the Excel Sheet 2 questionnaire contract, and frontend integration notes.

## Security
- Never commit `.env` or database credentials.
- Public registration always creates customer accounts only.
- Create superAdmin and sales accounts only via a trusted admin/seed process.
