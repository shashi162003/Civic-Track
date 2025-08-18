# CivicConnect API Documentation

Welcome to the official API documentation for CivicConnect.

**Base URL:** `http://localhost:4000`

---

## Authentication

This API uses a Two-Factor Authentication (2FA) flow with JSON Web Tokens (JWT).

1.  **Login (`/api/users/login`):** A user submits their `email` and `password`. If valid, the server sends a One-Time Password (OTP) to their email.
2.  **Verify OTP (`/api/users/verify-otp`):** The user submits their `email` and the `otp` they received.
3.  **Receive JWT:** If the OTP is valid, the server returns a JWT. The token is also set in a secure, `httpOnly` cookie.
4.  **Authenticated Requests:** For all private routes, the JWT must be included in the `Authorization` header.
    * **Header:** `Authorization`
    * **Value:** `Bearer <your_jwt_token>`

### User Roles

* **Citizen:** Can register, log in, create/view reports, upvote, and comment.
* **Authority:** Can do everything a Citizen can, plus update the status of reports and view analytics.
* **Admin:** Has all permissions.

---

## Endpoints

### 1. Health

#### `GET /api/health`
* **Description:** Performs a deep health check on all critical services (Database, Cloudinary, AI Services).
* **Access:** Public
* **Success Response:** `200 OK` or `503 Service Unavailable` with a detailed status report.

### 2. Authentication

#### `POST /api/users/register`
* **Description:** Registers a new user.
* **Access:** Public
* **Request Body:** `application/json`
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "password": "password123"
    }
    ```
* **Success Response:** `201 Created`
    ```json
    {
      "_id": "60d0fe4f5311236168a109ca",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "Citizen",
      "message": "Registration successful. Please log in."
    }
    ```
* **Error Response:** `400 Bad Request` if fields are missing or user exists.

#### `POST /api/users/login`
* **Description:** First step of 2FA. Validates credentials and sends an OTP to the user's email.
* **Access:** Public
* **Request Body:** `application/json`
    ```json
    {
      "email": "john.doe@example.com",
      "password": "password123"
    }
    ```
* **Success Response:** `200 OK`
    ```json
    {
      "success": true,
      "message": "OTP sent to your email"
    }
    ```
* **Error Response:** `401 Unauthorized` for invalid credentials.

#### `POST /api/users/verify-otp`
* **Description:** Second step of 2FA. Verifies the OTP and returns a JWT.
* **Access:** Public
* **Request Body:** `application/json`
    ```json
    {
      "email": "john.doe@example.com",
      "otp": "123456"
    }
    ```
* **Success Response:** `200 OK`
    ```json
    {
        "message": "Login successful!",
        "_id": "60d0fe4f5311236168a109ca",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "token": "ey..."
    }
    ```
* **Error Response:** `400 Bad Request` for invalid OTP.

### 3. Reports

#### `POST /api/reports`
* **Description:** Creates a new report. AI services automatically analyze the description and image.
* **Access:** Private (Citizen, Authority, Admin)
* **Request Body:** `multipart/form-data`
    * `description` (Text): "There is a huge pothole..."
    * `latitude` (Text): "23.4143"
    * `longitude` (Text): "85.4354"
    * `image` (File): (select an image file)
* **Success Response:** `201 Created` with the new report object.
* **Error Response:** `400 Bad Request` (missing fields, spam), `409 Conflict` (duplicate found).

#### `GET /api/reports`
* **Description:** Gets a list of all reports. Supports filtering and keyword search via query parameters.
* **Access:** Public
* **Query Parameters (Optional):**
    * `status`: (e.g., `Pending`, `Resolved`)
    * `category`: (e.g., `Roads`, `Waste`)
    * `severity`: (e.g., `High`, `Low`)
    * `keyword`: (e.g., `pothole`)
* **Example:** `/api/reports?status=Pending&keyword=garbage`
* **Success Response:** `200 OK` with an array of report objects.

#### `GET /api/reports/search`
* **Description:** Performs an AI-powered Natural Language Processing (NLP) search.
* **Access:** Public
* **Query Parameter:** `q`
* **Example:** `/api/reports/search?q=show me unresolved high priority trash problems`
* **Success Response:** `200 OK` with an array of matching report objects.

#### `GET /api/reports/myreports`
* **Description:** Gets all reports submitted by the currently logged-in user.
* **Access:** Private
* **Success Response:** `200 OK` with an array of the user's report objects.

#### `GET /api/reports/analytics` or `/api/reports/report/analytics`
* **Description:** Gets aggregated analytics data.
* **Access:** Private (Authority, Admin)
* **Success Response:** `200 OK` with an analytics object.
    ```json
    {
      "totalReports": 15,
      "statusCounts": { "Pending": 8, "Resolved": 7 },
      "categoryCounts": { "Roads": 5, "Waste": 10 }
    }
    ```

#### `GET /api/reports/:id`
* **Description:** Gets a single report by its ID.
* **Access:** Public
* **Success Response:** `200 OK` with the report object.
* **Error Response:** `404 Not Found`.

#### `PUT /api/reports/:id/status`
* **Description:** Updates the status of a report.
* **Access:** Private (Authority, Admin)
* **Request Body:** `application/json`
    ```json
    {
      "status": "In Progress"
    }
    ```
* **Success Response:** `200 OK`.

#### `POST /api/reports/:id/upvote`
* **Description:** Toggles an upvote for a report.
* **Access:** Private
* **Success Response:** `200 OK`.

### 4. Comments

#### `POST /api/reports/:reportId/comments`
* **Description:** Adds a new comment to a specific report.
* **Access:** Private
* **Request Body:** `application/json`
    ```json
    {
      "text": "This is a major issue, thanks for reporting."
    }
    ```
* **Success Response:** `201 Created` with the new comment object.

#### `GET /api/reports/:reportId/comments`
* **Description:** Gets all comments for a specific report.
* **Access:** Public
* **Success Response:** `200 OK` with an array of comment objects.

### 5. Notifications

#### `GET /api/notifications`
* **Description:** Gets all notifications for the logged-in user.
* **Access:** Private
* **Success Response:** `200 OK` with an array of notification objects.

#### `PUT /api/notifications/read`
* **Description:** Marks all unread notifications for the logged-in user as read.
* **Access:** Private
* **Success Response:** `200 OK`.