# Eventara – Community Management System  

Eventara is a web-based platform built to support the **Davao DeFi Community PH** in managing participants, events, volunteers, venues, and reporting.  
The system integrates multiple subsystems into a centralized solution, providing better visibility, coordination, and analytics.  

## 🚀 Tech Stack  
- **Backend:** [Laravel ^11.0](https://laravel.com/)  
- **Frontend:** [ReactJS](https://react.dev/) with [Vite](https://vitejs.dev/)  
- **Styling:** [TailwindCSS](https://tailwindcss.com/)  
- **Database:** [PostgreSQL](https://www.postgresql.org/)  
- **Authentication:** Laravel Breeze / Passport (OAuth2, Google SSO planned)  
- **Deployment:** Docker-ready (optional)  

---

## 📌 Features  

### 1. User Profiling & Management  
- User registration, login, and profile setup.  
- CRUD for personal details (name, contact, demographics, preferences).  
- Role-based access (User, Volunteer, Admin).  
- Admin tools for managing user accounts.  

### 2. Event Builder & Scheduler  
- Create, update, and delete events with details (title, description, time, location, host).  
- View past and upcoming events.  
- Archive completed events.  

### 3. Volunteer Portal  
- Volunteer applications and resignations.  
- Event sign-up and schedule management.  
- Admin dashboard for assignments and volunteer counts.  

### 4. Venue Hub  
- Venue posting with details (location, capacity, amenities).  
- Search and filter venue records.  
- Ratings and community feedback.  
- Admin moderation of flagged venues.  

### 5. Analytics & Reporting  
- Centralized dashboards for participants, events, volunteers, and venues.  
- Export reports (PDF, CSV).  
- Visualized insights for leadership.  

---

## 📂 Project Structure  
```arduino
eventara/
├── backend/ # Laravel API (User, Event, Volunteer, Venue, Reports)
│ ├── app/
│ ├── routes/
│ ├── database/
│ └── tests/
├── frontend/ # React + Tailwind app
│ ├── src/
│ ├── public/
│ └── tests/
└── docs/ # Software engineering docs & diagrams
```

---

## ⚙️ Installation  

### Prerequisites  
- PHP >= 8.2  
- Composer  
- Node.js >= 18  
- PostgreSQL >= 14  
- Git  

### Backend Setup (Laravel 11)  
```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend Setup (React + Vite + Tailwind)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Database
Ensure PostgreSQL is running and credentials match the ```.env``` file.

---

## 🧪 Testing
Backend (Laravel):
```bash
php artisan test
```

Frontend (React):
```bash
npm test
```
---

## 🔐 Security & Compliance
- Role-based access control.
- Encryption at rest and in transit.
- Aligned with OWASP ASVS, PH Data Privacy Act (RA10173), and WCAG 2.2 AA accessibility standards.*

---

## 📊 System Architecture
- Main Components:
- User Service API (/api/users/...)
- Event Service API (/api/events/...)
- Volunteer Service API (/api/volunteers/...)
- Venue Service API (/api/venues/...)
- Analytics API (/api/reports/...)

Detailed diagrams and wireframes: [Figma Prototype](https://www.figma.com/design/f2la4VgBAupu5Mhx7Sb0s0/Eventara--Prototype?node-id=0-1&t=VQsFG62RElUR6Ys3-1)

---

## 📅 Roadmap
- OAuth2 / Google SSO integration.
- Docker support for production deployment.
- Analytics and predictive insights.
- External calendar integrations (Google/Outlook).

---

## 📜 License
This project is licensed under the MIT License – see the [LICENSE](https://mit-license.org/).