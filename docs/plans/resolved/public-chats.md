# Public Chats Implementation Plan

## Overview

Implement branded, public-facing chat pages accessible at `chats/{project-slug}`. These pages provide a clean, focused chat interface with project-specific branding, independent of the main application's navigation structure.

## Goals

- Create a public chat interface accessible via project slug
- Apply full project branding (colors, logo, title, subtitle)
- Provide a clean, distraction-free chat experience
- Reset chat session on each page visit
- Maintain separation from authenticated admin interface

## URL Structure

```
/chats/{project-slug}
```

**Example:**
- `/chats/san-diego` - Public chat for "San Diego" project
- `/chats/customer-support` - Public chat for "Customer Support" project

## Page Layout

### Visual Hierarchy

```
┌─────────────────────────────────────────┐
│  [Logo]  Project Title                  │
│          Project Subtitle               │
├─────────────────────────────────────────┤
│                                         │
│  Chat Interface                         │
│  - Message history                      │
│  - Input field                          │
│  - Avatar (if enabled)                  │
│                                         │
└─────────────────────────────────────────┘
```

### Branding Elements

| Element | Source | Styling |
|---------|--------|---------|
| Background | `project.color_background` | Full page background |
| Title | `project.title` | `<h1>` in primary color |
| Subtitle | `project.subtitle` | Below title, secondary styling |
| Logo | `project.logo` | Left of title (if exists) |
| Text | `project.color_primary` | Primary text color |
| Accents | `project.color_secondary` | Buttons, highlights |

### Navigation

**Excluded Elements:**
- Main site navbar
- Admin left navigation
- Site footer
- Breadcrumbs

**Optional Elements:**
- Return link (if `project.return_link` and `project.return_link_text` are set)
  - Displayed as a subtle link in the header or footer area

## Technical Implementation

### Frontend

#### New Component: `PublicChat.tsx`

**Location:** `/frontend/src/pages/PublicChat.tsx`

**Responsibilities:**
1. Fetch project data by slug
2. Apply project branding to page
3. Initialize new chat session
4. Render chat interface
5. Handle chat interactions

**Key Features:**
- No authentication required
- Standalone layout (no navbar/footer)
- Dynamic styling based on project colors
- Session reset on page load

#### Route Configuration

**Add to router:**
```typescript
{
  path: '/chats/:slug',
  element: <PublicChat />
}
```

### Backend

#### New Endpoint: Get Project by Slug (Public)

**Endpoint:** `GET /api/v1/public/projects/{slug}`

**Purpose:** Fetch project configuration for public chat page

**Response:**
```json
{
  "uuid": "8f4845c3-878e-495d-b546-cd5272145fe4",
  "name": "San Diego",
  "slug": "san-diego",
  "title": "San Diego",
  "subtitle": "Answers questions about San Diego.",
  "body": "I am here to help! Search our knowledge base or ask me a question.",
  "logo": "https://s3.../logo.png",
  "color_primary": "#2e7d32",
  "color_secondary": "#ff6f00",
  "color_background": "#ffffff",
  "avatar": "male",
  "voice": "Matthew (Male)",
  "show_animation": true,
  "return_link": "https://example.com",
  "return_link_text": "Back to Website"
}
```

**Access Control:**
- Public endpoint (no authentication)
- Only returns projects where `is_active=true` and `is_enabled=true`
- Returns 404 if project not found or disabled

#### Chat Session Management

**Behavior:**
- Each page visit creates a new chat session
- Session ID generated client-side (UUID)
- No session persistence across page reloads
- Chat history stored temporarily in memory (not persisted)

**Alternative (Optional):**
- Store sessions in `chat_messages` table with `project_id` reference
- Add `project_id` column to `chat_messages` table
- Allow session persistence via URL parameter: `/chats/{slug}?session={uuid}`

### Database Changes

#### Option 1: No Changes (Ephemeral Sessions)
- Chat sessions exist only in client memory
- No backend persistence
- Simplest implementation

#### Option 2: Persistent Sessions (Recommended)

**Add to `chat_messages` table:**
```sql
ALTER TABLE chat_messages 
ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX idx_chat_messages_project_id ON chat_messages(project_id);
```

**Benefits:**
- Analytics on public chat usage
- Ability to review chat history
- Session recovery via URL parameter
- Better debugging and monitoring

## Styling Approach

### Dynamic CSS Variables

Apply project colors as CSS custom properties:

```typescript
const chatContainerStyle = {
  '--color-primary': project.color_primary,
  '--color-secondary': project.color_secondary,
  '--color-background': project.color_background,
  backgroundColor: 'var(--color-background)',
  color: 'var(--color-primary)',
} as React.CSSProperties;
```

### Component Styling

```typescript
<Box
  sx={{
    minHeight: '100vh',
    backgroundColor: project.color_background,
    color: project.color_primary,
    display: 'flex',
    flexDirection: 'column',
    p: 3,
  }}
>
  {/* Header */}
  <Stack direction="row" spacing={2} alignItems="center" mb={4}>
    {project.logo && (
      <img 
        src={project.logo} 
        alt={project.name}
        style={{ height: 60, width: 'auto' }}
      />
    )}
    <Box>
      <Typography 
        variant="h1" 
        sx={{ 
          color: project.color_primary,
          fontSize: '2.5rem',
          fontWeight: 700,
        }}
      >
        {project.title}
      </Typography>
      {project.subtitle && (
        <Typography 
          variant="subtitle1"
          sx={{ color: project.color_secondary }}
        >
          {project.subtitle}
        </Typography>
      )}
    </Box>
  </Stack>

  {/* Chat Interface */}
  <ChatInterface 
    projectId={project.uuid}
    avatar={project.avatar}
    voice={project.voice}
    showAnimation={project.show_animation}
    primaryColor={project.color_primary}
    secondaryColor={project.color_secondary}
  />
</Box>
```

## Chat Interface Integration

### Reuse Existing Chat Component

**Component:** `Chat.tsx` (existing)

**Modifications Needed:**
1. Make component accept project-specific props
2. Support custom color theming
3. Allow session ID to be passed as prop
4. Support public (non-authenticated) mode

### Props Interface

```typescript
interface ChatInterfaceProps {
  projectId: string;
  avatar: string;
  voice: string;
  showAnimation: boolean;
  primaryColor: string;
  secondaryColor: string;
  sessionId?: string; // Optional: use existing session
  isPublic?: boolean; // Flag for public mode
}
```

## Error Handling

### Project Not Found
- Display friendly 404 page
- Message: "Chat not found. Please check the URL and try again."
- Optional: Link to main site

### Project Disabled
- Display maintenance message
- Message: "This chat is temporarily unavailable. Please try again later."

### Chat Service Unavailable
- Display error message in chat interface
- Allow retry mechanism
- Fallback to contact information if available

## Security Considerations

### Rate Limiting
- Implement rate limiting per IP address
- Limit: 60 requests per minute per IP
- Prevent abuse and spam

### Content Filtering
- Apply same content filters as authenticated chat
- Monitor for inappropriate queries
- Log suspicious activity

### CORS Configuration
- Allow embedding in iframes (if desired)
- Configure appropriate CORS headers
- Consider CSP policies

## Analytics & Monitoring

### Metrics to Track
- Page views per project
- Chat sessions initiated
- Messages per session
- Average session duration
- Popular queries
- Error rates

### Implementation
- Add analytics events to frontend
- Log chat sessions in backend
- Create admin dashboard for public chat metrics

## SEO Considerations

### Meta Tags
```html
<title>{project.title} - Chat</title>
<meta name="description" content={project.subtitle} />
<meta property="og:title" content={project.title} />
<meta property="og:description" content={project.subtitle} />
<meta property="og:image" content={project.logo} />
```

### Robots.txt
- Consider whether to allow indexing
- May want to exclude chat pages from search engines
- Add to `robots.txt` if excluding

## Recommendations

### Phase 1: MVP (Minimum Viable Product)
1. **Create public project endpoint** (`GET /api/v1/public/projects/{slug}`)
   - Return project branding data
   - Filter by `is_active` and `is_enabled`
   
2. **Create PublicChat component**
   - Fetch project by slug
   - Apply branding (colors, logo, title, subtitle)
   - Render chat interface
   
3. **Add route** (`/chats/:slug`)
   - No authentication required
   - Standalone layout (no navbar/footer)
   
4. **Ephemeral sessions**
   - Client-side session management
   - No backend persistence
   - Reset on page reload

### Phase 2: Enhanced Features
1. **Persistent sessions**
   - Add `project_id` to `chat_messages` table
   - Store chat history
   - Support session recovery via URL parameter
   
2. **Analytics**
   - Track usage metrics
   - Admin dashboard for public chat stats
   - Popular queries report
   
3. **Customization options**
   - Custom welcome message per project
   - Suggested questions/prompts
   - Custom branding for chat bubbles

### Phase 3: Advanced Features
1. **Embedding support**
   - Allow iframe embedding on external sites
   - Provide embed code generator in admin
   - Widget mode (minimal UI)
   
2. **Multi-language support**
   - Detect user language
   - Translate interface elements
   - Support multilingual responses
   
3. **Advanced analytics**
   - Conversation flow analysis
   - Sentiment analysis
   - User satisfaction ratings

### Implementation Priority

**High Priority:**
- Public project endpoint
- PublicChat component with branding
- Basic chat functionality
- Error handling

**Medium Priority:**
- Session persistence
- Basic analytics
- Rate limiting
- SEO optimization

**Low Priority:**
- Embedding support
- Multi-language
- Advanced analytics
- Custom welcome messages

### Technical Considerations

1. **Performance**
   - Cache project data (Redis or in-memory)
   - Optimize logo/image loading
   - Lazy load chat history
   
2. **Accessibility**
   - Ensure color contrast meets WCAG standards
   - Keyboard navigation support
   - Screen reader compatibility
   
3. **Mobile Responsiveness**
   - Optimize layout for mobile devices
   - Touch-friendly chat interface
   - Responsive typography
   
4. **Testing**
   - Unit tests for PublicChat component
   - Integration tests for public endpoint
   - E2E tests for chat flow
   - Visual regression tests for branding

### Security Best Practices

1. **Input Validation**
   - Sanitize project slug parameter
   - Validate all user inputs
   - Prevent XSS attacks
   
2. **Rate Limiting**
   - Per-IP rate limits
   - Per-session rate limits
   - Exponential backoff for repeated failures
   
3. **Monitoring**
   - Log all public chat sessions
   - Alert on suspicious patterns
   - Monitor for abuse

### Documentation Needs

1. **User Documentation**
   - How to access public chat
   - How to share chat URL
   - How to customize branding
   
2. **Developer Documentation**
   - API endpoint documentation
   - Component props reference
   - Embedding guide (Phase 3)
   
3. **Admin Documentation**
   - How to enable/disable public chat
   - How to view analytics
   - How to customize chat settings
