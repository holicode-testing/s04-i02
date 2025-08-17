# Tech Context: AI-Powered Learning Companion Platform

## Constraints:
- Architecturally flexible, supporting a variety of backend and frontend technologies without mandating a specific stack.
- Initial data persistence should be straightforward, with a clear evolutionary path to more robust and scalable solutions.
- The user interface should be minimal but fully functional, prioritizing core learning and interaction features.
- The system design should anticipate future integration with asynchronous processing mechanisms and high-performance data access layers for enhanced responsiveness, though these are not initial requirements.
- Performance: The platform should demonstrate responsiveness in generating personalized content and feedback. The quality and relevance of AI-generated content (summaries, questions, feedback) are paramount.
- The project should be easily set up and run in common development environments.

## Technologies (Initial Considerations - Flexible):
- **Backend (e.g., Node.js with Express/Koa, Python with FastAPI/Flask, Go with Gin)**: For API services and business logic.
    - **Preferred:** Node.js with NestJS (for structured modular monolith development).
- **Frontend (e.g., React, Vue, Angular, or even vanilla JS)**: For interactive user interfaces.
    - **Preferred:** React (specifically not Next.js).
    - **Component Library:** Shoelace React (lightweight, aesthetic, self-contained).
    - **Styling:** CSS Modules with Sass.
- **Database (e.g., PostgreSQL, SQLite for initial, MongoDB)**: For data persistence. SQLite is a good starting point for simplicity.
    - **Preferred ORM/DB Client:** Prisma (for type-safe database access and migrations).
    - **PostgreSQL Specifics:** Consideration for PostgreSQL with Row-Level Security (RLS) for fine-grained access control and `pgvector` for efficient storage and querying of embeddings.
- **Monorepo Management:** Nx (for managing multiple applications and libraries within a single repository, supporting modular monolith structure).
    - **Monorepo Structure:** Explicitly `api` and `web` apps, with a `shared` lib for types/models.
- **Backend-as-a-Service/Database (Consideration):** Supabase (for managed PostgreSQL, authentication, and real-time capabilities, as an alternative to self-hosting).
    - **User Authentication/Authorization:** Supabase local for auth (for local development), transitioning to Supabase cloud auth for MVP launch and tests.
    - **Queues:** Supabase Queues for future asynchronous needs.
- **AI/ML Integration (e.g., OpenAI API, Hugging Face, custom LLMs)**: Integration with Large Language Models and embedding models.
- **Containerization (e.g., Docker)**: For consistent development and deployment environments.
- **Testing Frameworks (e.g., Jest/Mocha for JS, Pytest for Python)**: For unit, integration, and end-to-end testing.
- **ID Generation:** `nanoid` for general IDs (acknowledging Supabase user IDs require UUIDs).

## Development Environment Setup:
- Use Docker for consistent environment setup.
- Provide clear `README.md` instructions for local development setup.
- Ensure easy setup and execution in common development environments (e.g., VS Code Dev Containers).

## Future Technology Considerations:
- **Message Queues (e.g., Kafka, RabbitMQ)**: For asynchronous processing, content ingestion, and event-driven architecture. (Supabase Queues noted as preferred if needed).
- **Distributed Databases (e.g., Cassandra, DynamoDB)**: For highly scalable and performant data storage.
- **Cloud Platforms (e.g., AWS, Azure, GCP)**: For production deployment and managed services.
- **DevOps/CI/CD:** GitHub Actions (for automated testing, building, and deployment pipelines).
- **Error Tracking:** Sentry (to be introduced at the right moment, not at the very start).
