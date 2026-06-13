# AlgoAG Frontend Redesign Specification

## 1. Codebase Overview

### Project Type & Framework
- **Framework:** React 18 + Inertia.js (server-driven SPA)
- **Backend:** Laravel 12 (PHP 8.2+)
- **Styling:** Tailwind CSS 4 + custom CSS variables
- **State Management:** Inertia.js (server-side state) + React hooks
- **Testing:** Vitest (frontend), PHPUnit (backend), Playwright E2E

### Main Folders & File Structure
```
resources/js/
├── Pages/                      # Inertia page components (one per route)
│   ├── Landing.tsx            # Public landing
│   ├── Home.jsx               # Redirects to /assistant
│   ├── Assistant.tsx          # Main assistant workspace
│   ├── Suggestions.jsx        # Algorithm suggestions
│   ├── Results.jsx            # Benchmark results
│   ├── CodeforcesSolve.jsx   # Problem submission form
│   ├── CodeforcesResult.jsx  # Result with tabs
│   ├── Auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── Patterns/
│   │   ├── Index.jsx          # Topic explorer with filters
│   │   └── Show.jsx           # Topic detail
│   ├── Problems/
│   │   ├── Index.jsx          # Problem bank
│   │   └── Show.jsx           # Problem detail with submission form
│   ├── Courses/
│   │   ├── Index.jsx          # Learning tracks list
│   │   └── Show.jsx           # Course detail
│   ├── Submissions/
│   │   └── Index.jsx          # User submission log
│   └── Admin/
│       └── Problems/
│           └── Index.jsx      # Problem management
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      # Main app wrapper
│   │   ├── AppShell.tsx       # Shell with sidebar
│   │   └── AppSidebar.tsx     # Navigation sidebar
│   ├── assistant/
│   │   ├── AssistantWorkspace.tsx
│   │   ├── AssistantThread.tsx
│   │   ├── AssistantChat.jsx
│   │   ├── WorkspaceHeader.tsx
│   │   ├── QuickModesBar.tsx
│   │   ├── TranscriptComposer.tsx
│   │   └── MessageCard.tsx
│   ├── landing/
│   │   ├── HeroSection.tsx
│   │   ├── FeatureGrid.tsx
│   │   ├── VoiceVisionShowcase.tsx
│   │   ├── HowItWorksTimeline.tsx
│   │   ├── TrustSection.tsx
│   │   └── FinalCTA.tsx
│   ├── ui/
│   │   ├── button.tsx, badge.tsx, input.tsx
│   │   ├── label.tsx, textarea.tsx, dropdown.tsx
│   │   ├── tabs.tsx, skeleton.tsx, etc.
│   └── context/
│       └── ScreenContextPanel.tsx
├── hooks/
│   └── (Custom React hooks for assistant state)
├── lib/
│   ├── ui-locale.tsx          # RTL/locale context
│   └── assistant-workspace.ts # Assistant state logic
└── css/
    └── app.css                # Global styles + CSS variables
```

### Routing Structure
- **Public routes:** `/`, `/patterns`, `/patterns/{id}`, `/login`, `/register`
- **Authenticated routes:** `/assistant`, `/solve`, `/solve/result/{id}`, `/problems`, `/problems/{id}`, `/courses`, `/courses/{id}`, `/submissions`
- **Admin routes:** `/admin/problems`
- **API routes (posts):** `/suggest`, `/benchmark`, `/solve`, `/submissions`, `/assistant/analyze`, `/assistant/sessions`, `/assistant/messages/{id}`

### Existing Pages & Screens (12 total)

| Page | Route | Type | Purpose |
|------|-------|------|---------|
| Landing | `/` | Public | Product showcase, auth CTAs |
| Login | `/login` | Public | Email/password authentication |
| Register | `/register` | Public | Account creation |
| Patterns (Index) | `/patterns` | Authenticated | Topic explorer with search, filters, pagination |
| Patterns (Show) | `/patterns/{id}` | Authenticated | Pattern detail with related problems |
| Problems (Index) | `/problems` | Authenticated | Problem bank with grid layout |
| Problems (Show) | `/problems/{id}` | Authenticated | Problem statement + submission form |
| Courses (Index) | `/courses` | Authenticated | Learning track list |
| Courses (Show) | `/courses/{id}` | Authenticated | Course detail |
| Submissions (Index) | `/submissions` | Authenticated | User submission history |
| Assistant | `/assistant` | Authenticated | Main voice/vision workspace |
| Codeforces Solve | `/solve` | Authenticated | Problem paste + analysis form |
| Codeforces Result | `/solve/result/{id}` | Authenticated | Result with tabs (problem, code, explanation, tests) |
| Admin Problems | `/admin/problems` | Admin | CRUD management |
| Suggestions | (via session) | Authenticated | Algorithm suggestions (intermediate flow) |
| Results | (via session) | Authenticated | Benchmark comparison (intermediate flow) |

---

## 2. Existing Page Inventory

### Landing Page (`/`)
- **Purpose:** Showcase product, drive signups/login
- **Main sections:** 
  - Header with nav links + auth buttons
  - Hero section
  - Voice + Vision showcase
  - Feature grid
  - How it works timeline
  - Trust section
  - Final CTA
  - Footer
- **Components used:** HeroSection, FeatureGrid, VoiceVisionShowcase, HowItWorksTimeline, TrustSection, FinalCTA
- **User actions:** Click auth links, scroll, watch animations
- **Entry points:** Direct URL, redirect from home
- **Exit points:** Login, Register, Open Assistant (if authenticated)

### Authentication Pages (`/login`, `/register`)
- **Purpose:** User authentication
- **Sections:** Auth form, branding, features highlight (register only)
- **Components:** Input, Label, Button, Badge
- **Data:** Email, password, name (register), password confirmation (register)
- **Validation:** Email format, password match, required fields
- **User actions:** Enter credentials, submit, toggle password visibility
- **Success:** Redirect to `/assistant`
- **Failure:** Display error message
- **Special:** Register has left panel with feature highlights (desktop only)

### Patterns Index (`/patterns`)
- **Purpose:** Browse & search algorithm topics/patterns
- **Sections:**
  - AppLayout header (with badge, title, actions)
  - Filter bar: search input, status dropdown, tag dropdown
  - Pattern grid (responsive 1-2 columns)
  - Pagination
- **Components:** AppLayout, Input, Badge, Button, Link
- **Data displayed:** Pattern name, pattern ID, related techniques, tags
- **Empty state:** "No patterns yet"
- **Loading state:** Skeleton grid
- **Filters:** Search (debounced 350ms), status, tags, pagination
- **User actions:** Type search, select filters, click cards, paginate
- **Related pages:** Pattern Show, Assistant, Problems

### Patterns Show (`/patterns/{id}`)
- **Purpose:** Deep dive into a single pattern/topic
- **Sections:**
  - AppLayout header (with badge, title, description)
  - Pattern overview card
  - Summary section
  - When to use
  - When not to use / anti-patterns
  - Common statement signals
  - Related techniques list
  - Related patterns grid (if any)
  - Representative problems grid (if any)
- **Components:** AppLayout, Section (custom), Badge, Button, Link
- **Data:** Pattern ID, titles (AR/EN), summaries, techniques, related patterns, problems
- **Empty state:** For sections with no data, hide them
- **User actions:** Read content, click related patterns, click problems, Ask Assistant link
- **Mobile:** Stack sections vertically

### Problems Index (`/problems`)
- **Purpose:** Browse problems you can train on
- **Sections:**
  - AppLayout header
  - Problem grid (2 columns on desktop)
- **Components:** AppLayout, Badge, Button, Link
- **Data:** Problem title, difficulty, tags
- **Empty state:** "No problems yet"
- **User actions:** Click cards to view detail, use quick actions
- **Related:** Problem Show, Patterns, Assistant
- **Mobile:** Single column

### Problems Show (`/problems/{id}`)
- **Purpose:** View problem statement and submit solution
- **Sections:**
  - AppLayout header
  - Problem metadata badges (difficulty, time limit, memory limit)
  - Problem statement (pre-formatted text)
  - Submission form section:
    - Language select (C++, Python)
    - Code textarea
    - Submit button
- **Components:** AppLayout, Badge, Button, Textarea, Select, Link
- **Data:** Title, statement, limits, tags
- **Form validation:** Code required, length validation
- **User actions:** Read statement, select language, paste code, submit
- **Success message:** "Submission received"
- **Related:** Problems Index, Assistant, Submissions
- **Mobile:** Stack form below statement

### Courses Index (`/courses`)
- **Purpose:** View organized learning tracks
- **Sections:**
  - AppLayout header
  - Course grid (2 columns)
- **Components:** AppLayout, Button, Link
- **Data:** Course title, description
- **Empty state:** "No learning tracks yet"
- **User actions:** Click cards to view course
- **Mobile:** Single column

### Courses Show (`/courses/{id}`)
- **Purpose:** View course detail and lessons
- **Sections:** (Inferred from patterns)
  - AppLayout header
  - Course overview
  - Lessons/modules list
- **User actions:** Navigate lessons, access problems from course
- **Related:** Courses Index, Problems

### Submissions Index (`/submissions`)
- **Purpose:** View your submission history and verdicts
- **Sections:**
  - AppLayout header
  - Flash message (if any)
  - Submissions list (vertical stack)
- **Components:** AppLayout, Badge, Link, Button
- **Data:** Problem title, language, verdict, created_at, linked problem
- **Empty state:** "No submissions yet"
- **User actions:** Click to view linked problem, review verdict
- **Mobile:** Stack cards vertically

### Assistant Workspace (`/assistant`)
- **Purpose:** Main AI coaching interface with voice/vision
- **Sections:**
  - WorkspaceHeader (with mode selector, session info)
  - QuickModesBar (11+ analysis modes)
  - ScreenContextPanel (display current screen capture)
  - AssistantThread (chat messages)
  - TranscriptComposer (input area: text, voice, screen capture)
  - Status indicators
- **Components:** AssistantWorkspace, WorkspaceHeader, QuickModesBar, AssistantThread, TranscriptComposer, ScreenContextPanel
- **Data:** Messages (role, content, audioUrl), current partial text, mode, transcript, language, session ID
- **States:** Recording, processing, streaming, error, idle
- **WebSocket:** Broadcasts updates via Laravel Reverb
- **User actions:** Record audio, capture screen, type text, submit, cancel, switch modes
- **Mobile:** Stack elements vertically, hide some details

### Codeforces Solve (`/solve`)
- **Purpose:** Paste problem statement, request AI analysis and code generation
- **Sections:**
  - AppLayout header
  - Warning if Ollama not available
  - Form:
    - Textarea for full problem statement
    - Language select (C++, Python)
    - Submit button
  - Recent solutions list (if any)
- **Components:** AppLayout, Textarea, Select, Button, Badge, Link
- **Data:** Problem text, language, recent solutions
- **Validation:** Problem text required, Ollama available
- **User actions:** Paste problem, select language, submit
- **Success:** Redirect to `/solve/result/{id}`
- **Mobile:** Single column, large textarea

### Codeforces Result (`/solve/result/{id}`)
- **Purpose:** View parsed problem, generated code, tests, explanation
- **Sections:**
  - AppLayout header
  - Status indicator (processing/completed/failed)
  - Tab navigation:
    - Problem (parsed problem statement)
    - Code (generated solution)
    - Explanation (AI explanation)
    - Tests (illustrative tests)
    - Judge (stub mode message)
    - Algorithm & optimizations
  - New problem button
- **Components:** AppLayout, Button, Tabs, Badge, Code block, Link
- **Polling:** Status polling via `/solve/result/{id}/status` endpoint + WebSocket broadcast
- **WebSocket:** Listens to `codeforces-solutions.{userId}` channel
- **User actions:** Switch tabs, refresh, start new problem
- **Mobile:** Stack tabs vertically, wrap content

### Admin Problems Index (`/admin/problems`)
- **Purpose:** Manage problems (create, edit, delete)
- **Sections:**
  - Header with "New Problem" link
  - Flash messages
  - Problems list (rows with edit/delete buttons)
- **Components:** Link, Button, Form
- **Data:** Problem title, slug, difficulty, ID
- **User actions:** Click Edit/Delete, create new, confirm delete
- **Mobile:** Stack buttons vertically

### Suggestions (intermediate flow)
- **Purpose:** Display algorithm suggestions for a problem
- **Sections:**
  - Problem statement
  - Suggested algorithms list (with complexity, description, when best)
  - Benchmark button
- **Data:** Problem, suggestions array (name, complexity, description, when_best)

### Results (intermediate flow)
- **Purpose:** Display benchmark comparison
- **Sections:**
  - Problem statement
  - Performance table (algorithm, time, memory, size)
  - Recommendation section (if available)
  - Link back to assistant

---

## 3. Page-by-Page Frontend Specification

### Page: Landing
**Route:** `/`  
**Goal:** Showcase product value, drive signups/login  
**User Type:** Unauthenticated (public)  
**Layout Type:** Hero + sections + footer  

#### Sections:

##### Header/Navigation
- **Purpose:** Brand + navigation + auth buttons
- **Content:** ALGOAG logo, nav links (Experience, Features, How it works, Trust), auth buttons
- **Desktop:** Sticky top, flex row with nav in center
- **Tablet:** Sticky top, nav hidden, hamburger menu
- **Mobile:** Sticky top, nav hidden, hamburger menu, buttons stack
- **Hover states:** Links underline, buttons change color
- **States:** Authenticated/unauthenticated (different buttons)

##### Hero Section
- **Purpose:** Lead with value proposition
- **Content:** Main headline, subheadline, CTA buttons, background animation
- **Components:** Framer Motion animations, gradient background, typography
- **Desktop:** Large headline (3xl-4xl), 2-column (text + visual if applicable)
- **Tablet:** Medium headline, centered
- **Mobile:** Small headline, centered, single column
- **Animation:** Fade in, subtle scale on scroll (respects prefers-reduced-motion)

##### Voice + Vision Showcase
- **Purpose:** Demonstrate core features
- **Content:** Screenshots/mockups of voice recording and screen capture
- **Components:** Image carousel, captions
- **Desktop:** 2-column layout with alternating content
- **Mobile:** Single column, stacked

##### Feature Grid
- **Purpose:** Highlight key capabilities
- **Content:** Feature cards (icon + title + description)
- **Components:** Card grid (1-3 columns)
- **Desktop:** 3-4 columns
- **Tablet:** 2 columns
- **Mobile:** 1 column

##### How It Works Timeline
- **Purpose:** Show workflow step-by-step
- **Content:** Timeline with steps
- **Components:** Vertical timeline on mobile, horizontal on desktop
- **Desktop:** Horizontal timeline with cards
- **Mobile:** Vertical timeline with smaller cards

##### Trust Section
- **Purpose:** Build credibility
- **Content:** Social proof, metrics, testimonials
- **Components:** Stats cards, testimonial carousel
- **Desktop:** Grid layout
- **Mobile:** Stacked cards

##### Final CTA Section
- **Purpose:** Last conversion opportunity
- **Content:** Headline, subheadline, large CTA button, secondary link
- **Desktop:** Centered, large button
- **Mobile:** Centered, full-width button

##### Footer
- **Purpose:** Secondary navigation, links
- **Content:** Copyright, back-to-top link, assistant link
- **Desktop:** Flex row, centered
- **Mobile:** Stacked

---

### Page: Register
**Route:** `/register`  
**Goal:** Create new user account  
**User Type:** Guest  
**Layout Type:** Split (desktop) / Single (mobile)  

#### Sections:

##### Left Panel (Desktop Only)
- **Purpose:** Show product benefits
- **Content:** Logo, brand name, headline, benefits list, gradient background + decorative elements
- **Hidden on:** Mobile, tablet
- **Components:** Badge, List, Icon component, Gradient overlays
- **Styling:** Background gradient, circular blur elements at corners

##### Registration Form Container
- **Purpose:** Account creation form
- **Content:**
  - Badge (product identifier)
  - Headline ("Create account")
  - Form fields (Name, Email, Password, Confirm Password)
  - Submit button
- **Form Fields:**
  - Name: text input, label, required, validation (non-empty)
  - Email: email input, label, required, validation (email format)
  - Password: password input, label, required, validation (min 8 chars)
  - Password Confirmation: password input, label, required, must match
- **Validation:** Real-time error display, error messages in red
- **Submit button:** Primary variant (lavender/cyan), disabled if form invalid or submitting
- **After submit:** Redirect to `/assistant` on success
- **Desktop:** Max-width 400px, centered in right half
- **Mobile:** Full width with padding, centered

##### Links
- **Login link:** Link at bottom (if already registered)
- **Back link:** Logo/brand name links to home

---

### Page: Login
**Route:** `/login`  
**Goal:** Authenticate user  
**User Type:** Guest  
**Layout Type:** Centered form  

#### Sections:

##### Login Form
- **Purpose:** Email + password authentication
- **Content:**
  - Headline ("Log in")
  - Email input (label, required, validation)
  - Password input (label, required)
  - "Remember me" checkbox (optional)
  - Submit button
  - Link to register
- **Validation:** Real-time error messages
- **Submit:** POST to `/login`
- **Success:** Redirect to `/assistant` (redirected from `/dashboard`)
- **Failure:** Display error message (invalid credentials)
- **Desktop:** Centered, max-width 400px
- **Mobile:** Full width with padding

---

### Page: Patterns Index
**Route:** `/patterns`  
**Goal:** Browse and search algorithm patterns/topics  
**User Type:** Authenticated  
**Layout Type:** Grid with sidebar filters  

#### Sections:

##### AppLayout Header
- **Purpose:** Page title, description, quick actions
- **Content:** Badge ("Topic explorer"), title, description, action buttons (Open Assistant, Go to Problems)
- **Desktop:** Flex row, title on left, actions on right
- **Mobile:** Stack vertically, center align

##### Filter Bar
- **Purpose:** Search and filter patterns
- **Content:**
  - Search input (debounced 350ms)
  - Status dropdown
  - Tag dropdown
- **Desktop:** Grid layout (search spans, dropdowns side-by-side)
- **Mobile:** Stack vertically, full width

##### Patterns Grid
- **Purpose:** Display pattern cards
- **Content:** Pattern cards (title, ID, tags if any)
- **Card styling:** Border, hover state (border-strong), rounded
- **Desktop:** 2 columns
- **Tablet:** 2 columns
- **Mobile:** 1 column
- **Empty state:** "No patterns yet" centered message

##### Pagination
- **Purpose:** Navigate pages
- **Content:** Previous/Next buttons, page number display
- **Desktop:** Flex row, centered
- **Mobile:** Stacked buttons

---

### Page: Patterns Show
**Route:** `/patterns/{id}`  
**Goal:** Learn about a specific pattern/topic  
**User Type:** Authenticated  
**Layout Type:** Vertical sections  

#### Sections:

##### AppLayout Header
- **Purpose:** Pattern title + actions
- **Content:** Badge, title (AR + EN), description, actions (Ask Assistant, All Topics)
- **Desktop:** Title on left, actions on right
- **Mobile:** Stack vertically

##### Pattern Overview Card
- **Purpose:** Key metadata
- **Content:** Pattern ID, titles (bilingual), summary
- **Styling:** Border, padding, rounded corners

##### Content Sections (Dynamic)
- **Purpose:** Pattern details
- **Sections visible if content exists:**
  - Summary
  - When to use
  - When not to use / Anti-patterns
  - Common statement signals
  - Related techniques (bulleted list)
- **Styling:** Each section is a card with title, border, padding
- **Desktop:** Full width, stacked
- **Mobile:** Full width, stacked

##### Related Patterns Section
- **Purpose:** Links to related patterns
- **Content:** Grid of pattern cards (preview cards with title, ID)
- **Desktop:** 2 columns
- **Mobile:** 1 column
- **Hidden if:** No related patterns

##### Representative Problems Section
- **Purpose:** Example problems for this pattern
- **Content:** Grid of problem cards (link to problem page)
- **Desktop:** 2 columns
- **Mobile:** 1 column
- **Hidden if:** No representative problems

---

### Page: Problems Index
**Route:** `/problems`  
**Goal:** Browse trainable problems  
**User Type:** Authenticated  
**Layout Type:** Grid  

#### Sections:

##### AppLayout Header
- **Purpose:** Page title, description, actions
- **Content:** Badge ("Problem bank"), title, description, action buttons
- **Desktop:** Title + description on left, actions on right
- **Mobile:** Stack vertically

##### Problems Grid
- **Purpose:** Display problem cards
- **Content:** Problem title, difficulty badge, tags
- **Card styling:** Border, hover state, rounded
- **Desktop:** 2 columns
- **Tablet:** 2 columns
- **Mobile:** 1 column
- **Hover:** Border becomes stronger, background slightly brighter
- **Click:** Navigate to `/problems/{id}`
- **Empty state:** "No problems yet" message with explanation

---

### Page: Problems Show
**Route:** `/problems/{id}`  
**Goal:** View problem statement and submit solution  
**User Type:** Authenticated  
**Layout Type:** Vertical sections  

#### Sections:

##### AppLayout Header
- **Purpose:** Problem title + actions
- **Content:** Badge ("Problem detail"), title, description, action buttons
- **Desktop:** Title on left, actions on right
- **Mobile:** Stack vertically

##### Problem Metadata
- **Purpose:** Display limits and difficulty
- **Content:** Badges showing difficulty, time limit (ms), memory limit (MB)
- **Display:** Flex row of badges, wrapped
- **Mobile:** Wrap to multiple lines

##### Problem Statement
- **Purpose:** Show problem text (read-only)
- **Content:** Formatted text (monospace, pre-wrap), border card
- **Styling:** bg-slate-950/45, border, rounded, large padding
- **Desktop:** Full width
- **Mobile:** Full width, smaller padding

##### Submission Form Section
- **Purpose:** Submit code solution
- **Content:**
  - Section title ("Submit a solution")
  - Note about submission scope (stub verification)
  - Form fields:
    - Language dropdown (C++, Python)
    - Code textarea (rows: 12, monospace font)
    - Submit button (Submit solution)
- **Validation:** Code required (non-empty), validation errors displayed
- **Submit:** POST to `/submissions`
- **Success:** Show success message, redirect or reload
- **Loading state:** Button shows "Submitting...", disabled
- **Desktop:** Full width form card
- **Mobile:** Full width form, stacked fields

---

### Page: Courses Index
**Route:** `/courses`  
**Goal:** View learning tracks/courses  
**User Type:** Authenticated  
**Layout Type:** Grid  

#### Sections:

##### AppLayout Header
- **Purpose:** Page title, description, action
- **Content:** Badge ("Learning tracks"), title, description, action button

##### Courses Grid
- **Purpose:** Display course cards
- **Content:** Course title, description
- **Card styling:** Border, hover effect, rounded
- **Desktop:** 2 columns
- **Mobile:** 1 column
- **Empty state:** "No learning tracks yet"

---

### Page: Submissions Index
**Route:** `/submissions`  
**Goal:** View submission history  
**User Type:** Authenticated  
**Layout Type:** Vertical list  

#### Sections:

##### AppLayout Header
- **Purpose:** Page title, description, action
- **Content:** Badge ("Practice log"), title, description, action button (Go to Problems)

##### Flash Message (if any)
- **Purpose:** Success/info message
- **Styling:** Green background, border, rounded
- **Display:** Above submissions list

##### Submissions List
- **Purpose:** Show all submissions
- **Content:** Each submission card shows:
  - Created date (small, muted)
  - Problem title (linked to problem page)
  - Language + verdict badge
- **Card styling:** Border, padding, rounded
- **Desktop:** Full width
- **Mobile:** Full width
- **Empty state:** "No submissions yet" message

---

### Page: Assistant (Main Workspace)
**Route:** `/assistant`  
**Goal:** AI-assisted coding problem solving with voice/vision  
**User Type:** Authenticated  
**Layout Type:** Complex multi-panel  

#### Sections:

##### WorkspaceHeader
- **Purpose:** Status, session info, mode selector
- **Content:**
  - Mode selector (current active mode highlighted)
  - Session ID display
  - Status indicator with mode meta info
  - Polling status indicator (if using polling)
  - Status dots and animation
- **Desktop:** Full width sticky header
- **Mobile:** Horizontal scroll for modes

##### QuickModesBar
- **Purpose:** Mode shortcuts (11+ analysis modes)
- **Content:** Mode buttons/tabs with icons
- **Modes:** (Examples: Ask, Code review, Hint, etc.)
- **Active state:** Highlighted, underline or background
- **Disabled during:** Processing/streaming
- **Desktop:** Horizontal bar, full width
- **Mobile:** Horizontal scroll, truncate overflow

##### ScreenContextPanel
- **Purpose:** Display current screen capture (if any)
- **Content:** Captured image or placeholder
- **Desktop:** Side panel (right) or modal
- **Mobile:** Below main content or modal
- **Actions:** Refresh capture, clear capture

##### AssistantThread (Chat Messages)
- **Purpose:** Show conversation history
- **Content:** Messages from user and assistant
- **Message card styling:**
  - User message: bg-slate-800/50, border-slate-700, right-aligned (maybe)
  - Assistant message: bg-emerald-900/20, border-emerald-700/30, left-aligned
- **Message content:**
  - Role indicator (You / Assistant) with icon/badge
  - Mode indicator (small badge if applicable)
  - Message text (whitespace-pre-wrap for formatting)
  - Audio player (if audioUrl exists)
- **Current partial text:** Animated streaming indicator, same card style as assistant
- **Empty state:** "No messages yet — share your screen and type your idea to start"
- **Desktop:** Full height scrollable area
- **Mobile:** Full width scrollable, smaller font

##### TranscriptComposer (Input Area)
- **Purpose:** Capture user input (text, audio, screen)
- **Content:**
  - Record audio button (with visual feedback: recording state)
  - Capture screen button
  - Transcript textarea (editable)
  - Language selector (dropdown)
  - Submit button (or keyboard shortcut)
  - Cancel button (when recording/processing)
- **State indicators:**
  - Recording: Red indicator, pulsing animation
  - Processing: Spinner, disabled submit
  - Error: Red text, error message
- **Desktop:** Sticky bottom, full width
- **Mobile:** Full width, stack elements vertically

##### Status Indicators
- **Purpose:** Show async operation status
- **Content:** Last run timestamp, current operation status
- **Polling indicator:** If using polling instead of WebSocket
- **Desktop:** Visible in header
- **Mobile:** Hidden or minimal display

#### Data Displayed:
- Messages (id, role, content, audioUrl, mode)
- Current partial text (for streaming)
- Transcript (user input)
- Session ID
- Mode
- Language
- Recording state
- Busy state
- Captured frame state
- Audio blob state
- Submit error (if any)
- Recent events (for debugging/logging)

#### Loading States:
- **Recording:** Pulsing red button, transcript area locked
- **Processing:** Spinner in submit button, disabled input
- **Streaming:** Animated cursor in message, new messages appearing

#### Error States:
- **Submit error:** Red error text above submit button
- **Recording error:** Error message below record button
- **Frame capture error:** Error message in context panel
- **Fallback mode:** Warning indicator if WebSocket unavailable

#### States:
1. **Idle:** Ready for input
2. **Recording:** Audio capture active
3. **Processing:** Submitting request
4. **Streaming:** Receiving response from AI
5. **Error:** Display error with retry option
6. **Fallback:** Using polling instead of WebSocket

#### Mobile Behavior:
- Stack all sections vertically
- Reduce font sizes
- Collapse header details
- Context panel below chat or in modal
- Transcript composer full width
- Horizontal scroll for mode bar

#### Desktop Behavior:
- Sidebar with navigation (AppSidebar)
- Main content area (chat)
- Right panel (context, if space available)
- Sticky header and footer
- 2-column or 3-column layout possible

---

### Page: Codeforces Solve
**Route:** `/solve`  
**Goal:** Paste and analyze Codeforces problems  
**User Type:** Authenticated  
**Layout Type:** Single-column form  

#### Sections:

##### AppLayout Header
- **Purpose:** Page title, description, action
- **Content:** Badge ("Codeforces"), title, description, action button (Go to Assistant)

##### Ollama Warning (conditional)
- **Purpose:** Show when Ollama not available
- **Content:** Alert message with instructions to start Ollama
- **Styling:** Amber background, border, rounded
- **Display:** Above form

##### Problem Submission Form
- **Purpose:** Input and submit problem statement
- **Content:**
  - Label: "Full problem statement"
  - Textarea: rows=14, monospace font, placeholder
  - Language dropdown (C++, Python)
  - Validation error messages
  - Submit button ("Solve the problem", disabled if Ollama unavailable)
- **Textarea:** 
  - Border, rounded corners
  - Focus state: border becomes stronger
  - Placeholder: "Paste the full statement here..."
  - Monospace font
- **Submit button:**
  - Variant: lavender or primary
  - Disabled if: no problem text, not processing, Ollama unavailable
  - Loading state: "Solving... (can take minutes)"
- **Desktop:** Max-width 5xl, centered, full width on mobile
- **Mobile:** Full width, smaller textarea

##### Recent Solutions Section (if any)
- **Purpose:** Show previous solution attempts
- **Content:** List of recent solutions with:
  - Created date (small, muted)
  - Problem preview (truncated)
  - Status badge (Completed/Failed/Processing)
- **Link:** Click to view `/solve/result/{id}`
- **Styling:** Card-based list, border, rounded
- **Empty state:** Hidden if no recent solutions
- **Desktop:** Full width
- **Mobile:** Full width, single column

---

### Page: Codeforces Result
**Route:** `/solve/result/{id}`  
**Goal:** View analyzed problem, generated code, tests, explanation  
**User Type:** Authenticated  
**Layout Type:** Tabbed interface  

#### Sections:

##### AppLayout Header
- **Purpose:** Page title, description, action
- **Content:** Badge, title, description, action button (New Problem)

##### Status Indicator (conditional)
- **Purpose:** Show processing/error status
- **Content:**
  - If processing: "Processing..." message with spinner
  - If failed: Error message with details
  - If completed: Success indicator (hidden)
- **Styling:** Sky blue border for processing, red for failed
- **Display:** Alert card above tabs

##### Tab Navigation
- **Purpose:** Switch between content sections
- **Tabs:**
  1. Problem (المسألة)
  2. Code (الحل)
  3. Explanation (الشرح)
  4. Tests (الاختبارات)
  5. Judge (الحكم - stub mode message)
  6. Algorithm (الخوارزمية والتطويرات)
- **Tab styling:**
  - Active tab: underline or background highlight
  - Inactive: muted text
  - RTL: Tab labels in Arabic, order reversed
- **Desktop:** Horizontal tabs
- **Mobile:** Horizontal scroll tabs or dropdown

##### Tab Contents:

**Problem Tab:**
- **Content:** Parsed problem statement (structured format)
- **Styling:** Monospace for input/output, readable formatting
- **Desktop:** Full width
- **Mobile:** Full width, scrollable code blocks

**Code Tab:**
- **Content:** Generated solution code (syntax highlighted)
- **Code block:**
  - Syntax highlighting (language-specific)
  - Line numbers
  - Copy button
  - Language badge
- **Desktop:** Full width, scrollable
- **Mobile:** Full width, horizontal scroll for code

**Explanation Tab:**
- **Content:** AI-generated explanation of the algorithm
- **Styling:** Formatted text, possibly with code snippets
- **Desktop:** Full width, readable line length
- **Mobile:** Full width, readable on small screens

**Tests Tab:**
- **Content:** Generated test cases and results
- **Test case display:**
  - Input (formatted, code block)
  - Expected output (code block)
  - Actual output (if executed)
  - Result badge (Pass/Fail)
- **Desktop:** Stacked test cases
- **Mobile:** Stacked, scrollable

**Judge Tab:**
- **Content:** Message explaining stub mode
- **Message:** "Final judging is still in stub mode"
- **Desktop/Mobile:** Centered message

**Algorithm Tab:**
- **Content:** Algorithm details and optimizations
- **Styling:** Formatted text with code snippets
- **Desktop:** Full width
- **Mobile:** Full width

##### Polling Status (conditional)
- **Purpose:** Show polling activity
- **Content:** Indicator showing polling is active (if WebSocket unavailable)
- **Desktop:** In header or indicator
- **Mobile:** Minimal or hidden

##### New Problem Button
- **Purpose:** Start analyzing another problem
- **Styling:** Primary button, centered or in footer
- **Action:** Navigate to `/solve`
- **Desktop:** Below tabs
- **Mobile:** Sticky footer or below content

#### Data Displayed:
- Solution object with:
  - id
  - status (pending, processing, completed, failed)
  - parsed_problem (structured problem data)
  - generated_code
  - explanation
  - generated_tests (array of test objects)
  - error_message (if failed)
- Status polling URL
- Auth user ID (for WebSocket channel name)

#### States:
1. **Pending:** Initial state, show spinner
2. **Processing:** Show "Processing..." alert, periodic polling
3. **Completed:** Show all tabs with content
4. **Failed:** Show error message, retry option

#### WebSocket Integration:
- Listen to `codeforces-solutions.{userId}` channel
- On `.solution.status` event with status=completed/failed, reload page

#### Polling Integration:
- If WebSocket unavailable, poll `/solve/result/{id}/status` every 2.5s
- Reload page when status changes to completed/failed

#### Mobile Behavior:
- Tabs dropdown or horizontal scroll
- Content stacks vertically
- Code blocks horizontally scrollable
- Smaller font sizes
- Full-width containers

#### Desktop Behavior:
- Horizontal tabs
- Side-by-side layout if space available
- Syntax highlighting in code blocks
- Larger font sizes
- Max-width containers for readability

---

## 4. Component Specification

### UI Components (from `ui/` folder)

#### Button
**Purpose:** Clickable action triggers  
**Props:**
- variant: 'primary' | 'secondary' | 'surface' | 'soft' | 'ghost' | 'lavender'
- size: 'sm' | 'md' | 'lg'
- disabled: boolean
- loading: boolean
- type: 'button' | 'submit' | 'reset'
- className: string

**States:**
- Default: Normal button
- Hover: Brighter background, cursor pointer
- Active: Pressed down appearance
- Focus: Focus ring
- Disabled: Opacity 50%, cursor not-allowed
- Loading: Spinner indicator, disabled state

**Variants:**
- primary: Emerald/cyan background
- lavender: Purple background
- secondary: Slate background
- surface: Subtle background
- soft: Low contrast background
- ghost: No background, text only

---

#### Badge
**Purpose:** Labels and status indicators  
**Props:**
- variant: 'subtle' | 'app' | 'violet' | etc.
- className: string
- children: ReactNode

**States:**
- Default: Static label
- Variants have different color schemes

---

#### Input
**Purpose:** Text input field  
**Props:**
- type: 'text' | 'email' | 'password' | 'search'
- placeholder: string
- value: string
- onChange: function
- disabled: boolean
- className: string

**States:**
- Default: Normal input
- Focus: Border highlight
- Disabled: Opacity, cursor not-allowed
- Error: Red border/text

---

#### Label
**Purpose:** Form field labels  
**Props:**
- htmlFor: string
- children: ReactNode

---

#### Textarea
**Purpose:** Multi-line text input  
**Props:**
- rows: number
- placeholder: string
- value: string
- onChange: function
- disabled: boolean
- className: string

**States:**
- Default: Normal textarea
- Focus: Border highlight
- Error: Red border/text

---

#### Tabs
**Purpose:** Navigate between content sections  
**Props:**
- value: string (active tab)
- onValueChange: function
- children: ReactNode

---

#### Select/Dropdown
**Purpose:** Choose from options  
**Props:**
- value: string
- onChange: function
- options: array
- disabled: boolean

---

#### Skeleton
**Purpose:** Loading placeholder  
**Props:**
- className: string
- width: string
- height: string

---

### Layout Components

#### AppLayout
**Purpose:** Main app wrapper with header, sidebar, content  
**Props:**
- children: ReactNode
- title: string
- description: string
- badge: string
- actions: ReactNode
- currentPath: string
- renderHeader: function (optional)
- contextPanel: ReactNode (optional)
- contentClassName: string

**Behavior:**
- Renders AppShell with navigation
- Shows header with title, description, actions
- Shows sidebar navigation
- Main content area
- Optional context panel

---

#### AppShell
**Purpose:** Application shell with sidebar toggle  
**Props:**
- children: ReactNode
- currentPath: string
- user: User object
- onLogout: function
- renderHeader: function
- contextPanel: ReactNode

**Sections:**
- Sidebar (AppSidebar)
- Header
- Main content
- Context panel (optional)

---

#### AppSidebar
**Purpose:** Navigation sidebar  
**Props:**
- currentPath: string
- user: User object
- isOpen: boolean
- onClose: function

**Links:**
- Patterns
- Problems
- Courses
- Submissions
- Assistant
- Codeforces Solve
- Admin (if admin)
- Logout

---

### Assistant Components

#### AssistantWorkspace
**Purpose:** Main assistant interface  
**Props:** (See page specification - 20+ props)
**State management:** Complex, handles recording, streaming, polling

---

#### WorkspaceHeader
**Purpose:** Header with mode selector and status  
**Props:**
- status: StreamStatus
- sessionId: number
- activeMode: AssistantMode
- isUsingPolling: boolean
- onOpenSidebar: function
- onSelectMode: function

---

#### QuickModesBar
**Purpose:** Quick mode switcher  
**Props:**
- selectedMode: AssistantMode
- onModeChange: function
- disabled: boolean

---

#### AssistantThread
**Purpose:** Chat message display  
**Props:**
- messages: ThreadMessage[]
- currentPartialText: string
- isLoadingMore: boolean

---

#### TranscriptComposer
**Purpose:** Input composer with voice, text, screen capture  
**Props:**
- transcript: string
- onTranscriptChange: function
- language: string
- onLanguageChange: function
- isRecording: boolean
- isBusy: boolean
- canSubmit: boolean
- hasCapturedFrame: boolean
- hasAudioBlob: boolean
- submitError: string | null
- onStartRecording: function
- onStopRecording: function
- onStartSharing: function
- onRefreshCapture: function
- onSubmit: function
- onCancel: function

---

#### ScreenContextPanel
**Purpose:** Display captured screen context  
**Props:**
- capturedFrame: Image | null
- onRefresh: function
- onClear: function

---

### Landing Components

#### HeroSection
**Purpose:** Main hero area with headline and CTA  
**Props:**
- isAuthenticated: boolean
- disable3D: boolean (for E2E testing)

---

#### FeatureGrid
**Purpose:** Grid of feature cards  
**Props:** None (static content)

---

#### VoiceVisionShowcase
**Purpose:** Showcase voice and vision capabilities  
**Props:** None

---

#### HowItWorksTimeline
**Purpose:** Step-by-step workflow timeline  
**Props:** None

---

#### TrustSection
**Purpose:** Build credibility  
**Props:** None

---

#### FinalCTA
**Purpose:** Final call-to-action section  
**Props:**
- isAuthenticated: boolean

---

## 5. Forms and Validation

### Login Form
**Location:** `/login`  
**Fields:**
1. Email
   - Type: email
   - Label: "Email"
   - Placeholder: "you@example.com"
   - Required: Yes
   - Validation: Valid email format
   - Error message: "Please enter a valid email"

2. Password
   - Type: password
   - Label: "Password"
   - Placeholder: "••••••••"
   - Required: Yes
   - Validation: Non-empty
   - Error message: "Password required"

**Submit Button:** "Log in"  
**Success:** Redirect to `/assistant`  
**Failure:** Show error message (red text), highlight fields with errors

---

### Register Form
**Location:** `/register`  
**Fields:**
1. Name
   - Type: text
   - Label: "Name"
   - Placeholder: "Your name"
   - Required: Yes
   - Validation: Non-empty, min 2 chars
   - Error message: "Name is required"

2. Email
   - Type: email
   - Label: "Email"
   - Placeholder: "you@example.com"
   - Required: Yes
   - Validation: Valid email format, unique
   - Error message: "Please enter a valid email" or "Email already registered"

3. Password
   - Type: password
   - Label: "Password"
   - Required: Yes
   - Validation: Min 8 chars, secure
   - Error message: "Password must be at least 8 characters"

4. Password Confirmation
   - Type: password
   - Label: "Confirm password"
   - Required: Yes
   - Validation: Must match password field
   - Error message: "Passwords do not match"

**Submit Button:** "Create account"  
**Success:** Redirect to `/assistant`  
**Failure:** Show error messages, highlight fields

---

### Problem Submission Form
**Location:** `/problems/{id}`  
**Fields:**
1. Language
   - Type: select/dropdown
   - Label: "Language"
   - Options: C++, Python
   - Required: Yes
   - Default: C++

2. Code
   - Type: textarea
   - Label: "Code"
   - Rows: 12
   - Placeholder: "Paste your code here..."
   - Required: Yes (non-empty)
   - Validation: Non-empty, code not blank
   - Error message: "Code is required"
   - Font: Monospace

**Submit Button:** "Submit solution"  
**Loading state:** "Submitting...", button disabled  
**Success:** Show success message, optionally redirect  
**Failure:** Show error message

---

### Codeforces Problem Form
**Location:** `/solve`  
**Fields:**
1. Problem Statement
   - Type: textarea
   - Label: "Full problem statement"
   - Rows: 14
   - Placeholder: "Paste the full statement here..."
   - Required: Yes
   - Validation: Non-empty
   - Error message: "Problem statement required"
   - Font: Monospace

2. Language
   - Type: select
   - Label: "Solution language"
   - Options: C++, Python
   - Required: Yes
   - Default: C++

**Submit Button:** "Solve the problem"  
**Button state:** Disabled if no problem text or Ollama unavailable  
**Loading state:** "Solving... (can take minutes)"  
**Success:** Redirect to `/solve/result/{id}`  
**Failure:** Show error message

---

## 6. Navigation and Routing

### Header Navigation
- **Public pages (Landing):**
  - Logo (home link)
  - Nav links: Experience, Features, How it works, Trust
  - Auth buttons: Log in, Get started
  
- **Authenticated pages:**
  - Mobile hamburger (opens sidebar)
  - Page-specific header with title, description, actions

### Sidebar Navigation (AppSidebar)
**Visible on:** All authenticated pages  
**Links:**
- Home → `/assistant`
- Patterns → `/patterns`
- Problems → `/problems`
- Courses → `/courses`
- Submissions → `/submissions`
- Codeforces Solve → `/solve`
- Admin Problems → `/admin/problems` (if admin)
- Logout → POST `/logout`

**Active state:** Current page link highlighted (border, background, text color)  
**User info:** Display user name at bottom  

### Mobile Navigation
- **Hamburger menu** on header
- Opens/closes sidebar
- Overlay on mobile, slides from left/right (depends on RTL)

### Footer
**Public pages (Landing):**
- Copyright text
- Back to top link
- Links: Home, Log in, Assistant (if authenticated)

**Authenticated pages:**
- Not visible (navigation in sidebar)

### Breadcrumbs
**Not currently visible in code, but could be added to:**
- `/problems/{id}` - Problems > Problem Title
- `/patterns/{id}` - Patterns > Pattern Title
- `/solve/result/{id}` - Solve > Result #{id}

### Active States
- Current page link in sidebar: Underline or background highlight
- Tab in tabbed interface: Underline or background
- Mode selector in Assistant: Highlighted or underlined

### Authenticated vs Logged Out
- **Logged out:** Show Landing page with Login/Register buttons
- **Logged in:** Show sidebar navigation, app pages
- **Admin:** See Admin Problems link in sidebar

---

## 7. User Flows

### Flow 1: New User Registration & First Learning Session
1. **Start:** User lands on `/`
2. **Action:** Clicks "Get started" button
3. **System:** Redirect to `/register`
4. **User enters:** Name, email, password, confirms password
5. **Action:** Clicks "Create account"
6. **System:** Validates form, creates account, redirects to `/assistant`
7. **User sees:** Empty assistant workspace with "No messages yet" placeholder
8. **User action:** Types question or starts recording audio
9. **System:** Processes input, shows AI response in chat
10. **Success:** User can continue asking questions, switch modes, capture screen
11. **User action:** Clicks "Patterns" in sidebar to explore topics
12. **System:** Shows pattern list with search/filters
13. **User action:** Clicks pattern to view details
14. **User action:** Clicks "Ask assistant about this" button
15. **Success:** Opens assistant with pattern context

### Flow 2: Problem Practice
1. **Start:** User is on `/problems`
2. **Action:** Clicks on a problem card
3. **System:** Navigates to `/problems/{id}`
4. **User sees:** Problem statement, metadata (difficulty, limits), submission form
5. **User action:** Reads problem statement
6. **User action:** Selects language (C++ or Python)
7. **User action:** Pastes code in textarea
8. **Action:** Clicks "Submit solution"
9. **System:** Validates code is non-empty
10. **System:** POST to `/submissions`, stores submission
11. **Success message:** "Submission received"
12. **Optional:** User can see submission in `/submissions` page

### Flow 3: AI-Assisted Problem Solving
1. **Start:** User is on `/solve`
2. **Action:** Pastes full problem statement
3. **Action:** Selects language
4. **Action:** Clicks "Solve the problem"
5. **System:** POST to `/solve` with problem text
6. **System:** Begins analysis pipeline (backend runs Ollama)
7. **User sees:** Redirect to `/solve/result/{id}`
8. **User sees:** "Processing..." indicator with spinner
9. **System:** Backend generates code, explanation, tests
10. **Polling/WebSocket:** Sends updates
11. **System:** Tabs populate as content ready
12. **User sees:** Completed result with tabs (Problem, Code, Explanation, Tests, Judge, Algorithm)
13. **User action:** Clicks tabs to read content
14. **User action:** Copies code if interested
15. **User action:** Clicks "New problem" to try another

### Flow 4: Voice-Assisted Analysis (Assistant Page)
1. **Start:** User navigates to `/assistant`
2. **User sees:** Empty chat, mode selector, input area
3. **User action:** Clicks "Record audio" button
4. **System:** Requests microphone permission
5. **User sees:** Recording indicator (pulsing red), "Stop" button
6. **User action:** Speaks question/idea about problem
7. **User action:** Clicks "Stop recording"
8. **System:** Stops recording, shows audio blob state
9. **User action:** (Optional) Captures screen with "Share screen" button
10. **System:** Shows captured frame in context panel
11. **User action:** Clicks "Submit"
12. **System:** POST to `/assistant/analyze` with audio blob, transcript, screen, mode
13. **User sees:** "Streaming..." indicator
14. **WebSocket broadcasts:** AI response chunks
15. **User sees:** Message appears in chat thread as response streams
16. **System:** Optional audio response (text-to-speech)
17. **User sees:** Audio player button on assistant message
18. **User can:** Click to play audio response
19. **User action:** Ask follow-up question or switch mode

### Flow 5: Codeforces Problem Solving with Streaming
1. **Start:** User is on `/solve`
2. **User action:** Pastes full Codeforces problem statement
3. **User action:** Selects language
4. **Action:** Clicks "Solve the problem"
5. **System:** POST to `/solve`, starts async job `ProcessCodeforcesSolutionJob`
6. **System:** Redirects to `/solve/result/{id}`
7. **User sees:** Processing alert + tab navigation (disabled/skeleton)
8. **Job runs:**
   - Stage 1: Parse problem statement
   - Broadcasts: ParsedProblem event
   - Stage 2: Generate code
   - Broadcasts: CodeGenerated event
   - Stage 3: Generate tests
   - Broadcasts: TestsGenerated event
   - Stage 4: Generate explanation
   - Broadcasts: ExplanationGenerated event
9. **User sees:** Tabs populate as each stage completes
10. **WebSocket broadcasts:** Updates in real-time
11. **Fallback (polling):** If WebSocket unavailable, polls `/solve/result/{id}/status` every 2.5s
12. **User sees:** Content available to read
13. **User action:** Switches between tabs (Problem, Code, Explanation, Tests)
14. **User action:** Clicks "New problem" to analyze another

### Flow 6: Topic Exploration with Filters
1. **Start:** User is on `/patterns`
2. **User sees:** Search input, status dropdown, tag dropdown
3. **User action:** Types in search (e.g., "binary")
4. **System:** Debounces 350ms, updates URL query params
5. **System:** GET `/patterns?q=binary`
6. **User sees:** Filtered patterns displayed
7. **User action:** Selects tag filter
8. **System:** Updates URL and displays filtered results
9. **User action:** Clicks paginate "next"
10. **System:** GET `/patterns?page=2` (preserves other filters)
11. **User action:** Clicks on pattern card
12. **System:** Navigates to `/patterns/{id}`
13. **User sees:** Pattern detail page with related patterns, representative problems
14. **User action:** Clicks "Ask assistant about this topic"
15. **System:** Navigates to `/assistant` (potentially with mode pre-selected)
16. **User action:** (Optional) Clicks representative problem link
17. **System:** Navigates to `/problems/{id}`

### Flow 7: Error & Fallback Scenarios

**Ollama unavailable:**
1. User tries to submit problem on `/solve`
2. System shows warning: "Ollama is not connected"
3. Button is disabled
4. Error message: "Please start Ollama and load a model"

**WebSocket unavailable (Assistant):**
1. User submits message
2. System attempts WebSocket connection
3. Falls back to polling
4. Shows polling indicator (optional)
5. Still receives updates, but via polling every 2.5s

**Form validation error:**
1. User submits form with empty field
2. System validates client-side
3. Shows red error message below field
4. Does NOT submit POST request
5. User corrects and resubmits

**Backend error during analysis:**
1. User submits problem for analysis
2. System shows "Processing..." alert
3. Backend encounters error (e.g., Ollama timeout)
4. Job fails, broadcasts error event
5. User sees: Error message, "Try again" button
6. User can retry or go back

---

## 8. Visual Redesign Direction

### Design Style
- **Modern, premium competitive programming platform**
- **Dark mode (dark-first design)**
- **Glassmorphism with blur effects (subtle)**
- **Smooth animations and transitions**
- **Bilingual (Arabic/English) with RTL support**
- **Accessible color contrast, semantic HTML**

### Color Palette

#### Primary Colors
- **Background dark:** `#020617` (slate-950)
- **Background elevated:** `rgba(15, 23, 42, 0.88)` (slate-900/88)
- **Foreground:** `#e2e8f0` (slate-100)
- **Borders:** `rgba(148, 163, 184, 0.14)` (slate-300/14)

#### Accent Colors
- **Primary accent:** `#8b5cf6` (violet-500)
- **Accent soft:** `rgba(139, 92, 246, 0.18)` (violet soft)
- **Accent strong:** `#67e8f9` (cyan-400)
- **Success:** `#34d399` (emerald-400)
- **Danger/Error:** `#fb7185` (rose-400)
- **Warning:** `#fbbf24` (amber-400)

#### Semantic Colors
- **Muted (secondary text):** `#94a3b8` (slate-400)
- **Muted strong (secondary text stronger):** `#cbd5e1` (slate-300)
- **Interaction (hover/focus):** Cyan/emerald highlights

### Typography
- **Font family:** System UI (`system-ui, -apple-system, sans-serif`)
- **Headings:** 600-700 weight (semibold-bold)
  - H1: 3xl-4xl (landing hero)
  - H2: 2xl-3xl (page titles)
  - H3: lg-xl (section titles)
  - H4: base-lg (subsection titles)
- **Body text:** 400 weight (normal)
  - Regular: base (16px)
  - Small: sm (14px)
  - Smaller: xs (12px)
- **Code/monospace:** `monospace` font family
- **Line height:** 1.5-1.75 for body, 1.2 for headings

### Spacing System
- **Base unit:** 4px
- **Scale:** 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64 (px)
- **Padding/margin:** Use consistent increments (px-3, py-4, gap-3, etc.)
- **Section spacing:** 4-6 units (16-24px) between sections
- **Content max-width:** 5xl (64rem) for readability

### Border Radius
- **Small:** 12px (rounded-lg)
- **Medium:** 16px (rounded-xl)
- **Large:** 24px (rounded-[24px])
- **Extra large:** 28-30px (rounded-[28px], rounded-[30px])

### Shadows
- **Light shadow:** `0 4px 12px rgba(0,0,0,0.1)`
- **Medium shadow:** `0 30px 80px rgba(2, 6, 23, 0.45)`
- **Strong shadow:** `0 40px 120px rgba(2, 6, 23, 0.62)`

### Icons
- **Library:** Lucide React
- **Size:** 16px (w-4 h-4), 20px (w-5 h-5), 24px (w-6 h-6)
- **Color:** Match text color (slate-200, emerald-400, cyan-400 based on context)
- **Stroke width:** 1.5-2

### Button Styles
- **Default:** bg-slate-700, text-slate-100, hover:bg-slate-600
- **Primary (Lavender):** bg-violet-600, hover:bg-violet-500
- **Success (Emerald):** bg-emerald-600, hover:bg-emerald-500
- **Accent (Cyan):** bg-cyan-500, hover:bg-cyan-400
- **Soft:** bg-slate-800/40, border, text-slate-200
- **Ghost:** No bg, text only, hover:bg-white/8
- **Disabled:** opacity-50, cursor-not-allowed
- **Border radius:** 20-24px (rounded-[20px], rounded-2xl)
- **Padding:** 8-12px (py-2 px-3 for sm, py-3 px-4 for md)

### Card Styles
- **Background:** rgba(15, 23, 42, 0.45) or rgba(15, 23, 42, 0.72)
- **Border:** 1px solid var(--app-border)
- **Border radius:** 24-30px
- **Padding:** 16-24px (p-4 to p-6)
- **Hover:** Border becomes stronger, bg slightly brighter
- **Transition:** 150-200ms ease

### Table Styles
- **Header row:** bg-slate-800, text-slate-300
- **Rows:** Border-top border-slate-700
- **Padding:** p-3 (12px)
- **Font size:** text-sm
- **Hover row:** Optional bg-slate-800/50

### Form Styles
- **Label:** text-sm, text-slate-300, block, mb-2
- **Input/Textarea:** 
  - Border: 1px solid var(--app-border)
  - bg-slate-950/70
  - text-slate-100
  - Rounded: rounded-[24px]
  - Focus: border-strong, outline-none
  - Padding: px-4 py-3
- **Placeholder:** text-slate-500
- **Error:** text-red-400, border-red-400/50
- **Success:** text-emerald-400, border-emerald-400/50

### Modal Styles
- **Overlay:** bg-black/50 or rgba(0,0,0,0.6), backdrop-blur
- **Modal card:** bg-slate-950, border, rounded-[30px]
- **Padding:** p-6-8
- **Close button:** Top right corner

### Toast/Notification Styles
- **Success:** bg-emerald-500/15, border-emerald-500/40, text-emerald-200
- **Error:** bg-red-500/15, border-red-500/40, text-red-200
- **Info/Warning:** bg-amber-500/10, border-amber-500/30, text-amber-200
- **Border radius:** 20-24px
- **Padding:** p-3-4
- **Position:** Top-right, bottom-left, or inline

### Overall Visual Mood
- **Premium:** High-quality, thoughtful design (not generic SaaS)
- **Intelligent:** AI-first, tech-forward, sophisticated
- **Accessible:** High contrast, readable text, keyboard navigation
- **Refined:** Smooth animations, subtle effects, polished interactions
- **Dark:** Dark mode throughout, cyberpunk-inspired aesthetics
- **Trustworthy:** Professional, stable, credible appearance

---

## 9. Responsive Design Requirements

### Device Breakpoints
- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md, lg)
- **Desktop:** > 1024px (xl)

### Desktop Behavior (1024px+)
- **Layout:** 3-column (sidebar + main + optional panel)
- **Sidebar:** Visible, width ~240-280px
- **Main content:** Centered, max-width 1280px
- **Context panel:** Right side, if applicable
- **Typography:** Full size (base 16px)
- **Buttons:** Normal size (md)
- **Cards:** 2-3 column grids
- **Navigation:** Visible header/sidebar

### Tablet Behavior (640px - 1024px)
- **Layout:** 2-column or full-width with collapsible sidebar
- **Sidebar:** Collapsible (hamburger), overlays on content when open
- **Main content:** Full width when sidebar closed
- **Context panel:** Stacked below or in modal
- **Typography:** Slightly reduced (base 14-15px)
- **Buttons:** Medium size (md)
- **Cards:** 1-2 column grids
- **Tables:** Horizontal scroll if wide

### Mobile Behavior (< 640px)
- **Layout:** Single column, full-width
- **Sidebar:** Hamburger menu, slides in from left/right (RTL)
- **Header:** Hamburger button, page title, minimize actions
- **Main content:** Full width with padding (px-4)
- **Context panel:** Modal or below main content
- **Typography:** Reduced (base 14px)
- **Buttons:** Small-medium size (sm), full-width if primary
- **Cards:** Single column, full width
- **Forms:** Stack vertically, full-width inputs
- **Tables:** Vertical layout or horizontal scroll
- **Assistant composer:** Stack elements vertically
- **Mode bar:** Horizontal scroll
- **Chat:** Smaller fonts, less padding

### Responsive Patterns

#### Grid Columns
- Desktop: 2-3 columns
- Tablet: 2 columns
- Mobile: 1 column

#### Stack Points
- Forms: Always stack vertically (mobile)
- Header actions: Stack vertically on mobile
- Tab bar: Horizontal scroll on mobile or dropdown

#### Collapse Points
- Sidebar: Visible on desktop, hamburger on mobile
- Header details: Show on desktop, minimize on mobile
- Context panel: Show on desktop, modal on tablet/mobile
- Breadcrumbs: Hidden on mobile

#### Hide Points
- Desktop-only elements: Hide on mobile (e.g., "Last run" in header)
- Context panel on small screens: Show as modal instead

#### Font Size Changes
- Desktop: base (16px)
- Tablet: base (15px)
- Mobile: sm (14px)

#### Padding Changes
- Desktop: p-6 (24px)
- Tablet: p-5 (20px)
- Mobile: p-4 (16px)

---

## 10. Data and Content Requirements

### Labels and Copy

#### Authentication
- **Login page heading:** "Log in"
- **Login button:** "Log in"
- **Email label:** "Email" or "البريد الإلكتروني" (AR)
- **Password label:** "Password" or "كلمة المرور" (AR)
- **Register page heading:** "Create your account to access the assistant"
- **Register button:** "Create account"
- **Name label:** "Name" or "الاسم" (AR)
- **Confirm password label:** "Confirm password" or "تأكيد كلمة المرور" (AR)

#### Pattern Pages
- **Page badge:** "Topic explorer" or "مكتبة الموضوعات" (AR)
- **Page title:** "Explore the core topics and patterns" or "استكشف الأنماط والموضوعات الأساسية" (AR)
- **Search placeholder:** "Search by name, summary, or signals..." or "ابحث بالاسم أو الوصف أو الإشارات..." (AR)
- **Empty state:** "No patterns yet" or "لا توجد أنماط بعد" (AR)
- **Pattern detail sections:**
  - "Summary" / "نبذة" (AR)
  - "When to use it" / "متى تُستخدم" (AR)
  - "When not to use it" / "متى لا تُستخدم" (AR)
  - "Common statement signals" / "إشارات شائعة في نص المسألة" (AR)
  - "Related techniques" / "تقنيات ذات صلة" (AR)
  - "Related topics" / "أنماط ذات صلة" (AR)
  - "Representative problems" / "مسائل تمثيلية" (AR)

#### Problem Pages
- **Page badge:** "Problem bank" or "بنك المسائل" (AR)
- **Page title:** "Browse problems you can train on" or "استعرض المسائل القابلة للتدريب" (AR)
- **Empty state:** "No problems yet" or "لا توجد مسائل بعد" (AR)
- **Problem detail sections:**
  - Difficulty, Time limit, Memory limit badges
  - "Submit a solution" or "إرسال حل" (AR)
  - "Language" label / "اللغة" (AR)
  - "Code" label / "الكود" (AR)
  - "Submit solution" button / "إرسال الحل" (AR)

#### Codeforces Pages
- **Page badge:** "Codeforces"
- **Solve page title:** "Analyze and solve a pasted problem statement"
- **Solve page heading:** "Full problem statement" or "نص المسألة كاملاً" (AR)
- **Solve placeholder:** "Paste the full statement here..." or "الصق هنا نص المسألة..." (AR)
- **Solve button:** "Solve the problem" or "حل المسألة" (AR)
- **Ollama warning:** "Ollama is not connected" + instructions
- **Recent solutions heading:** "Recent solutions" or "آخر الحلول" (AR)
- **Result page tabs:**
  - "Problem" / "المسألة" (AR)
  - "Code" / "الحل" (AR)
  - "Explanation" / "الشرح" (AR)
  - "Tests" / "الاختبارات" (AR)
  - "Judge" / "الحكم" (AR)
  - "Algorithm" / "الخوارزمية والتطويرات" (AR)

#### Submissions Pages
- **Page badge:** "Practice log" or "سجل التدريب" (AR)
- **Empty state:** "No submissions yet" or "لا توجد إرسالات بعد" (AR)

#### Courses
- **Page badge:** "Learning tracks" or "مسارات التعلم" (AR)
- **Empty state:** "No learning tracks yet" or "لا توجد مسارات بعد" (AR)

#### Assistant
- **Empty state:** "No messages yet — share your screen and type your idea to start"
- **Recording indicator:** "Recording..." (pulsing)
- **Processing indicator:** "Processing..." with spinner
- **Mode labels:** Ask, Code review, Hint, Explain, Debug, etc.

### Validation Messages
- **Email invalid:** "Please enter a valid email"
- **Password too short:** "Password must be at least 8 characters"
- **Passwords don't match:** "Passwords do not match"
- **Code required:** "Code is required"
- **Problem text required:** "Problem statement is required"
- **Field required:** "[Field name] is required"

### Status Messages
- **Success:** "Submission received" or "تم استقبال الإرسال" (AR)
- **Processing:** "Solving the problem... (this can take minutes)" or "جاري حل المسألة..." (AR)
- **Error:** "An error occurred. Please try again." or "حدث خطأ. حاول مجدداً." (AR)

### Buttons and CTAs
- **Primary action:** "Get started", "Create account", "Submit", "Solve", "Send", "Analyze"
- **Secondary action:** "Cancel", "Go back", "Skip", "Save for later"
- **Destructive:** "Delete", "Remove" (red styling)
- **Loading state:** Button text changes, spinner appears

### Notifications/Toasts
- **Success toast:** "✓ Submission successful"
- **Error toast:** "✗ An error occurred"
- **Info toast:** "ℹ Processing your request..."
- **Warning toast:** "⚠ Please note..."

---

## 11. Interaction and Behavior Specification

### Click Actions
- **Link click:** Instant navigation (Inertia.js handles smoothly)
- **Button click:** Immediate feedback (ripple, color change)
- **Card click:** Navigate to detail page
- **Mode selector click:** Change active mode, update UI
- **Tab click:** Switch active tab, show/hide content
- **Record button click:** Start audio recording
- **Screen capture button click:** Capture visible screen
- **Search input click:** Focus input, show keyboard

### Hover States
- **Links:** Underline, color change (cyan/emerald)
- **Buttons:** Brighter background, shadow
- **Cards:** Border becomes stronger, background brighter
- **Navigation items:** Background highlight, text color change
- **Tabs:** Underline appears or background changes

### Focus States
- **Inputs/textareas:** Blue/cyan border, outline ring
- **Buttons:** Outline ring (visible for keyboard users)
- **Tab focus:** Same as active state for accessibility

### Active States
- **Navigation links:** Underline or background, different text color
- **Tabs:** Underline and text color highlight
- **Mode selector:** Highlighted/underlined
- **Form fields (filled):** Border may change slightly

### Disabled States
- **Buttons:** opacity-50, cursor-not-allowed, no hover effect
- **Form inputs:** opacity-50, cursor-not-allowed, bg-muted
- **Links/buttons (not yet available):** Grayed out, cursor-not-allowed

### Loading States
- **Buttons:** Spinner icon, text changes (e.g., "Submitting...")
- **Pages:** Skeleton components for content
- **Chat messages:** Pulsing indicator (•••) for streaming
- **Recording:** Animated red pulse on record button

### Error States
- **Form fields:** Red border, red error text below
- **Toast notifications:** Red background, white text, close button
- **Alert boxes:** Red border, red background (subtle)
- **Invalid input:** Field highlighted on submit attempt

### Empty States
- **Chat:** "No messages yet — share your screen and type your idea to start"
- **Problem list:** "No problems yet" with secondary message
- **Pattern list:** "No patterns yet" with secondary message
- **Submissions:** "No submissions yet" with secondary message
- **Solutions:** "No recent solutions" (hidden if empty)

### Success States
- **Submission:** Toast notification, green background
- **Message sent:** Message appears in chat thread
- **Form submitted:** Redirect to success page or show success toast
- **Recording stopped:** Audio blob ready to submit

### Animations & Transitions
- **Page transitions:** Fade in/out (Inertia.js handles)
- **Modal open/close:** Slide up/down with fade
- **Dropdown open:** Slide down, fade in
- **Chat messages:** Slide up, fade in
- **Streaming text:** Character-by-character animation
- **Hover effects:** Smooth 150-200ms transition
- **Loading spinner:** Continuous rotation animation
- **Button hover:** 100ms color transition
- **Tab switch:** Fade in content, slide highlight
- **Recording indicator:** Pulsing animation (scale + opacity)
- **Reduced motion:** Respect `prefers-reduced-motion` preference

### Dropdown/Select Behavior
- **Click to open:** Show options list
- **Select option:** Close dropdown, update value, trigger onChange
- **Keyboard navigation:** Arrow keys to select, Enter to confirm, Esc to close
- **Click outside:** Close dropdown

### Modal Behavior
- **Open:** Fade in overlay, slide up modal content
- **Close:** Fade out overlay, slide down modal content
- **Click outside (if dismissible):** Close modal
- **Esc key:** Close modal (if dismissible)
- **Focus trap:** Focus stays within modal

### Form Behavior
- **On submit:** Validate client-side, show errors inline
- **If valid:** POST request, show loading state
- **On success:** Redirect or show success toast
- **On error:** Show error message, allow retry
- **Required fields:** Mark with asterisk (*)
- **Field errors:** Display below field in red

### Search Behavior
- **As you type:** Debounce 350ms
- **On debounce:** Update URL query params, fetch filtered results
- **Clear search:** Reset to original list
- **Submit (Enter key):** Can also force search

### Filter Behavior
- **Select filter:** Update URL params, apply filter
- **Multiple filters:** Combine with AND logic
- **Clear filters:** Reset to default view
- **Preserve pagination:** When changing filters, reset to page 1

### Pagination Behavior
- **Click page number:** Fetch that page, scroll to top (optionally)
- **Click next/previous:** Navigate to adjacent page
- **Show current page:** Highlight or bold
- **Hide pagination:** If only one page or no results

### Recording Behavior
- **Request permission:** Browser prompt for microphone access
- **On permission grant:** Start recording, show pulsing indicator
- **On permission deny:** Show error message
- **On record click:** Start recording (if not already)
- **On stop click:** Stop recording, show audio blob ready state
- **Max recording time:** (implementation-dependent)

### WebSocket/Polling Behavior
- **WebSocket enabled:** Real-time updates as they arrive
- **WebSocket unavailable:** Fall back to polling every 2.5s
- **On message:** Update chat thread, scroll to bottom
- **On error:** Show error indicator, attempt reconnect
- **On disconnect:** Show offline indicator, switch to polling

### Screen Capture Behavior
- **Click "Share screen":** Browser prompt to select screen/window
- **On selection:** Capture screen, show preview in context panel
- **Click "Refresh":** Capture screen again
- **Click "Clear":** Remove captured frame
- **Include in submission:** Send with assistant analysis request

---

## 12. Accessibility Requirements

### Semantic HTML
- Use `<button>` for clickable elements (not `<div>`)
- Use `<a>` for links (not buttons styled as links)
- Use `<form>` for forms, `<fieldset>` for grouped fields
- Use `<nav>` for navigation blocks
- Use `<main>` for main content
- Use `<header>`, `<footer>`, `<section>`, `<article>` appropriately
- Use `<label>` for form labels, linked with `htmlFor` to input id
- Use native `<input>`, `<textarea>`, `<select>` elements (not custom replacements)

### Keyboard Navigation
- All interactive elements reachable via Tab key
- Tab order logical and intuitive (left-to-right, top-to-bottom)
- Shift+Tab to navigate backwards
- Enter/Space to activate buttons
- Arrow keys for dropdowns, tabs, menu navigation
- Esc to close modals, dropdowns, etc.
- Focus visible at all times (focus ring)

### Focus States
- All interactive elements have visible focus ring
- Focus ring uses high-contrast colors (cyan/emerald)
- Focus ring has 2-3px width, rounded
- Never `outline: none` without replacement styling

### ARIA Labels
- Use `aria-label` for icon-only buttons
- Use `aria-labelledby` for headings that label sections
- Use `aria-describedby` for additional descriptions
- Use `role="alert"` for status messages
- Use `role="main"` for main content area
- Use `aria-live="polite"` for dynamic updates
- Use `aria-current="page"` for current nav link

### Form Accessibility
- Every input has associated `<label>`
- Label positioned before input (visually and in DOM)
- Required fields marked with asterisk and `aria-required="true"`
- Error messages linked to input with `aria-describedby`
- Password strength indicator (if applicable)
- Form instructions clear and concise

### Color Contrast
- Text vs background: Minimum 4.5:1 for normal text, 3:1 for large text
- Interactive elements: Distinguishable by more than color alone
- Color not used as sole means of conveying information
- Icons + text labels for important information

### Screen Reader Support
- Meaningful alt text for images (or empty alt if decorative)
- Skip link to main content ("Skip to main")
- Headings structure logical (h1, h2, h3 in order)
- List markup for lists (`<ul>`, `<ol>`, `<li>`)
- Table markup for data (`<table>`, `<thead>`, `<tbody>`, `<th>`)
- Code blocks labeled or captioned
- Form instructions announced

### Mobile Accessibility
- Touch targets at least 44x44px (48x48px preferred)
- Sufficient spacing between touch targets
- No hover-only content (use focus also)
- Responsive text sizing (not fixed pixel sizes)
- Pinch zoom not disabled

### Reduced Motion
- Respect `prefers-reduced-motion` CSS media query
- Disable animations/transitions when user prefers reduced motion
- Keep interactions functional (no animation dependency)
- Use `MotionConfig reducedMotion="user"` in Framer Motion

### Dynamic Content
- Live regions with `aria-live="polite"` for updates
- Chat messages announced as they arrive
- Loading states communicated to screen readers
- Error messages focused or announced
- Success messages announced

---

## 13. Lovable-Ready Build Prompt

---

# Lovable Frontend Redesign Prompt for AlgoAG

You are a senior frontend engineer redesigning the complete frontend for **AlgoAG**, a competitive programming training platform with AI assistance. Build the full product from scratch using React + TypeScript + Tailwind CSS.

## Project Context

**AlgoAG** is a full-stack Laravel + React platform that helps competitive programmers learn algorithms through AI-assisted problem solving with voice, vision, and real-time analysis.

**DO NOT:**
- Ask for clarification
- Create partial implementations
- Skip any pages or components
- Use placeholder content
- Leave styling inconsistent

**DO:**
- Build complete, production-ready pages
- Implement all states (loading, error, success, empty)
- Handle responsive design (mobile, tablet, desktop)
- Support bilingual content (Arabic/English) with RTL
- Use the exact design system specified
- Preserve all existing routes and logic
- Build reusable components

---

## Pages to Build (14 total)

### 1. Landing Page (`/`)
- **Hero section** with headline, subheadline, background animation
- **Voice + Vision showcase** with alternating content layout
- **Feature grid** (4 features, 3 columns on desktop, 1-2 on mobile)
- **How it works timeline** (5-6 steps, horizontal on desktop, vertical on mobile)
- **Trust section** with stats/testimonials
- **Final CTA section** with large button
- **Header:** Sticky, logo + nav links (Experience, Features, How it works, Trust) + auth buttons
- **Footer:** Copyright, back-to-top link, links
- **States:** Authenticated/unauthenticated (show different buttons)
- **RTL support:** Full Arabic translations, mirror layout

### 2. Register Page (`/register`)
- **Left panel (desktop only):** Logo, brand name (ALGOAG), headline, 3 benefits list, gradient background with blur circles
- **Right form (or full-width on mobile):**
  - Badge: "Advanced learning workspace"
  - Headline: "Create your account to access the assistant"
  - Form fields: Name, Email, Password, Password Confirmation (all with labels)
  - Validation: Client-side errors displayed below fields (red text)
  - Submit button: "Create account"
  - Link to login (if already registered)
- **Styling:** bg-slate-950/70, border, rounded-[36px], shadow
- **Mobile:** Single column, full-width form, hide left panel
- **Bilingual:** All labels and buttons translated to Arabic

### 3. Login Page (`/login`)
- **Centered form:**
  - Headline: "Log in"
  - Email input + label
  - Password input + label
  - "Remember me" checkbox (optional)
  - Submit button: "Log in"
  - Link to register page
- **Validation:** Client-side error display
- **Mobile:** Stack vertically, full-width inputs
- **Bilingual:** All labels in AR/EN with locale switching

### 4. Patterns Index (`/patterns`)
- **AppLayout header:** Badge ("Topic explorer"), title, description, action buttons (Open Assistant, Go to Problems)
- **Filter bar:**
  - Search input (debounced 350ms, updates URL)
  - Status dropdown
  - Tag dropdown
  - All filters update URL query params and results
- **Patterns grid:** 2 columns on desktop, 1 on mobile
  - Card: Title, pattern ID, hover effect (border-strong, brighter bg)
  - Click: Navigate to `/patterns/{id}`
- **Pagination:** Previous/Next buttons with page display
- **Empty state:** "No patterns yet" message centered
- **Loading state:** Skeleton grid (3 cards)
- **Mobile:** 1 column, full-width cards, stack filters vertically

### 5. Patterns Show (`/patterns/{id}`)
- **AppLayout header:** Badge, title (bilingual), description, actions
- **Pattern overview card:** Pattern ID, bilingual titles, summary
- **Dynamic sections** (show only if content exists):
  - Summary
  - When to use
  - When not to use
  - Common statement signals
  - Related techniques (bulleted list)
- **Related patterns section:** Grid (2 columns desktop, 1 mobile) of pattern cards
- **Representative problems section:** Grid of problem card links
- **Each section:** Card with title, border, rounded, padding
- **Bilingual:** All section titles in AR/EN
- **Mobile:** Stack sections, full-width cards

### 6. Problems Index (`/problems`)
- **AppLayout header:** Badge ("Problem bank"), title, description, actions
- **Problems grid:** 2 columns desktop, 1 mobile
  - Card: Title, difficulty badge, tags/badges
  - Hover: Border-strong, brighter bg
  - Click: Navigate to `/problems/{id}`
- **Empty state:** "No problems yet"
- **Loading state:** Skeleton grid
- **Mobile:** 1 column

### 7. Problems Show (`/problems/{id}`)
- **AppLayout header:** Badge, title, description, actions
- **Problem metadata:** Difficulty, time limit, memory limit badges
- **Problem statement:** Large text area-like display (pre-formatted, read-only)
  - Styling: bg-slate-950/45, border, rounded-[30px], p-6, whitespace-pre-wrap
- **Submission form section:**
  - Title: "Submit a solution"
  - Note: "Current submissions are stored for review and stub verification only"
  - Language select (C++, Python)
  - Code textarea (rows: 12, monospace font)
  - Validation: Code required
  - Error display below textarea (red)
  - Submit button: "Submit solution"
  - Loading state: "Submitting...", disabled
- **Mobile:** Stack form below statement, full-width textarea

### 8. Courses Index (`/courses`)
- **AppLayout header:** Badge ("Learning tracks"), title, description, action button
- **Courses grid:** 2 columns desktop, 1 mobile
  - Card: Title, description
  - Click: Navigate to `/courses/{id}`
- **Empty state:** "No learning tracks yet"

### 9. Courses Show (`/courses/{id}`)
- **AppLayout header:** Badge, title, description
- **Course overview:** Title, description
- **Lessons/modules list:** (Structure inferred from existing codebase)
  - List of modules with navigation

### 10. Submissions Index (`/submissions`)
- **AppLayout header:** Badge ("Practice log"), title, description, action button
- **Flash message** (if any): Green alert box
- **Submissions list:** Vertical stack of submission cards
  - Card: Created date (small, muted), problem title (linked), language + verdict badge
  - Hover: Border-strong
- **Empty state:** "No submissions yet"
- **Mobile:** 1 column, full-width cards

### 11. Assistant Workspace (`/assistant`)
- **Complex multi-section layout:**
  - **WorkspaceHeader (sticky top):**
    - Mode selector (active highlighted)
    - Session ID display
    - Status indicator (Last run timestamp)
    - Polling indicator (if using polling)
  - **QuickModesBar:** Horizontal bar with 10+ mode buttons
    - Active mode highlighted (underline or bg)
    - Disabled during processing
    - Mobile: Horizontal scroll if overflows
  - **Main chat area (AssistantThread):**
    - Empty state: "No messages yet — share your screen and type your idea to start"
    - Message cards:
      - User message: bg-slate-800/50, border-slate-700
      - Assistant message: bg-emerald-900/20, border-emerald-700/30
      - Message content: Role badge, mode badge (if any), text (whitespace-pre-wrap), audio player (if audioUrl)
    - Current partial text: Animated streaming (pulsing indicator), same style as assistant message
    - Auto-scroll to bottom on new messages
  - **TranscriptComposer (sticky bottom):**
    - Record audio button (pulsing red when recording)
    - Capture screen button
    - Transcript textarea (editable)
    - Language dropdown
    - Submit button (Submit, or disabled if no input)
    - Cancel button (visible when recording/processing)
    - Status: "Recording...", "Processing...", error messages
  - **ScreenContextPanel (optional):**
    - Display captured frame or placeholder
    - Refresh/Clear buttons
    - Mobile: Below chat or in modal
- **States:**
  - Idle: Ready for input
  - Recording: Red pulsing button, locked input
  - Processing: Spinner, disabled submit
  - Streaming: New messages appear, animated cursor
  - Error: Red error message, retry option
  - Fallback: Polling indicator
- **RTL support:** Full Arabic labels, reversed layout

### 12. Codeforces Solve (`/solve`)
- **AppLayout header:** Badge ("Codeforces"), title, description, action button
- **Ollama warning** (conditional): Alert box if Ollama unavailable
  - Content: "Ollama is not connected. Run `ollama serve` and load a model..."
  - Styling: bg-amber-500/10, border-amber-500/30, text-amber-200
- **Problem submission form:**
  - Label: "Full problem statement"
  - Textarea: rows=14, monospace font, placeholder, border, rounded-[24px]
  - Language select (C++, Python)
  - Error messages below textarea
  - Submit button: "Solve the problem"
  - Button state: Disabled if no text, Ollama unavailable, or processing
  - Loading state: "Solving the problem... (this can take minutes)"
- **Recent solutions section** (if any):
  - Title: "Recent solutions"
  - List of recent solutions:
    - Created date (small)
    - Problem preview (truncated)
    - Status badge (Completed/Failed/Processing)
    - Link to `/solve/result/{id}`
  - Styling: Card-based, border, rounded
- **Mobile:** Single column, larger textarea, stack elements

### 13. Codeforces Result (`/solve/result/{id}`)
- **AppLayout header:** Badge, title, description, action button ("New Problem")
- **Status indicator** (conditional):
  - Processing: "Processing..." + spinner, sky blue alert box
  - Failed: Error message + red alert box
  - Completed: Hidden
- **Tab navigation:** 6 tabs (Problem, Code, Explanation, Tests, Judge, Algorithm)
  - Active tab: Underline or background highlight
  - RTL: Tab labels in Arabic
  - Desktop: Horizontal tabs
  - Mobile: Horizontal scroll or dropdown
- **Tab contents:**
  - **Problem Tab:** Parsed problem statement (formatted, readable)
  - **Code Tab:** Generated code (syntax highlighted, copy button, language badge)
  - **Explanation Tab:** AI explanation text (formatted)
  - **Tests Tab:** Test cases (input, expected output, actual output, result badge)
  - **Judge Tab:** "Final judging is still in stub mode" message
  - **Algorithm Tab:** Algorithm details and optimizations
- **Polling/WebSocket:**
  - If processing: Poll `/solve/result/{id}/status` every 2.5s
  - WebSocket: Listen to `codeforces-solutions.{userId}` channel, reload on status change
  - Show polling indicator if using polling
- **New Problem button:** Navigate to `/solve`
- **Mobile:** Stack tabs vertically or dropdown, full-width content

### 14. Admin Problems Index (`/admin/problems`)
- **Header:**
  - Title: "إدارة المسائل" (Problem Management)
  - "New Problem" link
  - Home link
- **Flash message** (if any): Green alert
- **Problems list:** Rows with:
  - Title (cyan), slug (small), difficulty (small)
  - Edit button
  - Delete button (with confirmation)
- **Empty state:** "No problems yet"

---

## Components to Build (Reusable)

### Layout Components
- **AppLayout:** Page wrapper with header, sidebar, content area
- **AppShell:** Shell with sidebar toggle, header, main, optional context panel
- **AppSidebar:** Navigation sidebar with links (Patterns, Problems, Courses, Submissions, Assistant, Solve, Admin, Logout)

### UI Components (Use Radix UI primitives or build custom)
- **Button:** Variants (primary, secondary, surface, soft, ghost, lavender), sizes (sm, md, lg)
- **Badge:** Variants for different status/types
- **Input:** Text, email, password, search inputs
- **Label:** Form labels
- **Textarea:** Multi-line input
- **Tabs:** Tab navigation
- **Dropdown/Select:** Options selection
- **Skeleton:** Loading placeholder
- **Alert/Toast:** Notifications, alerts

### Assistant Components
- **AssistantWorkspace:** Main workspace component
- **WorkspaceHeader:** Header with mode selector and status
- **QuickModesBar:** Mode switcher buttons
- **AssistantThread:** Chat message display
- **MessageCard:** Individual message card
- **TranscriptComposer:** Input area (text, audio, screen)
- **ScreenContextPanel:** Display captured screen
- **AudioPlayer:** Play audio responses
- **RecordingIndicator:** Visual recording feedback

### Landing Components
- **HeroSection:** Hero area with headline, CTA
- **FeatureGrid:** Feature cards (4 items)
- **VoiceVisionShowcase:** Showcase section
- **HowItWorksTimeline:** Step-by-step timeline
- **TrustSection:** Credibility section
- **FinalCTA:** Final call-to-action

### Utility Components
- **FormField:** Wrapper for label + input + error
- **EmptyState:** Empty state message + illustration
- **LoadingState:** Loading skeleton/spinner
- **ErrorState:** Error message + retry button
- **NoDataPlaceholder:** When no data available

---

## Design System

### Colors (CSS Variables)
```
--app-background: #020617 (slate-950)
--app-background-elevated: rgba(15, 23, 42, 0.88)
--app-border: rgba(148, 163, 184, 0.14)
--app-border-strong: rgba(103, 232, 249, 0.22)
--app-foreground: #e2e8f0 (slate-100)
--app-muted: #94a3b8 (slate-400)
--app-muted-strong: #cbd5e1 (slate-300)
--app-accent: #8b5cf6 (violet-500)
--app-accent-soft: rgba(139, 92, 246, 0.18)
--app-accent-strong: #67e8f9 (cyan-400)
--app-success: #34d399 (emerald-400)
--app-danger: #fb7185 (rose-400)
--app-warning: #fbbf24 (amber-400)
```

### Typography
- **Font:** System UI (`system-ui, -apple-system, sans-serif`)
- **Code:** Monospace
- **Headings:** 600-700 weight
- **Body:** 400 weight
- **Line height:** 1.5-1.75 for body

### Spacing
- **Base unit:** 4px
- **Common:** 8, 12, 16, 20, 24, 32, 40, 48px
- **Sections:** 16-24px gap

### Border Radius
- **Small:** 12px (rounded-lg)
- **Medium:** 16px (rounded-xl)
- **Large:** 24px (rounded-[24px])
- **Extra large:** 28-30px (rounded-[28px], rounded-[30px])

### Shadows
- **Light:** `0 4px 12px rgba(0,0,0,0.1)`
- **Medium:** `0 30px 80px rgba(2, 6, 23, 0.45)`
- **Strong:** `0 40px 120px rgba(2, 6, 23, 0.62)`

### Icons
- **Library:** Lucide React
- **Sizes:** 16px (w-4 h-4), 20px (w-5 h-5), 24px (w-6 h-6)
- **Color:** Match context (slate-200, emerald-400, cyan-400, etc.)

---

## Responsive Breakpoints

- **Mobile:** < 640px - Single column, collapsed sidebar, stacked elements
- **Tablet:** 640px-1024px - 2-column sidebar, adjusted spacing
- **Desktop:** > 1024px - Full 3-column layout, full spacing

---

## Key Features to Implement

1. **Bilingual Support (AR/EN):**
   - All labels, buttons, messages in both languages
   - RTL layout for Arabic (mirror left/right, reverse direction)
   - Language switcher (context-based, stored in session/URL)
   - Use `useUiLocale()` hook pattern

2. **Form Validation:**
   - Client-side validation (required, email format, password match, etc.)
   - Display errors below fields in red
   - Disable submit if invalid
   - Real-time validation feedback

3. **Loading States:**
   - Skeleton loaders for grids and lists
   - Spinner in buttons during submission
   - Loading alerts on async pages
   - Spinner for chat message streaming

4. **Error Handling:**
   - Display error messages inline and in alerts
   - Provide retry options
   - Show validation errors below form fields
   - Handle network errors gracefully

5. **Responsive Design:**
   - Mobile-first approach
   - Hamburger menu for mobile navigation
   - Stack all form elements vertically on mobile
   - Collapse multi-column grids to single column
   - Adjust font sizes and padding for mobile

6. **Accessibility:**
   - Semantic HTML (`<button>`, `<label>`, `<form>`, etc.)
   - Keyboard navigation (Tab, Shift+Tab, Enter, Arrow keys)
   - Visible focus states (focus ring)
   - ARIA labels for icon-only buttons
   - High color contrast
   - Skip link to main content

7. **Animations:**
   - Smooth page transitions
   - Hover effects on buttons/cards (200ms)
   - Fade in/out for modals
   - Pulsing animation for recording indicator
   - Character-by-character streaming in chat
   - Respect `prefers-reduced-motion`

8. **WebSocket/Polling:**
   - Handle real-time updates from backend
   - Fall back to polling if WebSocket unavailable
   - Show polling indicator
   - Handle connection errors

---

## Implementation Notes

1. **Use Inertia.js Link component** for navigation (not browser history)
2. **Support RTL:** Flexbox with `dir` attribute, `flex-row-reverse`, etc.
3. **Preserve existing routes:** Don't change `/assistant`, `/solve`, etc.
4. **Component structure:** Mirror the existing file structure (Pages/, components/, etc.)
5. **Type safety:** Use TypeScript for all components
6. **Testing:** Components should be testable (avoid tight coupling)
7. **Performance:** Lazy load landing animations, optimize chat scrolling
8. **Mobile optimizations:** Reduce font sizes, less padding, optimize touch targets (44-48px)
9. **No breaking changes:** Keep all existing API endpoints and data structures
10. **Production-ready:** No console.logs, proper error handling, no placeholder content

---

## Success Criteria

✅ All 14 pages fully built and styled  
✅ All components responsive (mobile, tablet, desktop)  
✅ Bilingual support (Arabic/English) with RTL  
✅ Form validation with error display  
✅ Loading, error, empty, and success states  
✅ Accessibility (keyboard nav, ARIA, contrast, etc.)  
✅ Smooth animations and transitions  
✅ WebSocket/Polling support  
✅ High-quality visual design (premium, dark, polished)  
✅ No placeholder content  
✅ All TypeScript with proper types  
✅ Ready for immediate production use  

---

**Start building now. Build the complete, production-ready frontend for AlgoAG.**
