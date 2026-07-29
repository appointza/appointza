# Index.cshtml - How It Works & Variables Reference

## Overview
This Razor view file is a **Dynamic Template Engine** that:
1. Receives organization data via `OrganizationIndexViewModel`
2. Extracts variables from the model
3. Processes an HTML template (stored in database) by replacing placeholders with actual data
4. Renders the final HTML page

---

## How It Works

### Flow:
1. **Extract Variables** (Lines 3-168): Pulls data from `Model` into local variables
2. **Error Handling** (Lines 170-189): If error exists, shows error page
3. **Template Processing** (Lines 190-616): If template exists, processes it:
   - Replaces simple placeholders (e.g., `{{organisationdetail.name}}`)
   - Handles conditional sections (e.g., `{{#organizationlogo}}...{{/organizationlogo}}`)
   - Loops through collections (services, events, reviews, facilities)
   - Removes unused sections
4. **Output** (Line 615): Renders final HTML using `@Html.Raw()`

---

## All Variables

### 1. **Basic Organization Info** (Lines 8-11)
```csharp
OrganizationName          // Organization name (string)
OrganizationId            // Organization ID (long)
OrganizationLocationId    // Location ID (long)
LocationName              // Location name (string)
```

### 2. **Location Details** (Lines 14-21)
```csharp
Address                   // Address line 1 (string)
City                      // City name (string)
State                     // State name (string)
Pincode                   // Postal code (string)
Country                   // Country name (string)
Latitude                  // GPS latitude (double)
Longitude                 // GPS longitude (double)
GoogleLocation            // Google Maps URL (string)
```

### 3. **Organization Object Properties** (Lines 24-31)
From `Model.Organization` object:
```csharp
OrganisationId                    // Organization ID (long)
OrganisationName                  // Organization name (string)
OrganisationTagline               // Tagline/slogan (string)
OrganisationGstNumber             // GST number (string)
OrganisationLogo                  // Logo image ID (long)
OrganisationPrimaryTypeCode       // Primary type code (string)
OrganisationSecondaryTypeCode     // Secondary type code (string)
OrganisationNotes                 // Notes/description (string)
```

### 4. **LocationDetail Object Properties** (Lines 34-50)
From `Model.LocationDetail` object:
```csharp
LocationDetailId              // Location detail ID (long)
LocationDetailName            // Location name (string)
AddressLine1                  // Address line 1 (string)
AddressLine2                  // Address line 2 (string)
LocationDetailCity            // City (string)
LocationDetailState           // State (string)
LocationDetailCountry         // Country (string)
LocationDetailPincode         // Postal code (string)
LocationDetailLatitude        // Latitude (double)
LocationDetailLongitude       // Longitude (double)
LocationDetailGoogleLocation  // Google Maps URL (string)
LocationDetailCustomUrl       // Custom URL (string)
LocationImages                // List of image IDs (List<long>)
LocationImagesCount           // Count of images (int)
FacilityList                  // Raw facility IDs from DB (List<long>)
FacilityListCount             // Count of facilities (int)
```

### 5. **Location Mobile** (Lines 53-91)
```csharp
LocationMobile    // Extracted from LocationDetail.attributes (string)
                  // Tries "mobile" first, then "phone" property
```

### 6. **Facilities Collection** (Lines 96-97)
```csharp
Facilities        // Display text strings (List<string>)
                  // Converted from FacilityList IDs in HomeController
FacilitiesCount   // Count of facilities (int)
```

### 7. **Services Collection** (Lines 100-107)
Transformed from `Model.Services`:
```csharp
Services          // List of service objects with:
                  //   - Id (long)
                  //   - ServiceName (string)
                  //   - Prize (decimal/float)
                  //   - TimeTaken (int/time)
                  //   - Notes (string)
ServicesCount      // Count of services (int)
```

### 8. **Service Timing Collection** (Lines 111-119)
Transformed from `Model.ServiceTiming`:
```csharp
ServiceTiming      // List of timing objects with:
                   //   - Id (long)
                   //   - DayOfWeek (int: 1=Monday, 7=Sunday)
                   //   - StartTime (string: "HH:mm")
                   //   - EndTime (string: "HH:mm")
                   //   - OrganisationId (long)
                   //   - OrganisationLocationId (long)
ServiceTimingCount // Count of timings (int)
```

### 9. **Events Collection** (Lines 124-139)
Transformed from `Model.Events`:
```csharp
Events             // List of event objects with:
                   //   - Id (long)
                   //   - EventName (string)
                   //   - EventDate (string: "yyyy-MM-dd HH:mm:ss")
                   //   - FromDate (string: "yyyy-MM-dd")
                   //   - ToDate (string: "yyyy-MM-dd")
                   //   - Description (string)
                   //   - EntryAmount (decimal)
                   //   - RemainingSlot (int)
                   //   - Status (string)
                   //   - IsPublic (bool)
                   //   - ImageIds (List<long>)
                   //   - ImageIdsCount (int)
EventsCount         // Count of events (int)
```

### 10. **Reviews Collection** (Lines 142-150)
Transformed from `Model.Reviews`:
```csharp
Reviews            // List of review objects with:
                   //   - Id (long)
                   //   - Rating (int: 1-5)
                   //   - Comment (string)
                   //   - CreatedAt (string: "yyyy-MM-dd HH:mm:ss")
                   //   - ServiceId (long)
                   //   - EventId (long)
ReviewsCount        // Count of reviews (int)
```

### 11. **Template Info** (Lines 153-155)
```csharp
HasTemplate         // Whether template exists (bool)
TemplateHtml        // Raw HTML template from database (string)
TemplateHtmlLength  // Length of template (int)
```

### 12. **Feature Flags** (Lines 158-164)
```csharp
HasServices         // Has services? (bool)
HasServiceTiming    // Has service timings? (bool)
HasEvents           // Has events? (bool)
HasReviews          // Has reviews? (bool)
HasFacilities       // Has facilities? (bool)
HasError            // Has error? (bool)
Error               // Error message (string)
```

### 13. **Base URL** (Line 167)
```csharp
BaseUrl             // Base URL for frontend (string)
                    // From ViewData["BaseUrl"] or Request.Scheme://Request.Host
```

---

## Template Placeholders

### Simple Replacements
These are directly replaced with values:
- `{{organisationdetail.name}}` → OrganizationName
- `{{organisationdetail.tagline}}` → OrganisationTagline
- `{{organisationdetail.organisationlogo}}` → OrganisationLogo (as string)
- `{{organisationdetail.notes}}` → OrganisationNotes
- `{{locationdetail.addressline1}}` → Address
- `{{locationdetail.addressline2}}` → AddressLine2
- `{{locationdetail.city}}` → City
- `{{locationdetail.state}}` → State
- `{{locationdetail.pincode}}` → Pincode
- `{{locationdetail.country}}` → Country
- `{{locationdetail.mobile}}` → LocationMobile
- `{{locationdetail.googlelocation}}` → GoogleLocation
- `{{BOOKNOWURL}}` → `/book-appointment/{OrganizationId}/{OrganizationLocationId}`
- `{{currentyear}}` → Current year
- `{{organizationemail}}` → (empty)

### Conditional Sections
Wrapped with `{{#marker}}...{{/marker}}`:
- `{{#organizationlogo}}...{{/organizationlogo}}` - Shows if logo exists
- `{{#addressline2}}...{{/addressline2}}` - Shows if address line 2 exists
- `{{#country}}...{{/country}}` - Shows if country exists
- `{{#googlemaps}}...{{/googlemaps}}` - Shows if Google location exists
- `{{#coordinates}}...{{/coordinates}}` - Shows if coordinates exist
- `{{#customurl}}...{{/customurl}}` - Shows if custom URL exists
- `{{#gstnumber}}...{{/gstnumber}}` - Shows if GST number exists
- `{{#hasevents}}...{{/hasevents}}` - Shows if events exist
- `{{#events.0}}...{{/events.0}}` - Shows if first event exists

### Loop Sections
Wrapped with `{{#collection}}...{{/collection}}`:

#### Location Images
- `{{#locationimages}}...{{/locationimages}}`
- Placeholder: `{{location_image_id}}`

#### Services
- `{{#orgnaisatinservice}}...{{/orgnaisatinservice}}`
- Placeholders:
  - `{{Servicename}}`
  - `{{prize}}`
  - `{{timetaken}}`
  - `{{notes}}`
  - `{{#service_image_id}}...{{/service_image_id}}` (conditional)

#### Service Timings
- `{{#OrganisationServiceTiming}}...{{/OrganisationServiceTiming}}`
- Placeholders:
  - `{{day_name}}` (e.g., "Monday")
  - `{{day_of_week}}` (1-7)
  - `{{start_time}}` (HH:mm)
  - `{{end_time}}` (HH:mm)

#### Events
- `{{#events}}...{{/events}}` or `{{#../events}}...{{/../events}}`
- Placeholders:
  - `{{event_name}}`
  - `{{event_date}}` (formatted as YYYY-MM-DD)
  - `{{from_date}}`
  - `{{to_date}}`
  - `{{description}}`
  - `{{entry_amount}}`
  - `{{remainingslot}}`
  - `{{status}}`
  - `{{event_image_id}}` (first image ID)
  - `{{EVENTBOOKURL}}` → `/user/events/{eventId}/book`
  - Conditionals: `{{#description}}`, `{{#event_date}}`, `{{#from_date}}`, `{{#to_date}}`, `{{#entry_amount}}`, `{{#remainingslot}}`, `{{#event_image_id}}`

#### Reviews
- `{{#reviews}}...{{/reviews}}`
- Placeholders:
  - `{{rating}}` (1-5)
  - `{{rating_stars}}` (HTML star icons)
  - `{{comment}}`
  - `{{created_at}}`
  - `{{service_id}}`
  - `{{event_id}}`

#### Facilities
- `{{#facilities}}...{{/facilities}}`
- Placeholders:
  - `{{facility_identifier}}` (display text)
  - `{{facility_displaytext}}` (display text)
  - `{{facility_identifier_lower}}` (lowercase, hyphenated)

---

## Processing Logic

### 1. Simple Replacements (Lines 196-212)
Direct string replacement for basic placeholders.

### 2. Conditional Logo (Lines 214-235)
- If logo exists: Remove markers, keep content
- If no logo: Remove entire section between markers

### 3. Location Images Loop (Lines 245-281)
- If images exist: Extract loop template, replace `{{location_image_id}}` for each image
- If no images: Remove entire section

### 4. Services Loop (Lines 283-324)
- If services exist: Extract loop template, replace placeholders for each service
- If no services: Remove markers

### 5. Service Timings Loop (Lines 326-355)
- If timings exist: Extract loop template, replace placeholders for each timing
- Converts day_of_week (1-7) to day names

### 6. Events Processing (Lines 357-536)
- Handles wrapper conditionals first (`{{#hasevents}}`, `{{#events.0}}`)
- Then processes events loop with date formatting
- Handles event image conditionals

### 7. Reviews Loop (Lines 538-575)
- If reviews exist: Extract loop template, generate star HTML, replace placeholders
- If no reviews: Remove markers

### 8. Facilities Loop (Lines 577-609)
- If facilities exist: Extract loop template, replace placeholders
- Converts display text to lowercase hyphenated format
- If no facilities: Remove entire section

### 9. Cleanup (Lines 611-613)
Removes any remaining unused placeholders.

---

## Key Features

1. **Dynamic Template System**: HTML templates stored in database, not hardcoded
2. **Conditional Rendering**: Sections show/hide based on data availability
3. **Collection Loops**: Supports multiple items (services, events, reviews, etc.)
4. **Date Formatting**: Automatically formats dates to readable formats
5. **Image Handling**: Supports image IDs that can be used to generate image URLs
6. **Error Handling**: Graceful error display if data loading fails

---

## Example Template Structure

```html
<div>
  <h1>{{organisationdetail.name}}</h1>
  <p>{{organisationdetail.tagline}}</p>
  
  {{#organizationlogo}}
  <img src="/api/images/{{organisationdetail.organisationlogo}}" />
  {{/organizationlogo}}
  
  <h2>Services</h2>
  {{#orgnaisatinservice}}
  <div>
    <h3>{{Servicename}}</h3>
    <p>Price: {{prize}}</p>
    <p>Duration: {{timetaken}} minutes</p>
  </div>
  {{/orgnaisatinservice}}
  
  <h2>Events</h2>
  {{#hasevents}}
  {{#events}}
  <div>
    <h3>{{event_name}}</h3>
    <p>Date: {{event_date}}</p>
    <p>{{description}}</p>
  </div>
  {{/events}}
  {{/hasevents}}
</div>
```

