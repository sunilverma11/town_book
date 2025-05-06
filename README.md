# Town Book - Library Management System

A comprehensive library management system that handles both book and room reservations.

## Core Features

### Catalog & Room Listings
- View available books with details (title, author, copies)
- View reading rooms with capacity and availability
- Real-time availability tracking

### Reservation System
- Book and room reservation requests
- Pending state management
- Automatic status updates
- Email/in-app reminders

### Admin Dashboard
- Request approval workflow
- Room and book management
- Return processing
- Usage statistics

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/town_book
JWT_SECRET=your_jwt_secret
```

4. Start the backend server:
```bash
npm start
```

### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

## Running the Application

1. Start MongoDB service
2. Start the backend server (runs on port 5000)
3. Start the frontend development server (runs on port 5173)
4. Access the application at http://localhost:5173

## Core Functional Modules

### 1. Catalog & Room Listings
- Books listing with search and filter capabilities
- Room availability calendar
- Real-time capacity tracking

### 2. Reservation Flow
- Member selects item/room + desired dates
- System checks availability
- Request placed in "Pending" state
- Automatic notifications

### 3. Approval Dashboard
- Librarian views pending requests
- Approve/Decline functionality
- Automatic status updates
- Email notifications

### 4. Reminders & Check-Out
- Automated reminders before pickup/check-in
- Member check-in confirmation
- Late return tracking

### 5. History & Returns
- Member reservation history
- Return processing
- Usage statistics
- Late return handling

## API Endpoints

### Books
- GET /api/books - List all books
- POST /api/books - Add new book
- GET /api/books/:id - Get book details
- PUT /api/books/:id - Update book
- DELETE /api/books/:id - Delete book

### Rooms
- GET /api/rooms - List all rooms
- POST /api/rooms - Add new room
- GET /api/rooms/:id - Get room details
- PUT /api/rooms/:id - Update room
- DELETE /api/rooms/:id - Delete room

### Book Requests
- GET /api/book-requests - List requests
- POST /api/book-requests - Create request
- PUT /api/book-requests/:id/process - Process request
- PUT /api/book-requests/:id/return - Process return

### Room Requests
- GET /api/room-requests - List requests
- POST /api/room-requests - Create request
- PUT /api/room-requests/:id/process - Process request
- PUT /api/room-requests/:id/leave-request - Request leave
- PUT /api/room-requests/:id/process-leave - Process leave request

## User Roles

### Member
- View books and rooms
- Make reservations
- View personal history
- Request returns

### Librarian
- Manage books and rooms
- Process requests
- Handle returns
- View statistics

## Security Features
- JWT authentication
- Role-based access control
- Input validation
- Error handling

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
