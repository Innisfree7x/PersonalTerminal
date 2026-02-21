# 🔌 API Documentation

Complete reference for all INNIS API endpoints.

---

## Table of Contents

- [Goals API](#goals-api)
- [Career API](#career-api)
- [University API](#university-api)
- [Calendar API](#calendar-api)
- [Dashboard API](#dashboard-api)
- [Daily Tasks API](#daily-tasks-api)
- [Notes API](#notes-api)
- [Error Handling](#error-handling)

---

## Goals API

### GET `/api/goals`

Fetch all goals from the database.

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Learn TypeScript",
    "description": "Complete TypeScript course and build a project",
    "category": "learning",
    "targetDate": "2024-12-31T00:00:00.000Z",
    "metrics": {
      "current": 8,
      "target": 20,
      "unit": "modules"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### POST `/api/goals`

Create a new goal.

**Request Body:**
```json
{
  "title": "Learn TypeScript",
  "description": "Complete TypeScript course and build a project",
  "category": "learning",
  "targetDate": "2024-12-31",
  "metrics": {
    "current": 0,
    "target": 20,
    "unit": "modules"
  }
}
```

**Validation Rules:**
- `title` (required): String, 3-100 characters
- `description` (optional): String
- `category` (required): One of `fitness`, `career`, `learning`, `finance`
- `targetDate` (required): ISO date string
- `metrics` (optional): Object with `current` (number), `target` (number), `unit` (string)

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Learn TypeScript",
  "description": "Complete TypeScript course and build a project",
  "category": "learning",
  "targetDate": "2024-12-31T00:00:00.000Z",
  "metrics": {
    "current": 0,
    "target": 20,
    "unit": "modules"
  },
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error
- `500` - Server error

---

### PATCH `/api/goals/[id]`

Update an existing goal.

**URL Parameters:**
- `id` - Goal UUID

**Request Body (partial update):**
```json
{
  "completed": true
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Learn TypeScript",
  "completed": true,
  "...": "..."
}
```

**Status Codes:**
- `200` - Updated successfully
- `400` - Validation error
- `404` - Goal not found
- `500` - Server error

---

### DELETE `/api/goals/[id]`

Delete a goal permanently.

**URL Parameters:**
- `id` - Goal UUID

**Response:**
```json
{
  "message": "Goal deleted successfully"
}
```

**Status Codes:**
- `200` - Deleted successfully
- `404` - Goal not found
- `500` - Server error

---

## Career API

### GET `/api/applications`

Fetch all job applications.

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "company": "Google",
    "position": "Software Engineer",
    "status": "interview",
    "location": "Mountain View, CA",
    "jobUrl": "https://careers.google.com/...",
    "applicationDate": "2024-01-10T00:00:00.000Z",
    "interviewDate": "2024-01-25T14:00:00.000Z",
    "notes": "Behavioral + coding rounds",
    "createdAt": "2024-01-09T10:00:00.000Z"
  }
]
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### POST `/api/applications`

Create a new job application.

**Request Body:**
```json
{
  "company": "Google",
  "position": "Software Engineer",
  "status": "applied",
  "location": "Mountain View, CA",
  "jobUrl": "https://careers.google.com/...",
  "applicationDate": "2024-01-10",
  "notes": "Applied via LinkedIn"
}
```

**Validation Rules:**
- `company` (required): String, 1-200 characters
- `position` (required): String, 1-200 characters
- `status` (required): One of `applied`, `interview`, `offer`, `rejected`
- `location` (optional): String, max 200 characters
- `jobUrl` (optional): String, valid URL
- `applicationDate` (optional): ISO date string
- `interviewDate` (optional): ISO date string
- `notes` (optional): String, max 2000 characters

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "company": "Google",
  "position": "Software Engineer",
  "status": "applied",
  "...": "..."
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error
- `500` - Server error

---

### PATCH `/api/applications/[id]`

Update an existing application.

**URL Parameters:**
- `id` - Application UUID

**Request Body (partial):**
```json
{
  "status": "interview",
  "interviewDate": "2024-01-25T14:00:00.000Z"
}
```

**Status Codes:**
- `200` - Updated successfully
- `400` - Validation error
- `404` - Application not found
- `500` - Server error

---

### DELETE `/api/applications/[id]`

Delete an application permanently.

**URL Parameters:**
- `id` - Application UUID

**Status Codes:**
- `200` - Deleted successfully
- `404` - Application not found
- `500` - Server error

---

### POST `/api/cv/extract`

Upload a CV file (PDF or DOCX) and extract text content.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: FormData with `file` field

**Request Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/cv/extract', {
  method: 'POST',
  body: formData,
});
```

**Response:**
```json
{
  "text": "John Doe\nSoftware Engineer\n\nExperience:\n- Google: 2020-2023\n...",
  "fileUrl": "https://your-supabase.co/storage/v1/object/public/cv-uploads/uuid.pdf"
}
```

**Status Codes:**
- `200` - Success
- `400` - No file uploaded or unsupported format
- `500` - Upload or extraction failed

**Supported Formats:**
- `.pdf` (via pdf-parse)
- `.doc`, `.docx` (via mammoth)

---

## University API

### GET `/api/courses`

Fetch all courses with their exercise progress.

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Operations Research",
    "ects": 6,
    "numExercises": 12,
    "examDate": "2025-02-15T00:00:00.000Z",
    "semester": "WS 2024/25",
    "createdAt": "2024-10-01T10:00:00.000Z",
    "exercises": [
      {
        "id": "exercise-uuid-1",
        "courseId": "550e8400-e29b-41d4-a716-446655440002",
        "exerciseNumber": 1,
        "completed": true,
        "completedAt": "2024-10-10T15:30:00.000Z",
        "createdAt": "2024-10-01T10:00:00.000Z"
      },
      {
        "id": "exercise-uuid-2",
        "courseId": "550e8400-e29b-41d4-a716-446655440002",
        "exerciseNumber": 2,
        "completed": false,
        "completedAt": null,
        "createdAt": "2024-10-01T10:00:00.000Z"
      }
    ]
  }
]
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### POST `/api/courses`

Create a new course with auto-generated exercise entries.

**Request Body:**
```json
{
  "name": "Operations Research",
  "ects": 6,
  "numExercises": 12,
  "examDate": "2025-02-15",
  "semester": "WS 2024/25"
}
```

**Validation Rules:**
- `name` (required): String, 1-200 characters
- `ects` (required): Integer, 1-15
- `numExercises` (required): Integer, 1-20, defaults to 12
- `examDate` (optional): ISO date string
- `semester` (required): String, defaults to "WS 2024/25"

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Operations Research",
  "ects": 6,
  "numExercises": 12,
  "examDate": "2025-02-15T00:00:00.000Z",
  "semester": "WS 2024/25",
  "exercises": [
    {
      "id": "exercise-uuid-1",
      "exerciseNumber": 1,
      "completed": false,
      "...": "..."
    }
  ]
}
```

**Behavior:**
- Automatically creates `numExercises` entries in `exercise_progress` table
- Each exercise initialized with `completed: false`

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error
- `500` - Server error

---

### GET `/api/courses/[id]`

Fetch a single course with exercises.

**URL Parameters:**
- `id` - Course UUID

**Status Codes:**
- `200` - Success
- `404` - Course not found
- `500` - Server error

---

### PATCH `/api/courses/[id]`

Update course details.

**URL Parameters:**
- `id` - Course UUID

**Request Body (partial):**
```json
{
  "examDate": "2025-03-01"
}
```

**Status Codes:**
- `200` - Updated successfully
- `400` - Validation error
- `404` - Course not found
- `500` - Server error

---

### DELETE `/api/courses/[id]`

Delete a course and all related exercises (CASCADE).

**URL Parameters:**
- `id` - Course UUID

**Status Codes:**
- `200` - Deleted successfully
- `404` - Course not found
- `500` - Server error

---

### PATCH `/api/courses/[id]/exercises/[number]`

Toggle completion status of a specific exercise.

**URL Parameters:**
- `id` - Course UUID
- `number` - Exercise number (1-N)

**Request Body:**
```json
{
  "completed": true
}
```

**Response:**
```json
{
  "id": "exercise-uuid",
  "courseId": "550e8400-e29b-41d4-a716-446655440002",
  "exerciseNumber": 5,
  "completed": true,
  "completedAt": "2024-11-20T10:45:00.000Z"
}
```

**Behavior:**
- Sets `completed` to provided value
- If `completed: true`, sets `completedAt` to current timestamp
- If `completed: false`, sets `completedAt` to `null`

**Status Codes:**
- `200` - Updated successfully
- `400` - Invalid request body
- `404` - Exercise not found
- `500` - Server error

---

## Calendar API

### GET `/api/calendar/today`

Fetch today's Google Calendar events.

**Response:**
```json
[
  {
    "id": "event-id-from-google",
    "summary": "Team Meeting",
    "start": "2024-11-20T14:00:00Z",
    "end": "2024-11-20T15:00:00Z",
    "description": "Weekly sync",
    "location": "Conference Room A"
  }
]
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated with Google
- `500` - Server error

**Requirements:**
- User must be authenticated via `/api/auth/google`
- Google OAuth token stored in session/database

---

### GET `/api/calendar/week`

Fetch this week's Google Calendar events.

**Response:**
```json
[
  {
    "id": "event-id",
    "summary": "Project Deadline",
    "start": "2024-11-25T23:59:59Z",
    "end": "2024-11-25T23:59:59Z"
  }
]
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `500` - Server error

---

### GET `/api/auth/google`

Initiate Google OAuth flow.

**Behavior:**
- Redirects user to Google OAuth consent screen
- Requests `calendar.readonly` scope

**Response:**
- `302` - Redirect to Google

---

### GET `/api/auth/google/callback`

Handle Google OAuth callback.

**Query Parameters:**
- `code` - Authorization code from Google

**Behavior:**
- Exchanges code for access/refresh tokens
- Stores tokens securely
- Redirects to `/calendar`

**Response:**
- `302` - Redirect to `/calendar` (success)
- `400` - Missing authorization code
- `500` - Token exchange failed

---

### POST `/api/auth/google/disconnect`

Disconnect Google Calendar integration.

**Behavior:**
- Removes stored tokens
- Revokes access (optional)

**Response:**
```json
{
  "message": "Disconnected successfully"
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

## Dashboard API

### GET `/api/dashboard/stats`

Fetch aggregated statistics for the dashboard.

**Response:**
```json
{
  "career": {
    "totalApplications": 15,
    "interviews": 5,
    "offers": 2,
    "upcomingInterviews": [
      {
        "id": "app-uuid",
        "company": "Google",
        "position": "SWE",
        "interviewDate": "2024-11-25T14:00:00Z"
      }
    ]
  },
  "goals": {
    "total": 20,
    "completed": 8,
    "thisWeek": 3,
    "overdue": 2,
    "byCategory": {
      "career": { "total": 5, "completed": 2 },
      "learning": { "total": 8, "completed": 4 }
    }
  },
  "study": {
    "totalExercises": 48,
    "completedExercises": 20,
    "thisWeekCompleted": 5,
    "nextExam": {
      "courseName": "Operations Research",
      "daysUntil": 25
    }
  },
  "metrics": {
    "dailyTasksToday": 7,
    "completedToday": 3
  }
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### GET `/api/dashboard/study-tasks`

Fetch prioritized study tasks (incomplete exercises).

**Response:**
```json
[
  {
    "id": "exercise-uuid",
    "courseId": "course-uuid",
    "courseName": "Operations Research",
    "exerciseNumber": 6,
    "examDate": "2025-02-15T00:00:00Z",
    "daysUntilExam": 25,
    "urgency": "important"
  }
]
```

**Urgency Levels:**
- `urgent` - Exam in < 45 days (red)
- `important` - Exam in 45-60 days (yellow)
- `normal` - Exam in > 60 days or no exam (blue)

**Behavior:**
- Returns first incomplete exercise per course
- Sorted by exam date (nearest first, NULL last)
- Limited to 5 tasks

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### GET `/api/dashboard/today`

Fetch prioritized tasks for today's focus.

**Response:**
```json
{
  "goalsDueToday": [
    {
      "id": "goal-uuid",
      "title": "Finish presentation",
      "category": "career"
    }
  ],
  "upcomingInterviews": [
    {
      "id": "app-uuid",
      "company": "Google",
      "position": "SWE",
      "interviewDate": "2024-11-25T14:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

## Daily Tasks API

### GET `/api/daily-tasks`

Fetch daily tasks for a specific date.

**Query Parameters:**
- `date` (optional) - ISO date string (defaults to today)

**Example:**
```
GET /api/daily-tasks?date=2024-11-20
```

**Response:**
```json
[
  {
    "id": "task-uuid",
    "title": "Review PR #123",
    "date": "2024-11-20",
    "completed": false,
    "source": "manual",
    "sourceId": null,
    "timeEstimate": "30m",
    "createdAt": "2024-11-20T08:00:00Z"
  }
]
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### POST `/api/daily-tasks`

Create a new daily task.

**Request Body:**
```json
{
  "title": "Review PR #123",
  "date": "2024-11-20",
  "timeEstimate": "30m",
  "source": "manual"
}
```

**Validation Rules:**
- `title` (required): String, 1-500 characters
- `date` (required): ISO date string
- `completed` (optional): Boolean, defaults to `false`
- `source` (optional): One of `manual`, `goal`, `application`
- `sourceId` (optional): UUID of related entity
- `timeEstimate` (optional): String (e.g., "30m", "1h")

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error
- `500` - Server error

---

### PATCH `/api/daily-tasks/[id]`

Update a daily task.

**URL Parameters:**
- `id` - Task UUID

**Request Body (partial):**
```json
{
  "completed": true
}
```

**Status Codes:**
- `200` - Updated successfully
- `404` - Task not found
- `500` - Server error

---

### DELETE `/api/daily-tasks/[id]`

Delete a daily task.

**URL Parameters:**
- `id` - Task UUID

**Status Codes:**
- `200` - Deleted successfully
- `404` - Task not found
- `500` - Server error

---

## Notes API

### POST `/api/notes`

Create a quick note (placeholder endpoint).

**Request Body:**
```json
{
  "content": "Remember to follow up with recruiter"
}
```

**Status Codes:**
- `201` - Created successfully
- `500` - Server error

> **Note:** Full notes functionality not yet implemented.

---

## Error Handling

All API endpoints follow consistent error response format:

### Error Response Format

```json
{
  "message": "Error description",
  "errors": {
    "field": ["Error detail 1", "Error detail 2"]
  }
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success - Request completed |
| `201` | Created - Resource created successfully |
| `400` | Bad Request - Invalid input or validation error |
| `401` | Unauthorized - Authentication required |
| `404` | Not Found - Resource doesn't exist |
| `500` | Internal Server Error - Server-side failure |

### Validation Errors (400)

Zod validation errors return detailed field-level errors:

```json
{
  "message": "Validation error",
  "errors": {
    "issues": [
      {
        "path": ["title"],
        "message": "String must contain at least 1 character(s)"
      }
    ]
  }
}
```

### Server Errors (500)

Generic server errors return a message:

```json
{
  "message": "Failed to fetch goals"
}
```

---

## Authentication

All API routes are protected with `requireApiAuth()` middleware from `lib/api/auth.ts`. Requests without valid authentication will receive a `401` response.

---

## Rate Limiting

No rate limiting currently implemented. Consider adding for production:
- `express-rate-limit` middleware
- Cloudflare/Vercel edge rate limiting
- Supabase PostgREST rate limits

---

## CORS

Next.js API routes are same-origin by default. For external access, add CORS headers:

```typescript
export async function GET(request: NextRequest) {
  const response = NextResponse.json(data);
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}
```

---

## Testing

### Example API Test (Vitest)

```typescript
import { GET } from '@/app/api/goals/route';

describe('GET /api/goals', () => {
  it('should return all goals', async () => {
    const response = await GET();
    const goals = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(goals)).toBe(true);
  });
});
```

---

## API Versioning

Current version: **v1** (implicit, no `/v1` prefix)

Future versions may use:
- `/api/v2/goals` - URL versioning
- `Accept: application/vnd.api+json;version=2` - Header versioning

---

<div align="center">
  <strong>For more details, see <a href="../README.md">README</a> and <a href="./DATABASE.md">Database Schema</a></strong>
</div>
