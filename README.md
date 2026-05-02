# AdaptiveLearn - AI-Powered Adaptive Learning Platform

A modern, scalable web application designed for internees at SALTEL. The system personalizes learning experiences based on student performance, tracks progress, and recommends tailored learning paths using AI.

## 🚀 Features

### Core Functionality
- **Multi-Role Authentication**: Admin, Instructor, and Student roles with secure JWT-based authentication
- **Adaptive Learning Engine**: AI-powered recommendations that adapt to student performance
- **Progress Tracking**: Comprehensive monitoring of student progress and performance analytics
- **Course Management**: Create and manage courses with modules, lessons, and quizzes
- **Role-Based Dashboards**: Customized interfaces for each user role

### Technical Features
- **Next.js 16**: Latest version with App Router for optimal performance
- **TypeScript**: Full type safety and better developer experience
- **MongoDB**: Scalable NoSQL database with Mongoose ODM
- **Tailwind CSS**: Modern, responsive design system
- **NextAuth.js**: Secure authentication with role-based access control

## 🛠 Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: NextAuth.js with JWT strategy
- **Database**: MongoDB with connection pooling
- **UI Components**: Custom components with shadcn/ui patterns
- **AI Integration**: Custom adaptive learning algorithms

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB database (local or cloud)
- pnpm package manager (recommended)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd adaptativelearn
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/AdaptiveLearn

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# JWT
JWT_SECRET=your-jwt-secret-here-change-in-production

# OpenAI (optional for AI recommendations)
OPENAI_API_KEY=your-openai-api-key-here
```

### 4. Database Setup

Ensure your MongoDB database is running and accessible with the connection string provided in `.env.local`.

### 5. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
adaptativelearn/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── users/             # User management
│   │   ├── courses/           # Course management
│   │   ├── modules/           # Module management
│   │   ├── progress/          # Progress tracking
│   │   └── recommendations/   # AI recommendations
│   ├── auth/                  # Authentication pages
│   ├── dashboard/             # Role-based dashboards
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/
│   ├── ui/                    # Reusable UI components
│   └── providers/             # Context providers
├── database/
│   ├── models/               # Mongoose models
│   └── connection.ts         # Database connection
├── lib/
│   ├── auth.ts               # NextAuth configuration
│   ├── mongodb.ts           # MongoDB client
│   ├── adaptive-learning.ts # AI recommendation engine
│   └── utils.ts             # Utility functions
├── types/
│   ├── index.ts              # Type definitions
│   └── next-auth.d.ts       # NextAuth types
└── public/                   # Static assets
```

## 🎯 User Roles & Features

### 🎓 Student
- **Personalized Learning**: AI-powered recommendations based on performance
- **Progress Tracking**: Visual progress bars and completion metrics
- **Course Enrollment**: Browse and enroll in available courses
- **Adaptive Paths**: Dynamic learning paths that adjust to performance
- **Performance Analytics**: Detailed insights into learning progress

### 👨‍🏫 Instructor
- **Course Creation**: Build comprehensive courses with modules and lessons
- **Content Management**: Upload videos, create quizzes, and manage materials
- **Student Analytics**: Monitor student progress and engagement
- **Performance Tracking**: View class performance and identify struggling students
- **Revenue Tracking**: Monitor earnings from course enrollments

### 👑 Administrator
- **User Management**: Create and manage user accounts across all roles
- **Platform Analytics**: Comprehensive dashboard with system metrics
- **Course Oversight**: Review and manage all courses on the platform
- **System Administration**: Configure platform settings and permissions
- **Report Generation**: Export detailed reports on usage and performance

## 🧠 Adaptive Learning Engine

The adaptive learning system analyzes student performance to provide personalized recommendations:

### Performance Analysis
- **Score Tracking**: Monitor quiz and assessment scores
- **Learning Speed**: Calculate pace of completion
- **Strength/Weakness Detection**: Identify areas of expertise and improvement
- **Difficulty Adaptation**: Adjust content difficulty based on performance

### Recommendation Algorithm
- **Prerequisite Checking**: Ensure foundational knowledge before advanced topics
- **Performance-Based Suggestions**: Recommend content based on success rates
- **Category Balancing**: Balance learning across different subject areas
- **Confidence Scoring**: Provide recommendations with confidence levels

## 🔐 Authentication & Security

### Role-Based Access Control
- **Admin**: Full system access and user management
- **Instructor**: Course creation and student management
- **Student**: Learning access and personal progress tracking

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Session Management**: Secure session handling with NextAuth.js
- **API Protection**: Route protection based on user roles
- **Data Validation**: Input validation and sanitization

## 📊 Database Schema

### Core Collections
- **Users**: Authentication data, roles, and profile information
- **Courses**: Course metadata, categories, and instructor assignments
- **Modules**: Individual learning modules with content and assessments
- **Progress**: Student progress tracking and performance data
- **Recommendations**: AI-generated learning recommendations

### Relationships
- Users → Courses (Instructor relationship)
- Users → Progress (Student relationship)
- Courses → Modules (One-to-many)
- Progress → Recommendations (Generated data)

## 🎨 UI/UX Design

### Design Principles
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Modern Interface**: Clean, professional design with Tailwind CSS
- **Accessibility**: WCAG compliant with semantic HTML and ARIA labels
- **Performance**: Optimized components and lazy loading
- **User Experience**: Intuitive navigation and clear information hierarchy

### Component Library
- **Reusable Components**: Modular UI components with consistent styling
- **Design System**: Unified color palette, typography, and spacing
- **Interactive Elements**: Smooth transitions and micro-interactions
- **Form Validation**: Real-time validation and user feedback

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production:

```env
MONGODB_URI=your-production-mongodb-uri
NEXTAUTH_URL=your-production-url
NEXTAUTH_SECRET=your-production-secret
JWT_SECRET=your-production-jwt-secret
```

### Build Commands

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

### Platform Recommendations
- **Vercel**: Recommended for Next.js applications
- **MongoDB Atlas**: Recommended for MongoDB hosting
- **AWS S3**: For file storage and media assets
- **Cloudflare**: For CDN and security features

## 🧪 Testing

### Running Tests
```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e
```

### Test Coverage
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Full user journey testing

## 📈 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js Image component with lazy loading
- **Bundle Analysis**: Regular bundle size monitoring
- **Caching Strategy**: Intelligent caching for static assets

### Backend Optimization
- **Database Indexing**: Optimized queries with proper indexing
- **Connection Pooling**: Efficient database connection management
- **API Caching**: Response caching for frequently accessed data
- **Rate Limiting**: Protection against API abuse

## 🔧 Development

### Code Quality
- **TypeScript**: Full type safety across the application
- **ESLint**: Code quality and consistency enforcement
- **Prettier**: Automatic code formatting
- **Husky**: Git hooks for pre-commit checks

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

## 🗺 Roadmap

### Upcoming Features
- [ ] Real-time collaboration tools
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Video conferencing integration
- [ ] Gamification elements
- [ ] Certificate generation
- [ ] Payment processing integration
- [ ] Advanced AI recommendations with OpenAI

### Performance Improvements
- [ ] Advanced caching strategies
- [ ] Database optimization
- [ ] CDN implementation
- [ ] Load balancing

---

**Built with ❤️ for the SALTEL learning community**
