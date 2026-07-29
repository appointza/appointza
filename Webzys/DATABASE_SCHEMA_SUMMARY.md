# Database Tables Summary for Webzys

## Minimum Required: **1 Table**

### Single Table Approach (Simplest)

**Table: `websites`**
```sql
CREATE TABLE websites (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,  -- 'normal' or 'appointza'
  data JSONB NOT NULL,         -- Stores entire pages object
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**What's stored in `data` JSONB column:**
```json
{
  "home": {
    "id": "home",
    "name": "Home",
    "blocks": [
      {
        "id": "hero-1",
        "type": "hero",
        "data": { "title": "...", "subtitle": "..." },
        "visible": true
      }
    ]
  },
  "about": { ... }
}
```

**Pros:**
- ✅ Only 1 table needed
- ✅ Simple to implement
- ✅ Fast reads/writes
- ✅ Easy to backup/restore

**Cons:**
- ❌ Can't query individual blocks easily
- ❌ Can't search across websites for specific block types
- ❌ Large JSONB can be slower for complex queries

---

## Recommended: **3 Tables** (Normalized)

### Table 1: `websites`
```sql
CREATE TABLE websites (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Table 2: `website_pages`
```sql
CREATE TABLE website_pages (
  id UUID PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  page_id VARCHAR(100) NOT NULL,  -- e.g., "home", "about"
  name VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(website_id, page_id)
);
```

### Table 3: `website_blocks`
```sql
CREATE TABLE website_blocks (
  id UUID PRIMARY KEY,
  page_id UUID REFERENCES website_pages(id) ON DELETE CASCADE,
  block_id VARCHAR(100) NOT NULL,  -- e.g., "hero-1"
  block_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,  -- Block-specific data
  visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(page_id, block_id)
);
```

**Pros:**
- ✅ Can query individual blocks
- ✅ Can search/filter by block type
- ✅ Better for analytics
- ✅ Easier to update single blocks
- ✅ Better performance for large websites

**Cons:**
- ❌ More complex queries (JOINs needed)
- ❌ More tables to manage

---

## If You Need Media Management: **+1 Table**

### Table 4: `website_media` (Optional)
```sql
CREATE TABLE website_media (
  id UUID PRIMARY KEY,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  name VARCHAR(255),
  size BIGINT,
  type VARCHAR(50),
  uploaded_at TIMESTAMP
);
```

---

## Summary

| Approach | Tables Needed | Best For |
|----------|--------------|----------|
| **Minimal** | **1 table** | Small projects, simple use cases |
| **Recommended** | **3 tables** | Production apps, need flexibility |
| **With Media** | **4 tables** | Full-featured with media management |

## My Recommendation

**Start with 1 table** (`websites` with JSONB) for MVP, then migrate to 3 tables if you need:
- Search functionality
- Analytics on block usage
- Better performance at scale
- Individual block updates without loading entire website

---

## Quick Comparison

**1 Table Approach:**
```sql
-- Save entire website
INSERT INTO websites (id, user_id, name, type, data) 
VALUES (?, ?, ?, ?, ?::jsonb);

-- Load entire website
SELECT data FROM websites WHERE id = ?;
```

**3 Tables Approach:**
```sql
-- Save website (requires multiple inserts)
INSERT INTO websites ...;
INSERT INTO website_pages ...;
INSERT INTO website_blocks ...;

-- Load website (requires JOINs)
SELECT w.*, wp.*, wb.* 
FROM websites w
LEFT JOIN website_pages wp ON w.id = wp.website_id
LEFT JOIN website_blocks wb ON wp.id = wb.page_id
WHERE w.id = ?;
```

