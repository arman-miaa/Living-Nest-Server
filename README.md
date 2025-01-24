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

- 🖥️ **Client Site Repository:** [https://github.com/arman-miaa/Living-Nest-](https://github.com/arman-miaa/Living-Nest-)

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
   git clone https://github.com/your-repository-name
   ```

2. Navigate to the project directory:
   ```bash
   cd your-repository-name
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory and add the following variables:
   ```env
   PORT=5000
   MONGO_URI=your-mongodb-uri
   JWT_SECRET=your-jwt-secret
   STRIPE_SECRET_KEY=your-stripe-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

5. Start the development server:
   ```bash
   npm start
   ```

6. The backend will run on `http://localhost:5000` by default.

---

## 📄 API Documentation

### Authentication

- **POST /auth/register**: Register a new user.  
  - Request Body:
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "securepassword"
    }
    ```
  - Response:
    ```json
    {
      "message": "User registered successfully",
      "token": "jwt-token"
    }
    ```

- **POST /auth/login**: Login a user.  
  - Request Body:
    ```json
    {
      "email": "john@example.com",
      "password": "securepassword"
    }
    ```
  - Response:
    ```json
    {
      "message": "Login successful",
      "token": "jwt-token"
    }
    ```

### Members Management

- **GET /members**: Retrieve all members (Admin only).  
- **PATCH /members/:id**: Update a member's status (Admin only).  

### Payment Management

- **POST /payments**: Create a new payment record.  
- **GET /payments**: Retrieve payment history for a user.

### Coupons Management

- **GET /coupons**: Retrieve all coupons.  
- **POST /coupons**: Add a new coupon (Admin only).  
- **PATCH /coupons/:id**: Update coupon availability (Admin only).

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

---



---

## 📞 Contact

For any inquiries, please reach out to:

- **Email**: arman.miaa36@gmail.com
