<div align="center">
  
# 🗺️ DevAtlas

**Intelligent Codebase Comprehension and Visualization Platform**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen.svg?logo=springboot)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-blue.svg?logo=postgresql)](https://postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg?logo=google)](https://deepmind.google/technologies/gemini/)

DevAtlas is a full-stack, AI-powered developer tool that transforms complex GitHub repositories into interactive, understandable assets. By combining **Retrieval-Augmented Generation (RAG)** with automated diagramming, DevAtlas allows developers to chat with their codebase and visually explore system architecture in real-time.

</div>

---

## 📖 Overview

Onboarding onto new codebases or navigating large monorepos is traditionally time-consuming and cognitively demanding. DevAtlas solves this by creating a highly optimized, semantic index of any given GitHub repository. 

Using **Google Gemini** embeddings and a **pgvector**-enabled database, DevAtlas acts as a senior pair programmer that instantly understands your architectural decisions, data schemas, and control flows.

## ✨ Core Capabilities

- 🧠 **Retrieval-Augmented Generation (RAG) Engine**: Chat naturally with your repository. DevAtlas semantically searches your codebase, retrieves the most relevant file chunks, and feeds them into the LLM context window to generate highly accurate, grounded answers.
- 📐 **Automated System Architecture**: DevAtlas analyzes the structural relationships in your code to automatically generate interactive Mermaid.js diagrams with built-in **zoom, pan, full-screen mode, and PNG exporting**:
  - System Architecture Diagrams (Component groupings via subgraphs)
  - Entity-Relationship (ER) Database Schemas
  - High-Level Data Flow Sequences
  - Detailed Working Flow Logic (Action & Decision Flowcharts)
  - Frontend Component Trees
  - API Endpoint Maps
- 🖱️ **Interactive "Click to Explain" Visualizations**: All AI-generated diagrams are fully interactive. Hover over nodes to see custom SVG tooltips, and click on any component to instantly trigger a contextual RAG search. The platform dynamically slides open a responsive flexbox sidebar containing a grounded explanation of that exact component based on actual codebase chunks.
- ⚡ **Asynchronous Data Pipeline**: Employs robust background task execution to handle cloning, parsing, text chunking, and embedding generation without blocking the main application thread.
- 🎨 **Synchronized Processing UI**: Features a beautiful, state-driven frontend built with Framer Motion. The UI dynamically reflects the exact stage of backend processing (Scanning → Reading → Chunking → Embedding) using meticulously crafted SVG animations.

---

## 🏗️ Technical Architecture

DevAtlas is built on a modern, scalable technology stack designed for performance and AI workload management.

### Backend (Java / Spring Boot)
- **Core**: Spring Boot (Java 21) for robust, enterprise-grade API routing and dependency injection.
- **AI Integration**: **Spring AI** framework to interface with the Google Gemini API (both text generation and text-embedding models).
- **Task Management**: Utilizes `@Async` executors and custom throttling logic to seamlessly process massive codebases while strictly adhering to LLM rate limits (e.g., Gemini's 100 RPM quota).
- **Data Persistence**: **Hibernate / JPA** for relational data, coupled with a customized **PgVectorStore** for storing and querying high-dimensional vector embeddings.

### Frontend (React / Next.js)
- **Framework**: Next.js App Router for optimized routing and server-side rendering capabilities.
- **State Management**: **TanStack React Query** for asynchronous state management, caching, and polling backend status endpoints.
- **Styling & UI**: Tailwind CSS coupled with shadcn/ui components for a sleek, accessible, and highly responsive user interface.
- **Interactive Visualizations**: **Mermaid.js** integrated with `react-zoom-pan-pinch` to provide deep architectural inspection (infinite canvas panning, semantic zooming, and direct PNG exporting).
- **Animation**: **Framer Motion** for building complex, synchronized micro-interactions and progressive loading states.

### Database (Neon DB)
- Serverless PostgreSQL hosting via **Neon DB**.
- Leverages the **pgvector** extension to execute blazing-fast cosine similarity searches across thousands of code chunks in milliseconds.

---

## 🔬 Advanced Engineering Highlights

### 1. Smart Text Chunking & Sanitization
Handling raw code requires extensive sanitization. The ingestion pipeline automatically strips null bytes (`\0`) and invalid UTF-8 characters that traditionally crash PostgreSQL `TEXT` fields. Code files are parsed and split using an overlapping token-window strategy to preserve semantic context across chunk boundaries, ensuring high-quality RAG retrieval.

### 2. Rate-Limit Resilient Ingestion
To prevent API `429 Too Many Requests` errors from LLM providers during massive repository indexing, the backend employs a dynamic throttling and backoff mechanism within the asynchronous embedding loop.

### 3. Real-time State Synchronization
The frontend uses a sophisticated polling mechanism via React Query to monitor the `currentStage` of backend task execution. This state drives a highly customized, Framer Motion-based loading component that visually communicates exactly what the AI is analyzing at any given microsecond.

---

## 🚀 Getting Started

### Prerequisites
- **Java 21**
- **Node.js** (v18+)
- **PostgreSQL Database** (with the `pgvector` extension installed, e.g., Neon DB)
- **Google Gemini API Key**
- **GitHub Personal Access Token**

### 1. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Configure environment variables in an .env file
SPRING_DATASOURCE_URL=jdbc:postgresql://<your-db-url>
SPRING_DATASOURCE_USERNAME=<db-username>
SPRING_DATASOURCE_PASSWORD=<db-password>
SPRING_AI_GEMINI_API_KEY=<your-gemini-api-key>
GITHUB_TOKEN=<your-github-token>

# Compile and run the Spring Boot application
mvn clean install -DskipTests
mvn spring-boot:run
```

### 2. Frontend Setup
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables in .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Start the Next.js development server
npm run dev
```

Visit `http://localhost:3000` in your browser to start exploring your repositories!

---

## 🎯 Future Roadmap

- [ ] **Multi-Agent Architecture**: Separate agents for code review, security scanning, and test generation.
- [ ] **Live Diagram Editor**: Implement a live Mermaid markdown editor next to the visualization canvas for manual user tweaks.
- [ ] **Webhook Integration**: Automatically re-index repositories via GitHub Webhooks on new commits to the `main` branch.

---

<div align="center">
  <i>Designed and engineered as a showcase of modern Full-Stack & AI integration techniques.</i>
</div>
