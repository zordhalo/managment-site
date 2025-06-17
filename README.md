# Room Booking & Shift Management System 🏢

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A modern full-stack application for managing room bookings, employee shifts, and facility management. Built with React, TypeScript, Express, and PostgreSQL (via Drizzle ORM).

<div align="center">
  <img src="generated-icon.png" alt="Project logo" width="200"/>
</div>

## 📋 Features

### For Players
- Browse and book available rooms
- Manage existing bookings
- View booking history and status
- QR code access for quick check-ins

### For Employees
- View assigned shifts
- Manage daily tasks
- Track maintenance schedules
- Support player requests

### For Supervisors
- Complete system dashboard
- Room management (add/edit/deactivate)
- Shift scheduling and assignment
- Booking approval and management

## 🚀 Tech Stack

### Frontend
- **React** with **TypeScript**
- **Vite** for fast development
- **Tailwind CSS** with custom theming
- **Radix UI** components 
- **React Query** for data fetching
- **Wouter** for routing

### Backend
- **Express.js** server
- **Drizzle ORM** for database interactions
- **PostgreSQL** with NeonDB serverless
- **JWT** authentication
- **Zod** for schema validation

## 📦 Project Structure

```
├── client/                   # Frontend code
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions
│   │   └── pages/            # Application pages by role
├── server/                   # Backend code
│   ├── routes.ts             # API route definitions
│   ├── auth.ts               # Authentication logic
│   └── storage.ts            # Database access
├── shared/                   # Shared types and schemas
└── drizzle.config.ts         # Database configuration
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v16 or newer)
- PostgreSQL database or NeonDB account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/room-booking-system.git
cd room-booking-system
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
# Create a .env file in the project root with:
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
```

4. Initialize the database
```bash
npm run db:push
```

5. Start the development server
```bash
npm run dev
```

The application will be available at http://localhost:3000.

## 🚀 Deployment

Build the project for production deployment:

```bash
npm run build
npm run start
```

## 🧪 Testing

```bash
# Coming soon
```

## 🧑‍💻 User Roles

- **Player**: End users who book rooms
- **Employee**: Staff who manage rooms and help players
- **Supervisor**: Administrators with full system access

## 🙌 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
