# 🐩 Poodle

A full-stack polling application built with modern web technologies for creating and managing polls with real-time voting.

## 🛠️ Stack

**Frontend:**
- **SvelteKit** - Fast, modern web framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vite** - Lightning-fast build tool

**Backend:**
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe server development
- **TypeORM** - Database ORM
- **PostgreSQL** - Primary database
- **Supabase** - Optional auth & database provider
- **JWT** - Authentication tokens

**Infrastructure:**
- **Docker** - Containerization
- **Node.js 20** - Runtime environment

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker (optional)
- PostgreSQL (or Supabase account)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/jansarba/poodle.git
cd poodle
```

2. **Backend Setup**
```bash
cd backend
npm install
npm run start:dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Environment Variables

**Backend (.env):**
```env
USE_SUPABASE=false
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=poodle
JWT_SECRET=your_jwt_secret
BACKEND_PORT=3000
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_USE_SUPABASE=false
```

## 🎯 Features

- Create and manage polls
- Real-time voting system
- User authentication
- Responsive design
- Docker deployment ready
- Supabase integration support
