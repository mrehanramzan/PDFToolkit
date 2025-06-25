# DocuCraft - Professional PDF Editor

## Overview

DocuCraft is a full-stack web application designed for professional PDF editing and management. The application provides a comprehensive suite of PDF tools including merging, splitting, compression, editing, and file management capabilities. Built with modern web technologies, it offers a responsive user interface with drag-and-drop functionality and real-time processing feedback.

## System Architecture

The application follows a full-stack architecture with clear separation between client and server components:

- **Frontend**: React-based single-page application (SPA) built with Vite
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **File Storage**: Local file system storage for uploaded PDFs
- **Build System**: Vite for frontend bundling, ESBuild for server compilation

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom PDF editor theme
- **File Handling**: React Dropzone for drag-and-drop uploads
- **PDF Processing**: PDF-lib for client-side PDF manipulation

### Backend Architecture
- **Server**: Express.js with TypeScript
- **File Upload**: Multer middleware for handling multipart/form-data
- **Database**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with PostgreSQL store
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error middleware

### Database Schema
The application uses two main entities:
- **Users**: Basic user authentication and identification
- **PDF Files**: Metadata storage for uploaded PDF documents including file paths, sizes, and timestamps

### File Storage Strategy
- Uploaded files are stored in the local `uploads/` directory
- File metadata is persisted in PostgreSQL
- Original filenames are preserved while using generated unique filenames for storage
- File size validation (100MB limit) and MIME type validation for security

## Data Flow

1. **File Upload**: Users drag/drop or select PDF files through the upload zone
2. **Validation**: Client-side validation for file type and size constraints
3. **Processing**: Files are uploaded to the server via multipart form data
4. **Storage**: Server stores files locally and saves metadata to database
5. **Response**: Client receives confirmation and updates UI state
6. **Management**: Users can view recent files and perform operations on stored PDFs

## External Dependencies

### Production Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL driver for serverless environments
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **drizzle-orm**: Type-safe ORM for database operations
- **multer**: File upload handling middleware
- **pdf-lib**: PDF manipulation library
- **react-dropzone**: File drag-and-drop functionality
- **wouter**: Minimalist routing for React

### Development Dependencies
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for server compilation

## Deployment Strategy

### Development Environment
- Uses Vite development server with HMR (Hot Module Replacement)
- Express server runs in development mode with TypeScript compilation via TSX
- PostgreSQL database connection via environment variables
- File uploads stored in local `uploads/` directory

### Production Build
1. **Frontend**: Vite builds React application to `dist/public`
2. **Backend**: ESBuild compiles TypeScript server to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push` command
4. **Assets**: Static files served from built distribution

### Replit Configuration
- Configured for Node.js 20 runtime environment
- PostgreSQL 16 database provisioning
- Auto-scaling deployment target
- Port 5000 mapped to external port 80
- Parallel workflow execution for development

## Changelog

Changelog:
- June 25, 2025. Initial setup - Created comprehensive PDF editor with React frontend
- June 25, 2025. Updated branding to DocuCraft with premium color theme
- June 25, 2025. Fixed CSS compilation errors and added FontAwesome icons
- June 25, 2025. Implemented dark theme with Poppins font and premium gradient design
- June 25, 2025. Created PDF processing functionality with merge, split, compress, rotate, watermark features
- June 25, 2025. Added PDF editor page with routing and client-side PDF processing using pdf-lib
- June 25, 2025. Enhanced merge PDF functionality with file preview showing page count and size
- June 25, 2025. Implemented split PDF functionality that creates individual page files
- June 25, 2025. Added file reordering, removal, and proper validation across all PDF tools

## User Preferences

Preferred communication style: Simple, everyday language.