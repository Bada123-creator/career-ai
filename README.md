# Career AI

### AI-Powered Career Management Platform

Career AI is a full-stack web application designed to help job seekers manage their applications, explore job opportunities, analyze resumes, and prepare for interviews using AI-assisted features.

**Status:** Work in progress — personal software development project.

## Tech Stack

### Backend
- Python
- Django & Django REST Framework
- PostgreSQL
- JWT Authentication

### Frontend
- Next.js
- React
- TypeScript

### Development Tools
- Git & GitHub
- REST APIs

## Main Features

The project includes modules for:

- User registration and JWT authentication
- Resume management and analysis
- Job searching and matching
- Job application tracking
- Cover letter generation
- Interview preparation
- Skills gap analysis
- Job recommendations
- Career analytics and dashboard

Some features are still under development and testing.

## Project Structure

```text
career-ai/
├── backend/
│   ├── accounts/
│   ├── ai_tools/
│   ├── applications/
│   ├── config/
│   ├── core/
│   ├── cvs/
│   ├── jobs/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
└── README.md
```

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file with the environment variables required by the Django configuration. Set up the database before running migrations.

```bash
python manage.py migrate
python manage.py runserver 8001
```

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

The frontend is available at http://localhost:3000.

The backend API runs at http://localhost:8001.

## Security

Environment variables, local databases, virtual environments, uploaded resumes and generated build files are excluded from version control.

Do not commit API keys, credentials or personal user documents.

## Project Goals

- Build practical AI-assisted career management tools
- Develop a scalable full-stack web architecture
- Integrate AI services and external APIs
- Improve software engineering and application design skills

## Author

**Bada DIOP**

Computer Science / MIAGE graduate

Interested in software engineering, data and artificial intelligence.

## License

No open-source license has been selected yet.
