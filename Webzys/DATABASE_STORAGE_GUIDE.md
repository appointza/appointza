# Database Storage Guide for Webzys Projects

## Data Structure

The website project data structure is:

```typescript
interface Website {
  id: string;                    // Unique website ID
  name: string;                  // Website name
  type: "normal" | "appointza";  // Website type
  userId: string;                // Owner user ID
  pages: Record<string, PageData>; // Pages object (keyed by page ID)
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}

interface PageData {
  id: string;                    // Page ID (e.g., "home", "about")
  name: string;                 // Page name (e.g., "Home", "About")
  blocks: Block[];              // Array of blocks
}

interface Block {
  id: string;                    // Block ID (e.g., "hero-1")
  type: string;                  // Block type (e.g., "hero", "hero-2", "section")
  data: Record<string, any>;    // Block-specific data (JSON)
  visible: boolean;             // Visibility flag
}
```

## Database Schema

### Option 1: Single Table (JSON Storage)

**Table: `websites`**
```sql
CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('normal', 'appointza', 'resume')),
  data JSONB NOT NULL,  -- Stores entire pages object
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_websites_user_id ON websites(user_id);
CREATE INDEX idx_websites_type ON websites(type);
```

### Option 2: Normalized Tables (Recommended for complex queries)

**Table: `websites`**
```sql
CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('normal', 'appointza', 'resume')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Table: `website_pages`**
```sql
CREATE TABLE website_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  page_id VARCHAR(100) NOT NULL,  -- e.g., "home", "about"
  name VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(website_id, page_id)
);
```

**Table: `website_blocks`**
```sql
CREATE TABLE website_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES website_pages(id) ON DELETE CASCADE,
  block_id VARCHAR(100) NOT NULL,  -- e.g., "hero-1"
  block_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,  -- Block-specific data
  visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_id, block_id)
);
```

## API Endpoints

### 1. Save Website Project

**POST `/api/websites`** (Create new)
**PUT `/api/websites/:id`** (Update existing)

**Request Body:**
```json
{
  "name": "My Website",
  "type": "normal",
  "pages": {
    "home": {
      "id": "home",
      "name": "Home",
      "blocks": [
        {
          "id": "hero-1",
          "type": "hero",
          "data": {
            "title": "Welcome",
            "subtitle": "Subtitle here",
            "buttonText": "Get Started",
            "buttonLink": "#page:about"
          },
          "visible": true
        }
      ]
    },
    "about": {
      "id": "about",
      "name": "About",
      "blocks": [...]
    }
  }
}
```

**Response:**
```json
{
  "id": "website-uuid",
  "name": "My Website",
  "type": "normal",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 2. Load Website Project

**GET `/api/websites/:id`**

**Response:**
```json
{
  "id": "website-uuid",
  "name": "My Website",
  "type": "normal",
  "pages": {
    "home": {
      "id": "home",
      "name": "Home",
      "blocks": [...]
    }
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 3. List User's Websites

**GET `/api/websites?userId=:userId`**

**Response:**
```json
[
  {
    "id": "website-uuid-1",
    "name": "Website 1",
    "type": "normal",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": "website-uuid-2",
    "name": "Website 2",
    "type": "appointza",
    "createdAt": "2024-01-02T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
]
```

## Implementation in Builder Component

### Save Function

```typescript
const handleSave = async () => {
  try {
    const websiteData = {
      name: websiteName,
      type: websiteType,
      pages: pages,  // Record<string, PageData>
    };

    const url = id ? `/api/websites/${id}` : '/api/websites';
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(websiteData),
    });

    if (!response.ok) {
      throw new Error('Failed to save website');
    }

    const saved = await response.json();
    console.log('Website saved:', saved);
    alert('Website saved successfully!');
    
    // Update URL if new website
    if (!id && saved.id) {
      navigate(`/builder/${saved.id}?type=${websiteType}&name=${websiteName}`);
    }
  } catch (error) {
    console.error('Error saving website:', error);
    alert('Failed to save website');
  }
};
```

### Load Function (on component mount)

```typescript
useEffect(() => {
  const loadWebsite = async () => {
    if (!id) return; // New website, use defaults

    try {
      const response = await fetch(`/api/websites/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load website');
      }

      const website = await response.json();
      
      // Convert pages array to Record if using normalized schema
      const pagesRecord: Record<string, PageData> = {};
      if (Array.isArray(website.pages)) {
        website.pages.forEach((page: PageData) => {
          pagesRecord[page.id] = page;
        });
      } else {
        // Already in Record format
        Object.assign(pagesRecord, website.pages);
      }

      setPages(pagesRecord);
      setWebsiteName(website.name);
      // Set current page to first page or home
      const firstPageId = website.pages?.home?.id || Object.keys(pagesRecord)[0];
      if (firstPageId) {
        setCurrentPage(firstPageId);
      }
    } catch (error) {
      console.error('Error loading website:', error);
      alert('Failed to load website');
    }
  };

  loadWebsite();
}, [id]);
```

## Backend Implementation (C# Example)

### Controller

```csharp
[ApiController]
[Route("api/[controller]")]
public class WebsitesController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateWebsite([FromBody] WebsiteDto website)
    {
        var websiteEntity = new Website
        {
            Id = Guid.NewGuid(),
            UserId = GetCurrentUserId(),
            Name = website.Name,
            Type = website.Type,
            Data = JsonSerializer.Serialize(website.Pages), // JSONB column
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Websites.Add(websiteEntity);
        await _context.SaveChangesAsync();

        return Ok(new { id = websiteEntity.Id, name = websiteEntity.Name });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetWebsite(Guid id)
    {
        var website = await _context.Websites
            .FirstOrDefaultAsync(w => w.Id == id && w.UserId == GetCurrentUserId());

        if (website == null) return NotFound();

        var pages = JsonSerializer.Deserialize<Dictionary<string, PageData>>(website.Data);

        return Ok(new
        {
            id = website.Id,
            name = website.Name,
            type = website.Type,
            pages = pages,
            createdAt = website.CreatedAt,
            updatedAt = website.UpdatedAt
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWebsite(Guid id, [FromBody] WebsiteDto website)
    {
        var websiteEntity = await _context.Websites
            .FirstOrDefaultAsync(w => w.Id == id && w.UserId == GetCurrentUserId());

        if (websiteEntity == null) return NotFound();

        websiteEntity.Name = website.Name;
        websiteEntity.Data = JsonSerializer.Serialize(website.Pages);
        websiteEntity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { id = websiteEntity.Id, name = websiteEntity.Name });
    }
}
```

## Data Serialization Notes

1. **Pages Object**: Store as JSONB in PostgreSQL or JSON in other databases
2. **Block Data**: Each block's `data` field can contain any structure - store as JSON
3. **Page Links**: Links like `#page:about` are stored as-is in the data
4. **Media URLs**: Store full URLs or relative paths based on your media storage strategy

## Auto-save Feature

Consider implementing auto-save:

```typescript
// Auto-save every 30 seconds
useEffect(() => {
  if (!id) return; // Don't auto-save new websites

  const autoSaveInterval = setInterval(() => {
    handleSave(); // Silent save
  }, 30000);

  return () => clearInterval(autoSaveInterval);
}, [id, pages, websiteName]);
```

## Migration from Current State

To add save/load functionality:

1. Add `handleSave` function to Builder.tsx
2. Add `useEffect` to load website on mount
3. Connect Save button to `handleSave`
4. Create backend API endpoints
5. Add authentication/authorization checks

