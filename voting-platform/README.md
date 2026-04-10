# Voting Platform — Technical Interview Challenge

A monorepo containing three fully integrated applications that share a single domain: **a social voting platform** where users can list posts and vote on them.

Your goal is to **fix the BUGs** and **implement the TODOs** in the challenge files. Each file has detailed inline comments explaining what to do. Use the automated test suite to verify your progress.

---

## Tech Stack

| Layer      | Technology                                     |
|------------|------------------------------------------------|
| Backend    | NestJS 10 · Prisma ORM · SQLite · JWT (passport-jwt) |
| Frontend   | React 18 · TypeScript · Vite 5 · Axios         |
| Mobile/Web | Flutter 3 · Bloc (flutter_bloc) · Dio · Equatable |

---

## Directory Structure

```
voting-platform/
├── README.md
├── .gitignore
│
├── backend/                    # REST API — NestJS
│   ├── prisma/
│   │   ├── schema.prisma       # Post + Vote models
│   │   └── seed.ts             # 5 sample posts
│   └── src/
│       ├── main.ts             # Bootstrap + CORS
│       ├── app.module.ts
│       ├── prisma/             # PrismaService (@Global)
│       ├── auth/               # JWT strategy + guard
│       └── posts/
│           ├── posts.controller.ts
│           ├── posts.dto.ts
│           ├── posts.module.ts
│           ├── posts.service.ts          ← CHALLENGE FILE
│           └── posts.service.spec.ts     ← TESTS
│
├── frontend/                   # SPA — React + Vite
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/client.ts       # Axios instance + Bearer interceptor
│       ├── types/post.ts
│       ├── hooks/usePosts.ts
│       ├── components/PostCard.tsx
│       └── pages/
│           ├── PostFeed.tsx              ← CHALLENGE FILE
│           └── PostFeed.test.tsx         ← TESTS
│
└── mobile/                     # Flutter (mobile + web)
    ├── lib/
    │   ├── main.dart
    │   ├── models/
    │   │   └── post.dart                 ← CHALLENGE FILE
    │   ├── repository/
    │   │   └── post_repository.dart
    │   ├── cubit/
    │   │   └── post_cubit.dart           ← CHALLENGE FILE
    │   └── ui/
    │       ├── screens/post_list_screen.dart
    │       └── widgets/post_card.dart
    ├── test/
    │   ├── models/post_test.dart         ← TESTS
    │   └── cubit/post_cubit_test.dart    ← TESTS
    └── web/                              # Flutter web entry point
        └── index.html
```

---

## Prerequisites

- **Node.js** >= 18 and **npm** >= 9
- **Flutter SDK** >= 3.0.0 (with web support enabled)
- A code editor (VS Code, IntelliJ, etc.)
- *(Optional)* Android emulator or physical device for mobile

---

## Getting Started

### 1. Backend (must be running first)

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

The API will be available at **http://localhost:3000**.

#### API Endpoints

| Method | Endpoint            | Auth? | Description                 |
|--------|---------------------|-------|-----------------------------|
| GET    | `/posts`            | No    | List all posts (by votes desc) |
| GET    | `/posts/top`        | No    | Top 10 posts               |
| GET    | `/posts/:id`        | No    | Get a single post          |
| POST   | `/posts`            | No    | Create a new post          |
| POST   | `/posts/:id/vote`   | Yes   | Vote on a post             |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at **http://localhost:5173**. The Vite dev server proxies `/api/*` to `http://localhost:3000/*`, so the backend must be running.

### 3. Mobile (Android / iOS)

```bash
cd mobile
flutter pub get
flutter run
```

The app connects to `http://10.0.2.2:3000` on Android emulator (host localhost alias).

### 3b. Mobile on Web (no emulator required)

If you don't have an Android/iOS emulator available, you can run the Flutter app in Chrome:

```bash
cd mobile
flutter pub get
flutter run -d chrome --web-port=8080
```

When running on web, the app automatically connects to `http://localhost:3000` instead of `10.0.2.2`.

> **Note:** The backend CORS is configured to accept both `http://localhost:5173` (React) and `http://localhost:8080` (Flutter web).

---

## Authentication

A **static demo JWT** is embedded in both clients (frontend and mobile). It is pre-signed with the secret `interview-secret` and carries the payload:

```json
{
  "sub": "demo-user-id",
  "email": "demo@example.com"
}
```

Only `POST /posts/:id/vote` requires the Bearer token. No login screen is needed — the interceptor attaches it automatically. The backend falls back to `JWT_SECRET ?? 'interview-secret'` so it works without an `.env` file.

---

## Challenge Instructions

Each challenge file starts with a header:

```
// CHALLENGE — <Stack> · <filename>
// Fill in the TODOs and fix the BUGs.
```

Look for inline comments marked `// BUG [N]:` and `// TODO [N]:` — they explain the problem and what is expected.

### Challenge Summary

| Project  | Challenge File                  | BUGs | TODOs | What to fix / implement                                         |
|----------|---------------------------------|------|-------|-----------------------------------------------------------------|
| backend  | `src/posts/posts.service.ts`    | 3    | 2     | DI injection, NotFoundException, DB-level ordering, create, vote |
| frontend | `src/pages/PostFeed.tsx`        | 2    | 2     | list key, onVote wiring, optimistic update, debounce            |
| mobile   | `lib/models/post.dart`          | 0    | 1     | `copyWith` method                                               |
| mobile   | `lib/cubit/post_cubit.dart`     | 2    | 1     | immutable state, case-insensitive search, optimistic vote       |

### Detailed Breakdown

#### Backend — `posts.service.ts`

| Tag      | Problem                                                                                 |
|----------|-----------------------------------------------------------------------------------------|
| BUG [1]  | `PrismaClient` instantiated directly instead of injecting `PrismaService` via DI        |
| BUG [2]  | `findOne` throws plain `Error` instead of `NotFoundException` (HTTP 500 vs 404)         |
| BUG [3]  | `getTopPosts` fetches all rows then sorts/slices in memory instead of using `orderBy` + `take` |
| TODO [1] | Implement `create()` — validate fields, set `votes: 0`, persist                        |
| TODO [2] | Implement `vote()` — duplicate check, atomic increment, `$transaction`                  |

#### Frontend — `PostFeed.tsx`

| Tag      | Problem                                                                          |
|----------|----------------------------------------------------------------------------------|
| BUG [1]  | `key={index}` instead of `key={post.id}` in the list `.map()`                   |
| BUG [2]  | `onVote` prop not passed to `<PostCard />` — vote button does nothing            |
| TODO [1] | Implement `handleVote` — optimistic `setPosts`, API call, rollback on error      |
| TODO [2] | Add 300ms debounce to `handleSearch` using `useRef` + `setTimeout`               |

#### Mobile — `post.dart`

| Tag      | Problem                                                          |
|----------|------------------------------------------------------------------|
| TODO [1] | Implement `copyWith` — use `??` to fallback to current values   |

#### Mobile — `post_cubit.dart`

| Tag      | Problem                                                                                         |
|----------|-------------------------------------------------------------------------------------------------|
| BUG [1]  | `PostLoaded` stores a mutable `List<Post>` — must wrap with `List.unmodifiable`                 |
| BUG [2]  | `search()` uses case-sensitive `contains` — must `toLowerCase()` both sides                     |
| TODO [2] | Implement `vote()` — guard state, optimistic emit via `copyWith`, call API, rollback on error   |

---

## Running Tests

Tests validate the **expected final behaviour**. They **fail** until you fix the BUGs and implement the TODOs — use them as your progress indicator.

### Backend

```bash
cd backend
npm test               # single run
npm run test:watch     # watch mode
```

### Frontend

```bash
cd frontend
npm test               # single run
npm run test:watch     # watch mode
```

### Mobile

```bash
cd mobile
flutter test                                   # all tests
flutter test test/models/post_test.dart        # only Post model
flutter test test/cubit/post_cubit_test.dart   # only PostCubit
```

### Expected Results

| Stage                | Backend    | Frontend   | Mobile     |
|----------------------|------------|------------|------------|
| Before any fix       | 0/9 pass   | 0/8 pass   | 0/12 pass  |
| After all fixes      | 9/9 pass   | 8/8 pass   | 12/12 pass |

---

## Useful Commands

```bash
# Generate a new JWT for testing (from the backend directory)
node -e "console.log(require('jsonwebtoken').sign({sub:'demo-user-id',email:'demo@example.com'}, 'interview-secret', {expiresIn:'7d'}))"

# Reset the database
cd backend && npx prisma migrate reset --force

# Prisma Studio (visual DB browser)
cd backend && npx prisma studio

# Check Flutter web support
flutter doctor
flutter config --enable-web
```

---

## Architecture Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│   React SPA  │──────>│              │<──────│  Flutter App     │
│  :5173       │ /api  │   NestJS     │ :3000 │  (mobile / web)  │
└──────────────┘       │   Backend    │       └──────────────────┘
                       │              │
                       │  Prisma ORM  │
                       │  SQLite .db  │
                       └──────────────┘
```

---

Good luck!
