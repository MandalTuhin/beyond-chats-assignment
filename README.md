# BeyondChats Article System

A comprehensive full-stack application that scrapes articles from BeyondChats blog, enhances them using AI-powered content analysis and generation, and provides a modern web interface for viewing both original and enhanced articles.

## 🏗️ Architecture

The system is built as a monorepo with three main components:

- **Backend** (`/backend`): Node.js/Express API server with web scraping and AI integration
- **Frontend** (`/frontend`): React-based responsive web interface
- **Shared** (`/shared`): Common utilities, types, and Zod validation schemas

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- MySQL 8.0+ (or use Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd beyondchats-article-system
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Install dependencies**
   ```bash
   npm run install:all
   ```

4. **Start with Docker (Recommended)**
   ```bash
   npm run docker:up
   ```

   Or start services individually:
   ```bash
   # Start database
   docker-compose up mysql -d
   
   # Start backend (in separate terminal)
   npm run dev:backend
   
   # Start frontend (in separate terminal)
   npm run dev:frontend
   ```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **MySQL**: localhost:3306

## 📁 Project Structure

```
beyondchats-article-system/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Utility functions
│   │   └── test/            # Test files
│   ├── Dockerfile
│   └── package.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── test/            # Test files
│   ├── Dockerfile
│   └── package.json
├── shared/                  # Shared utilities
│   ├── src/
│   │   ├── types/           # Common types
│   │   ├── utils/           # Utility functions
│   │   └── validation/      # Zod schemas for data validation
│   └── package.json
├── database/
│   └── init/                # Database initialization scripts
├── docker-compose.yml       # Docker services configuration
└── package.json             # Root package.json
```

## 🛠️ Development

### Available Scripts

**Root level:**
- `npm run install:all` - Install all dependencies
- `npm run build` - Build all projects
- `npm run test` - Run all tests
- `npm run lint` - Lint all projects
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services

**Backend:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

### Environment Variables

#### Root `.env`
```env
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=beyondchats_articles
MYSQL_USER=appuser
MYSQL_PASSWORD=apppassword
API_PORT=3001
FRONTEND_PORT=3000
```

#### Backend `.env`
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=beyondchats_articles
DB_USER=appuser
DB_PASSWORD=apppassword
PORT=3001
GOOGLE_SEARCH_API_KEY=your_api_key
OPENAI_API_KEY=your_api_key
```

#### Frontend `.env`
```env
VITE_API_URL=http://localhost:3001/api
```

## 🧪 Testing

The project uses a comprehensive testing strategy:

- **Unit Tests**: Jest for backend and shared modules, Vitest for frontend
- **Property-Based Tests**: fast-check library for testing universal properties
- **Integration Tests**: End-to-end testing of complete workflows

Run tests:
```bash
# All tests
npm run test

# Specific module
npm run test:backend
npm run test:frontend
npm run test:shared
```

## 📊 Database Schema

### Articles Table
- `id`: Primary key (UUID)
- `title`: Article title
- `content`: Original article content
- `url`: Source URL
- `scraped_date`: When article was scraped
- `enhanced_content`: AI-enhanced version
- `is_enhanced`: Boolean flag
- `word_count`, `reading_time`: Metadata
- `tags`: JSON array of tags

### References Table
- Links to external articles used for enhancement
- Stores relevance scores and scraped content

### Enhancement Requests Table
- Tracks AI enhancement job status
- Stores prompts and error messages

## 🔧 API Endpoints

### Articles
- `GET /api/articles` - List all articles
- `GET /api/articles/:id` - Get specific article
- `POST /api/articles` - Create new article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article

### Health Check
- `GET /api/health` - Service health status

## 🚀 Deployment

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. **Build all projects**
   ```bash
   npm run build
   ```

2. **Set up production database**
   - Create MySQL database
   - Run initialization scripts from `/database/init/`

3. **Configure environment variables**
   - Set production API keys
   - Update database connection strings
   - Configure CORS origins

4. **Deploy services**
   - Backend: Deploy to Node.js hosting service
   - Frontend: Deploy to static hosting (Vercel, Netlify, etc.)
   - Database: Use managed MySQL service

## 🔍 Monitoring and Logging

- **Winston** for structured logging in backend
- **Health check endpoints** for service monitoring
- **Error tracking** with detailed stack traces
- **Performance metrics** for API response times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write tests for new features
- Use ESLint and Prettier for code formatting
- Follow conventional commit messages
- Update documentation for API changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
- Ensure MySQL is running
- Check environment variables
- Verify network connectivity

**API Not Responding**
- Check backend logs: `npm run docker:logs`
- Verify port availability
- Check environment configuration

**Frontend Build Errors**
- Clear node_modules and reinstall
- Check TypeScript configuration
- Verify API URL configuration

**Docker Issues**
- Ensure Docker daemon is running
- Check port conflicts
- Review docker-compose logs

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page
- Review the [Wiki](https://github.com/your-repo/wiki) for detailed guides
- Contact the development team

## 🗺️ Roadmap

- [ ] Phase 1: Web scraping and CRUD API ✅
- [ ] Phase 2: AI-powered content enhancement
- [ ] Phase 3: React frontend interface
- [ ] Phase 4: Advanced features and optimization

---

**Built with ❤️ for BeyondChats**