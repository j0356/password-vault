# Password Vault

> ⚠️ **SECURITY WARNING**
> 
> This project is created for a **university assignment** and contains **intentional security vulnerabilities** for educational purposes. 
> 
> **DO NOT use this as your actual password manager!**
> 
> This application is designed to demonstrate common security flaws and should only be used in a controlled, educational environment. Never store real passwords or sensitive information in this system.

---

A secure password manager with a modern UI and encrypted credential storage.

## Quick Start with Docker 🐳

```bash
# Clone and navigate to project
cd password-vault

# Copy environment file and edit secrets
cp backend/.env.example backend/.env
nano backend/.env  # Change all default passwords!

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Access the app:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Database Admin (optional): http://localhost:8080

To enable Adminer (database UI):
```bash
docker-compose --profile tools up -d
```

## Project Structure

```
password-vault/
├── frontend/                 # Client-side application
│   ├── index.html           # Main HTML page
│   ├── styles.css           # All styles
│   ├── api.js               # API service layer
│   └── app.js               # Application logic
│
├── backend/                  # Server-side API
│   ├── server.js            # Express server entry point
│   ├── package.json         # Dependencies
│   ├── .env.example         # Environment variables template
│   │
│   ├── config/
│   │   └── database.js      # Database connection
│   │
│   ├── database/
│   │   └── schema.sql       # Database schema
│   │
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   │
│   ├── routes/
│   │   ├── auth.js          # Auth endpoints
│   │   └── credentials.js   # Credentials CRUD
│   │
│   └── utils/
│       └── encryption.js    # AES-256 encryption
│
└── README.md
```

## Setup Instructions

### 1. Database Setup

#### MySQL
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE password_vault;
USE password_vault;

# Run schema
source backend/database/schema.sql;
```

#### PostgreSQL
```bash
# Create database
createdb password_vault

# Run schema (use PostgreSQL version in schema.sql)
psql password_vault < backend/database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Install dependencies
npm install

# Start server
npm run dev    # Development with auto-reload
npm start      # Production
```

The API will run on `http://localhost:4000`

### 3. Frontend Setup

```bash
cd frontend

# Option 1: Open directly in browser
open index.html

# Option 2: Use a simple HTTP server
npx serve .
# or
python -m http.server 3000
```

The frontend will be available at `http://localhost:3000`

### 4. Update Frontend API URL (if needed)

Edit `frontend/api.js` line 8:
```javascript
const API_BASE_URL = 'http://localhost:4000/api';
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/verify` | Verify token |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/change-password` | Change password |

### Credentials (requires auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/credentials` | List all |
| GET | `/api/credentials/:id` | Get one |
| POST | `/api/credentials` | Create |
| PUT | `/api/credentials/:id` | Update |
| DELETE | `/api/credentials/:id` | Delete |
| GET | `/api/credentials/search/:term` | Search |

## Security Features

- **Password Hashing**: User passwords hashed with bcrypt (12 rounds)
- **Credential Encryption**: Stored passwords encrypted with AES-256-GCM
- **JWT Authentication**: Secure token-based auth with expiration
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Configured for frontend origin only
- **Helmet**: Security headers enabled

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | 4000 |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 3306 |
| `DB_USER` | Database user | root |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | password_vault |
| `JWT_SECRET` | Secret for signing tokens | - |
| `JWT_EXPIRES_IN` | Token expiration | 24h |
| `ENCRYPTION_KEY` | Key for AES encryption | - |
| `FRONTEND_URL` | Allowed CORS origin | http://localhost:3000 |

## Database Tables

### users
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| username | VARCHAR(50) | Unique username |
| password_hash | VARCHAR(255) | Bcrypt hash |
| email | VARCHAR(100) | Optional email |
| created_at | TIMESTAMP | Account created |
| last_login | TIMESTAMP | Last login time |
| is_active | BOOLEAN | Account status |

### credentials
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| user_id | INT | Foreign key to users |
| site_name | VARCHAR(100) | Website/service name |
| site_url | VARCHAR(255) | Optional URL |
| username | VARCHAR(255) | Login username |
| password | VARCHAR(500) | Encrypted password |
| notes | TEXT | Optional notes |
| category | VARCHAR(50) | Optional category |

## License

MIT

---

## ⚠️ Disclaimer

This project is developed as part of a **university assignment** to demonstrate web application security concepts. The application contains **intentional security vulnerabilities** for educational purposes.

**DO NOT:**
- Use this as a real password manager
- Store actual passwords or sensitive information
- Deploy this to production without understanding the risks
- Rely on this for any security-critical purpose

**This project is intended for:**
- Learning about web security vulnerabilities
- Understanding common attack vectors
- Practicing security testing and penetration testing
- Educational demonstrations only

The authors are not responsible for any misuse or damage caused by this application.

---

## Docker Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │   Frontend   │    │   Backend    │    │  MySQL    │  │
│  │   (Nginx)    │───▶│  (Node.js)   │───▶│  Database │  │
│  │   :3000      │    │   :4000      │    │  :3306    │  │
│  └──────────────┘    └──────────────┘    └───────────┘  │
│         │                                               │
│         │ /api/* proxy                                  │
│         └───────────────────────────────────────────────│
└─────────────────────────────────────────────────────────┘
```

## Docker Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# Restart a service
docker-compose restart backend

# Stop all
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Shell into container
docker exec -it vault-backend sh
docker exec -it vault-database mysql -u vault_user -p

# Check health
docker-compose ps
```