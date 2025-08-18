# CivicConnect API Documentation

**Base URL:** `http://localhost:5000`

---
## Authentication

Authentication is a two-step process using email OTPs and JWTs. Authenticated requests must include a JWT in the Authorization header.

* **Header:** `Authorization`
* **Value:** `Bearer <your_jwt_token>`

---
## 1. Health Endpoints

### `GET /api/health`
Performs a deep health check on all critical services.

* **Access:** Public
* **Success Response (`200 OK`):**
    ```json
    {
        "overallStatus": "OK",
        "timestamp": "2025-08-19T01:15:00.000Z",
        "services": [
            { "name": "Database", "status": "OK", "message": "Connected successfully" },
            { "name": "Cloudinary", "status": "OK", "message": "Connected successfully" },
            { "name": "OpenAI", "status": "OK", "message": "API key is valid" },
            { "name": "GoogleVision", "status": "OK", "message": "Client configured" }
        ]
    }
    ```
* **Error Response (`503 Service Unavailable`):**
    ```json
    {
        "overallStatus": "Error",
        "timestamp": "2025-08-19T01:16:00.000Z",
        "services": [
            { "name": "Database", "status": "OK", "message": "Connected successfully" },
            { "name": "Cloudinary", "status": "Error", "message": "Invalid API Key" },
            { "name": "OpenAI", "status": "OK", "message": "API key is valid" },
            { "name": "GoogleVision", "status": "OK", "message": "Client configured" }
        ]
    }
    ```

---
## 2. Authentication Endpoints

### `POST /api/users/register`
Registers a new user in the system.

* **Access:** Public
* **Request Body:**
    ```json
    {
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "password": "password123"
    }
    ```
* **Success Response (`201 Created`):**
    ```json
    {
        "_id": "68a33467bbc1341057d256aa",
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "role": "Citizen",
        "message": "Registration successful. Please log in."
    }
    ```
* **Error Response (`400 Bad Request`):**
    ```json
    { "message": "User already exists" }
    ```

### `POST /api/users/login`
Validates user credentials and sends an OTP to their registered email.

* **Access:** Public
* **Request Body:**
    ```json
    {
      "email": "jane.doe@example.com",
      "password": "password123"
    }
    ```
* **Success Response (`200 OK`):**
    ```json
    { "success": true, "message": "OTP sent to your email" }
    ```
* **Error Response (`401 Unauthorized`):**
    ```json
    { "message": "Invalid email or password" }
    ```

### `POST /api/users/verify-otp`
Verifies the submitted OTP and, if valid, returns a JWT for session authentication.

* **Access:** Public
* **Request Body:**
    ```json
    {
      "email": "jane.doe@example.com",
      "otp": "123456"
    }
    ```
* **Success Response (`200 OK`):**
    ```json
    {
        "message": "Login successful!",
        "_id": "68a33467bbc1341057d256aa",
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
* **Error Response (`400 Bad Request`):**
    ```json
    { "message": "Invalid or expired OTP" }
    ```

---
## 3. Report Endpoints

### `POST /api/reports`
Creates a new civic issue report. The backend AI services automatically analyze the description and image.

* **Access:** Private (Citizen+)
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:** `multipart/form-data`
    * `description` (Text): "A huge pile of garbage has been sitting on the corner of 5th and Main for over a week."
    * `latitude` (Text): "23.4143"
    * `longitude` (Text): "85.4354"
    * `image` (File): (select an image file)
* **Success Response (`201 Created`):** Returns the newly created report object.
* **Error Responses:**
    * `400 Bad Request`: `{ "message": "Description and location are required" }`
    * `400 Bad Request`: `{ "message": "The content violates our community guidelines." }`
    * `409 Conflict`: `{ "message": "This issue may have already been reported...", "duplicateReportId": "..." }`

### `GET /api/reports`
Retrieves a list of all reports, with support for filtering.

* **Access:** Public
* **Request Example:** `/api/reports?status=Pending&category=Waste`
* **Success Response (`200 OK`):** Returns an array of report objects.

### `GET /api/reports/search`
Performs an AI-powered Natural Language Processing (NLP) search on reports.

* **Access:** Public
* **Request Example:** `/api/reports/search?q=unresolved high priority trash problems`
* **Success Response (`200 OK`):** Returns an array of matching report objects.

### `GET /api/reports/myreports`
Retrieves all reports submitted by the currently authenticated user.

* **Access:** Private
* **Headers:** `Authorization: Bearer <token>`
* **Success Response (`200 OK`):** Returns an array of the user's report objects.

### `GET /api/reports/:id`
Retrieves a single report by its unique ID.

* **Access:** Public
* **Request Example:** `/api/reports/68a33467bbc1341057d256bb`
* **Success Response (`200 OK`):** Returns the full report object.
* **Error Response (`404 Not Found`):** `{ "message": "Report not found" }`

### `PUT /api/reports/:id/status`
Updates the status of a specific report.

* **Access:** Private (Authority+)
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
    ```json
    { "status": "In Progress" }
    ```
* **Success Response (`200 OK`):**
    ```json
    { "message": "Report status updated successfully" }
    ```
* **Error Response (`403 Forbidden`):** `{ "message": "User role 'Citizen' is not authorized..." }`

### `POST /api/reports/:id/upvote`
Toggles an upvote on a specific report for the authenticated user.

* **Access:** Private
* **Headers:** `Authorization: Bearer <token>`
* **Success Response (`200 OK`):**
    ```json
    { "message": "Vote updated successfully", "upvotes": 15 }
    ```

---
## 4. Event Endpoints

### `POST /api/events`
Creates a new community event. The backend AI generates an engaging title and description from the `idea`.

* **Access:** Private
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
    ```json
    {
        "idea": "Cleanup drive at the city park next Saturday morning",
        "eventDate": "2025-09-27T09:00:00.000Z",
        "latitude": "23.4143",
        "longitude": "85.4354"
    }
    ```
* **Success Response (`201 Created`):** Returns the new event object with AI-generated details.

### `GET /api/events`
Retrieves a list of all upcoming events.

* **Access:** Public
* **Success Response (`200 OK`):** Returns an array of event objects.

### `GET /api/events/:id`
Retrieves a single event by its unique ID, populating organizer and attendee names.

* **Access:** Public
* **Success Response (`200 OK`):** Returns the full event object.
* **Error Response (`404 Not Found`):** `{ "message": "Event not found" }`

### `POST /api/events/:id/join`
Allows the authenticated user to join an event.

* **Access:** Private
* **Headers:** `Authorization: Bearer <token>`
* **Success Response (`200 OK`):** `{ "message": "Successfully joined event" }`

### `POST /api/events/:id/leave`
Allows the authenticated user to leave an event.

* **Access:** Private
* **Headers:** `Authorization: Bearer <token>`
* **Success Response (`200 OK`):** `{ "message": "Successfully left event" }`

---
## 5. Gamification Endpoints

### `GET /api/leaderboard`
Retrieves the top 10 users ranked by their engagement points.

* **Access:** Public
* **Success Response (`200 OK`):**
    ```json
    [
        {
            "_id": "68a33467bbc1341057d256aa",
            "name": "Jane Doe",
            "points": 152,
            "level": "Civic Champion"
        },
        { "...": "..." }
    ]
    ```

---
## 6. Comments & Notifications

### `POST /api/reports/:reportId/comments`
Adds a comment to a specific report.

* **Access:** Private
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
    ```json
    { "text": "I agree, this has been an issue for a while." }
    ```
* **Success Response (`201 Created`):** Returns the new comment object.

### `GET /api/reports/:reportId/comments`
Retrieves all comments for a specific report.

* **Access:** Public
* **Success Response (`200 OK`):** Returns an array of comment objects.

### `GET /api/notifications`
Retrieves all notifications for the authenticated user.

* **Access:** Private
* **Headers:** `Authorization: Bearer <token>`
* **Success Response (`200 OK`):** Returns an array of notification objects.

### `PUT /api/notifications/read`
Marks all unread notifications for the user as read.

* **Access:** Private
* **Headers:** `Authorization: Bearer <token>`
* **Success Response (`200 OK`):** `{ "message": "Notifications marked as read" }`

---
## 7. WebSocket API (Real-time SOS)

The Distress Call feature uses a WebSocket connection, not standard REST endpoints.

* **Connection:** Connect to the server URL (`http://localhost:5000`) with `userId` in the query.
* **Emitting Events (from Client):**
    * `updateLocation`: ` { userId, latitude, longitude } `
    * `distressCall`: ` { userId, latitude, longitude, message } `
* **Listening for Events (from Server):**
    * `distressAlert`: Receives ` { fromUserId, latitude, longitude, summary, originalMessage } `