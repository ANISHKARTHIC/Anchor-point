# Anchorpoint Platform

This repository contains the backend and frontend code for the Anchorpoint platform.

## Prerequisites

- Node.js (v18+)
- Python (v3.11+)
- PostgreSQL (v14+)

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd anchor-point-backend-main
   ```
2. Set up the Python virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Set up environment variables. Update the `src/.env` file with your database credentials.
4. Run database migrations:
   ```bash
   set -a && source src/.env && set +a && PYTHONPATH=$(pwd)/src ./venv/bin/alembic -c src/migrations/alembic.ini upgrade head
   ```
5. Start the backend server:
   ```bash
   ./run.sh
   ```
   The backend API will run on `http://localhost:8000`.

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd anchor-point-dashboard-main
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables if needed (e.g., `VITE_API_BASE_URL`).
4. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

## UI/UX Enhancements

The dashboard UI has been updated to feature a premium and minimalistic design language:
- Clean geometry with rounded corners and simplified borders.
- Monochromatic Slate color palette (`#334155` to `#F9FAFB`).
- Modern typography using the `Inter` font.
- Unified UI scaling and layout through Material UI and Tailwind CSS configurations.

## Invoicing Features
- **Hotel Name & PO Number** tracking natively included.
- Automatic pricing calculation from Vendor Packages.
- AWS S3 integrated `/api/upload` endpoint for supporting documents and receipts.
