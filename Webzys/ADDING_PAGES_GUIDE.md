# Guide: Adding Pages and Linking in Webzys

This guide explains how to add new pages to your Webzys project and link between them.

## Table of Contents
1. [Adding a New Page](#adding-a-new-page)
2. [Linking Between Pages](#linking-between-pages)
3. [Examples](#examples)

---

## Adding a New Page

### Step 1: Create the Page Component

Create a new file in `src/pages/` directory. For example, `About.tsx`:

```tsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <h1>About Page</h1>
      <Link to="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
};

export default About;
```

### Step 2: Import the Page in App.tsx

Add the import at the top of `src/App.tsx`:

```tsx
import About from "./pages/About";
```

### Step 3: Add the Route

Add a route in the `<Routes>` component in `src/App.tsx`:

```tsx
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/about" element={<About />} />
  {/* Add your route BEFORE the catch-all "*" route */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

**Important:** Always add custom routes **before** the catch-all `*` route, otherwise they won't work.

---

## Linking Between Pages

There are two main ways to link between pages in React Router:

### Method 1: Using `<Link>` Component (Recommended)

Use the `Link` component from `react-router-dom` for navigation links:

```tsx
import { Link } from "react-router-dom";

// Simple link
<Link to="/about">About Us</Link>

// Link with button styling
<Link to="/about">
  <Button>About Us</Button>
</Link>

// Link with custom styling
<Link to="/about" className="text-blue-500 hover:underline">
  About Us
</Link>
```

### Method 2: Using `useNavigate` Hook

Use the `useNavigate` hook for programmatic navigation (e.g., after form submission):

```tsx
import { useNavigate } from "react-router-dom";

const MyComponent = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/about");
  };

  return (
    <button onClick={handleClick}>
      Go to About
    </button>
  );
};
```

### Method 3: Using `NavLink` Component

Use `NavLink` for navigation links that need active state styling:

```tsx
import { NavLink } from "@/components/NavLink";

<NavLink 
  to="/about"
  className="nav-link"
  activeClassName="active"
>
  About
</NavLink>
```

---

## Examples

### Example 1: Simple Page with Navigation

```tsx
// src/pages/Contact.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p>Get in touch with us!</p>
      
      <div className="mt-8">
        <Link to="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default Contact;
```

Then add to `App.tsx`:
```tsx
import Contact from "./pages/Contact";

// In Routes:
<Route path="/contact" element={<Contact />} />
```

### Example 2: Page with Dynamic Route

For pages with parameters (e.g., `/user/:id`):

```tsx
// src/pages/UserProfile.tsx
import { useParams, Link } from "react-router-dom";

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div>
      <h1>User Profile: {id}</h1>
      <Link to="/dashboard">Back to Dashboard</Link>
    </div>
  );
};

export default UserProfile;
```

Add route with parameter:
```tsx
<Route path="/user/:id" element={<UserProfile />} />
```

Link to it:
```tsx
<Link to="/user/123">View User 123</Link>
```

### Example 3: Navigation with Query Parameters

```tsx
// Navigate with query params
<Link to="/search?q=webzys&category=tools">
  Search
</Link>

// Or using useNavigate
const navigate = useNavigate();
navigate("/search?q=webzys&category=tools");

// Read query params in component
import { useSearchParams } from "react-router-dom";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");
  const category = searchParams.get("category");
  
  return <div>Searching for: {query} in {category}</div>;
};
```

---

## Common Route Patterns

### Static Routes
```tsx
<Route path="/about" element={<About />} />
<Route path="/contact" element={<Contact />} />
```

### Dynamic Routes
```tsx
<Route path="/user/:id" element={<UserProfile />} />
<Route path="/post/:slug" element={<Post />} />
```

### Nested Routes
```tsx
<Route path="/dashboard" element={<Dashboard />}>
  <Route path="settings" element={<Settings />} />
  <Route path="profile" element={<Profile />} />
</Route>
```

### Optional Parameters
```tsx
<Route path="/blog/:slug?" element={<BlogPost />} />
```

---

## Best Practices

1. **Always add routes before the catch-all route** (`path="*"`)
2. **Use `<Link>` for navigation links** - better for SEO and accessibility
3. **Use `useNavigate` for programmatic navigation** - after form submissions, conditional redirects
4. **Keep page components in `src/pages/`** - maintains organization
5. **Export components as default** - matches the import pattern used in App.tsx

---

## Quick Reference

### File Structure
```
src/
  pages/
    Index.tsx      → Route: /
    About.tsx      → Route: /about
    Contact.tsx    → Route: /contact
    Dashboard.tsx  → Route: /dashboard
  App.tsx          → Contains all routes
```

### Import Pattern
```tsx
// In App.tsx
import About from "./pages/About";
import Contact from "./pages/Contact";
```

### Route Pattern
```tsx
<Route path="/about" element={<About />} />
<Route path="/contact" element={<Contact />} />
```

### Link Pattern
```tsx
<Link to="/about">About</Link>
```

---

## Example: Complete Flow

1. **Create page**: `src/pages/About.tsx`
2. **Import in App.tsx**: `import About from "./pages/About";`
3. **Add route**: `<Route path="/about" element={<About />} />`
4. **Link to it**: `<Link to="/about">About</Link>`

That's it! Your new page is ready.

