# 🚀 Backend Project  

This repository contains the backend implementation of the project. It provides the necessary APIs and logic to power the frontend application and manage data efficiently.

---

## 🚀 Purpose

The purpose of this project is to provide an intuitive and secure platform for apartment seekers to find rental properties, sign agreements, and communicate with landlords or admins. The platform is also designed for admins to efficiently manage and update apartment listings and agreements.

---

## 🌐 Live URL

- **LivingNest Website:** [https://living-nest-server.vercel.app](https://living-nest-server.vercel.app)

---

## 👤 Admin Credentials

- **Email**: `admin36@gmail.com`  
- **Password**: `Admin36`

---

## 🌐 Client Repository

- 🖥️ **Client Site Repository:** [https://github.com/Programming-Hero-Web-Course4/b10a12-client-side-arman-miaa](https://github.com/Programming-Hero-Web-Course4/b10a12-client-side-arman-miaa)

---

## 🔑 Key Features

- **User Authentication**:  
  - Registration and login functionality with JWT-based authentication.  
  - Google login for quick authentication without needing a password.  
  - JWT token validation for protected routes.

- **Admin Panel**:  
  - Admins can view and manage all members.  
  - Ability to update user status (user/member).  
  - Admins can post announcements.  
  - View all details about apartments, users, and members.

- **Members Dashboard**:  
  - Members can view their payment history.  
  - Access to personal details.

- **Payment Management**:  
  - Members can create payment records.  
  - Track payment details by members and status.

---

## 🛠️ Technologies

- **Node.js**: JavaScript runtime environment for building the backend API.  
- **Express.js**: Web framework for Node.js used to build the API routes.  
- **JWT (JSON Web Tokens)**: Used for user authentication and authorization.  
- **MongoDB**: NoSQL database for storing user, payment, and member data.  
- **Bcrypt.js**: Password hashing library used for securely storing and verifying user passwords.  
- **Google OAuth**: Enables Google login for users to authenticate without a password.  
- **Axios**: For handling HTTP requests between the frontend and backend (used for communication in some parts of the application).  
- **Dotenv**: For managing environment variables (e.g., JWT secret, database URL).

---

## 📦 NPM Packages Used

### Core Dependencies:

- **@stripe/stripe-js**: Stripe payment gateway integration.  
- **cors**: Enables Cross-Origin Resource Sharing.  
- **dotenv**: Securely manages environment variables.  
- **express**: Node.js web framework for API development.  
- **jsonwebtoken**: Handles user authentication and authorization with JWTs.  
- **mongodb**: Interacts with the MongoDB database.  
- **stripe**: Provides access to the Stripe API for payment processing.

---

## 🔑 Setup and Installation

### Prerequisites

- Node.js (>=14.0.0)
- MongoDB (or a MongoDB Atlas account)
- Stripe Account for payment integration

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repository
