# 🐕 Ponnect - Australian Dog Parent Community

> Connecting dog owners across Queensland through community, expert advice, local events, and health tracking.

## Overview

Ponnect is a comprehensive web and mobile platform designed specifically for dog parents in Brisbane and Queensland, Australia. It combines the power of community forums, verified expert advice, local events, and pet health management into one friendly, easy-to-use platform.

## Features

### 🗨️ Community Forums
- Connect with fellow dog owners across Queensland
- Share experiences, tips, and stories
- Organize discussions by categories
- Rich engagement with comments and views

### 🩺 Expert Q&A
- Get trusted answers from verified veterinarians
- Professional advice from certified dog trainers
- Browse answered questions from the community
- Mark accepted answers for easy reference

### 📅 Local Events & Meetups
- Discover dog-friendly events in Brisbane and Queensland
- Create and organize your own meetups
- RSVP and track attendance
- Location-based event discovery

### 💊 Pet Health Tracking
- Vaccination records and reminders
- Medication schedules and tracking
- Customizable health reminders
- Complete health history for each dog

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with bcrypt
- **API**: RESTful architecture

### Frontend (Web)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Query
- **HTTP Client**: Axios
- **Styling**: CSS with custom design system

### Mobile
- **Framework**: React Native with Expo
- **Platform**: iOS & Android support
- **Navigation**: React Navigation
- **API Integration**: Shared with web

## Project Structure

```
Ponnect/
├── packages/
│   ├── backend/          # Node.js/Express API server
│   │   ├── src/
│   │   │   ├── controllers/   # Request handlers
│   │   │   ├── routes/        # API routes
│   │   │   ├── middleware/    # Auth & validation
│   │   │   ├── config/        # Database & config
│   │   │   └── index.ts       # Server entry point
│   │   └── prisma/
│   │       └── schema.prisma  # Database schema
│   │
│   ├── web/              # React web application
│   │   └── src/
│   │       ├── components/    # React components
│   │       ├── pages/         # Page components
│   │       ├── services/      # API services
│   │       └── styles/        # CSS styles
│   │
│   └── mobile/           # React Native app
│       └── src/
│           ├── screens/       # Mobile screens
│           ├── components/    # React Native components
│           └── navigation/    # Navigation setup
│
└── package.json          # Workspace configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ahkhalil-lab/Ponnect.git
   cd Ponnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd packages/backend && npm install
   cd ../web && npm install
   cd ../mobile && npm install
   cd ../..
   ```

3. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb ponnect
   
   # Copy environment file
   cp packages/backend/.env.example packages/backend/.env
   
   # Update DATABASE_URL in .env with your PostgreSQL credentials
   # Example: postgresql://username:password@localhost:5432/ponnect
   ```

4. **Run database migrations**
   ```bash
   cd packages/backend
   npm run prisma:generate
   npm run prisma:migrate
   ```

### Running the Application

#### Development Mode (Full Stack)

Run both backend and web frontend:
```bash
npm run dev
```

This starts:
- Backend API on `http://localhost:3001`
- Web app on `http://localhost:3000`

#### Individual Services

**Backend only:**
```bash
npm run dev:backend
```

**Web only:**
```bash
npm run dev:web
```

**Mobile app:**
```bash
npm run dev:mobile
```

### Building for Production

**Build all:**
```bash
npm run build
```

**Build backend:**
```bash
npm run build:backend
```

**Build web:**
```bash
npm run build:web
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (requires auth)

### Dogs
- `POST /api/dogs` - Add new dog
- `GET /api/dogs` - Get user's dogs
- `GET /api/dogs/:id` - Get specific dog
- `PUT /api/dogs/:id` - Update dog
- `DELETE /api/dogs/:id` - Delete dog

### Forum
- `GET /api/forum/posts` - List forum posts
- `POST /api/forum/posts` - Create post (requires auth)
- `GET /api/forum/posts/:id` - Get post details
- `POST /api/forum/posts/:id/comments` - Add comment (requires auth)

### Questions (Expert Q&A)
- `GET /api/questions` - List questions
- `POST /api/questions` - Ask question (requires auth)
- `GET /api/questions/:id` - Get question with answers
- `POST /api/questions/:id/answers` - Answer question (vet/trainer only)

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event (requires auth)
- `GET /api/events/:id` - Get event details
- `POST /api/events/:id/attend` - RSVP to event (requires auth)

### Health Tracking
- `POST /api/health/vaccinations` - Add vaccination record
- `GET /api/health/vaccinations/:dogId` - Get vaccinations
- `POST /api/health/medications` - Add medication
- `GET /api/health/medications/:dogId` - Get medications
- `POST /api/health/reminders` - Create reminder
- `GET /api/health/reminders/:dogId` - Get reminders

## Database Schema

Key models:
- **User** - User accounts with roles (USER, VET, TRAINER, ADMIN)
- **Dog** - Dog profiles with health tracking
- **ForumPost** - Community forum posts
- **Question/Answer** - Expert Q&A system
- **Event** - Local meetups and events
- **Vaccination** - Vaccination records
- **Medication** - Medication tracking
- **Reminder** - Health care reminders

## Environment Variables

### Backend (.env)

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/ponnect
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000
```

## User Roles

- **USER** - Regular dog parent (default)
- **VET** - Verified veterinarian (can answer expert questions)
- **TRAINER** - Verified dog trainer (can answer expert questions)
- **ADMIN** - Platform administrator

## Security Considerations

### Current Implementation
- JWT-based authentication with bcrypt password hashing
- Role-based access control for verified professionals
- Environment variable configuration for secrets
- Input sanitization for user-provided data

### Production Recommendations
1. **Token Storage**: Currently uses localStorage for simplicity. For production, consider:
   - HttpOnly cookies to prevent XSS attacks
   - Secure and SameSite cookie attributes
   - Token refresh mechanism
2. **Environment Variables**: Always use strong, unique secrets in production
3. **HTTPS**: Deploy with SSL/TLS certificates
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **Input Validation**: Implement comprehensive input validation and sanitization
6. **Database**: Use connection pooling and prepared statements (Prisma handles this)

## Contributing

We welcome contributions from the community! Please feel free to submit issues and pull requests.

## License

MIT License - see LICENSE file for details

## Support

For support, please open an issue on GitHub or contact the maintainers.

## Acknowledgments

Built with ❤️ for the Queensland dog parent community.

---

**Made in Brisbane, Australia 🇦🇺**