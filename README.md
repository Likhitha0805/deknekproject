# IgniteHub 🔥

IgniteHub is a modern, full-stack developer collaboration platform. It allows developers to showcase their projects, find teammates, and manage collaboration requests in a sleek, animated interface.



## 🚀 Features

- **User Authentication:** Secure Login and Registration using **JWT (JSON Web Tokens)** and **BCrypt** password hashing.
- **Project Showcase:** Create, edit, and delete projects with detailed descriptions and tech stacks.
- **Collaboration System:** 
  - Browse projects from other developers.
  - Send "Join Requests" to project owners.
  - Dashboard for owners to **Accept** or **Reject** applications.
- **Modern UI/UX:** Built with a premium "Glassmorphism" aesthetic, vibrant gradients, and smooth CSS animations.
- **Responsive Design:** Fully functional across desktop and mobile devices.

## 🛠️ Tech Stack

### Frontend
- **HTML5 & CSS3:** Custom styling with CSS Variables and Animations.
- **JavaScript (Vanilla):** Modular JS for API interactions and state management.
- **Design:** Modern dark-theme aesthetic with interactive hover effects.

### Backend
- **Java 17:** Core programming language.
- **Spring Boot:** Framework for building the REST API.
- **Spring Security:** For robust authentication and authorization.
- **Spring Data JPA:** For database ORM (Object-Relational Mapping).
- **MySQL:** Relational database for persistent storage.
- **JWT:** Stateless authentication for secure API communication.

---

## ⚙️ Setup & Installation

### Prerequisites
- **Java 17+**
- **Maven 3.6+**
- **MySQL 8.0+**

### 1. Backend Setup
1. Navigate to the `backend` folder.
2. Update `src/main/resources/application.properties` with your MySQL credentials:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/ignitehub_db?createDatabaseIfNotExist=true
   spring.datasource.username=YOUR_USERNAME
   spring.datasource.password=YOUR_PASSWORD
   ```
3. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```

### 2. Frontend Setup
1. Simply open `frontend/index.html` in any modern web browser.
2. (Optional) Use a "Live Server" extension in VS Code for a better development experience.

---

## 🛣️ API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user.
- `POST /api/auth/signin` - Login and receive a JWT.

### Projects
- `GET /api/projects` - List all projects.
- `POST /api/projects` - Create a new project (Requires JWT).
- `DELETE /api/projects/{id}` - Delete a project (Owner only).

### Join Requests
- `POST /api/requests/join/{projectId}` - Request to join a project.
- `GET /api/requests/project/{projectId}` - View requests for a project.
- `PUT /api/requests/{requestId}/status` - Update request status (Accept/Reject).

---



## 🤝 Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📄 License
This project is licensed under the MIT License.

---
*Built with ❤️ for the Developer Community.*
