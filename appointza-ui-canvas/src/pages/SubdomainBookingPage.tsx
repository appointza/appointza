import { useState, useEffect } from 'react';
import { SiteDetailsService } from '@/services/siteDetails.service';
import { OrganisationLocationService } from '@/services/organisationlocation.service';
import { ReferenceValueService } from '@/services/referencevalue.service';
import { OrganisationLocationSelectReq } from '@/models/organisationlocation.model';
import { environment } from '@/utils/environment';

/**
 * SubdomainBookingPage handles requests from custom subdomains like:
 * appointza-chennai-cuddalore-tamilnadu.localhost:5117
 * 
 * Flow:
 * 1. Backend middleware extracts organization from subdomain
 * 2. Gets organisationlocationid from context
 * 3. Fetches organisationlocation to get templateid
 * 4. Uses templateid to fetch HTML template from referencevalue.description
 * 5. Renders template with real organization location data
 */
const SubdomainBookingPage = () => {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API services
  const siteDetailsService = new SiteDetailsService();
  const organisationLocationService = new OrganisationLocationService();
  const referenceValueService = new ReferenceValueService();

  useEffect(() => {
    const fetchAndRenderTemplate = async () => {
      try {
        console.log('🎯 SubdomainBookingPage: Starting template fetch and render');

        // Get organization location ID from URL subdomain
        const hostname = window.location.hostname;
        console.log('📍 Hostname:', hostname);

        // Extract location info from subdomain
        // Format: {organization}-{area}-{city}-{state}.localhost or .domain
        const subdomainParts = hostname.split('.')[0].split('-');
        
        if (subdomainParts.length < 4) {
          throw new Error('Invalid subdomain format');
        }

        console.log('📍 Subdomain parts:', subdomainParts);

        // For now, we'll need the location ID from API or backend context
        // The backend middleware should provide this somehow
        // Option 1: Use a hidden API endpoint that gives us location ID based on subdomain
        // Option 2: Extract from URL params if redirected
        
        // Let's try fetching from a new API endpoint that returns location by subdomain
        const response = await fetch(`${environment.baseurl}/api/OrganisationLocation/LocationBySubdomain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organisation: subdomainParts[0],
            area: subdomainParts[1],
            city: subdomainParts[2],
            state: subdomainParts.slice(3).join('-') // Handle state names with hyphens
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch location by subdomain: ${response.statusText}`);
        }

        const locationData = await response.json();
        const locationId = locationData.id || locationData.organisationlocationid;

        if (!locationId) {
          throw new Error('Location ID not found for this subdomain');
        }

        console.log('✅ Location ID:', locationId);

        // Step 1: Fetch site details (contains organization data, services, timings, images)
        console.log('📋 Fetching site details for location:', locationId);
        const siteResponse = await siteDetailsService.select(locationId);
        
        if (!siteResponse || siteResponse.length === 0) {
          throw new Error('Site details not found');
        }

        const siteData = siteResponse[0];
        console.log('✅ Site details fetched:', siteData);

        // Step 2: Get templateid from organisationlocation (public endpoint; no auth)
        const locReq = new OrganisationLocationSelectReq();
        locReq.id = locationId;
        locReq.organisationid = siteData.locationdetail?.organisationid ?? 0;
        const locResponse = await organisationLocationService.selectPublic(locReq);
        
        if (!locResponse || locResponse.length === 0) {
          throw new Error('Location not found');
        }

        const location = locResponse[0];
        const templateId = location.templateid;
        console.log('📋 Template ID:', templateId);

        let htmlTemplate = '';

        // Step 3: Fetch HTML template from referencevalue using templateid
        if (templateId && templateId > 0) {
          console.log('📝 Fetching template from ReferenceValue with ID:', templateId);
          
          const templateResponse = await referenceValueService.select({
            id: templateId,
            referencetypeid: 5 // Template reference type
          });

          if (templateResponse && templateResponse.length > 0) {
            // Get HTML from description field
            htmlTemplate = templateResponse[0].description || '';
            console.log('✅ Template HTML loaded:', htmlTemplate.substring(0, 100) + '...');
          } else {
            throw new Error(`Template with ID ${templateId} not found`);
          }
        } else {
          throw new Error('No template assigned to this location');
        }

        // Step 4: Bind template variables with real data
        console.log('🔗 Binding template variables with site data...');
        let html = htmlTemplate;

        // Replace simple variables
        html = html.replace(/\{\{organisationdetail\.name\}\}/g, siteData.organisationdetail?.name || '');
        html = html.replace(/\{\{organisationdetail\.tagline\}\}/g, siteData.organisationdetail?.tagline || '');
        html = html.replace(/\{\{locationdetail\.addressline1\}\}/g, siteData.locationdetail?.addressline1 || '');
        html = html.replace(/\{\{locationdetail\.addressline2\}\}/g, siteData.locationdetail?.addressline2 || '');
        html = html.replace(/\{\{locationdetail\.city\}\}/g, siteData.locationdetail?.city || '');
        html = html.replace(/\{\{locationdetail\.state\}\}/g, siteData.locationdetail?.state || '');
        html = html.replace(/\{\{locationdetail\.pincode\}\}/g, siteData.locationdetail?.pincode || '');

        // Handle images
        if (siteData.locationdetail?.images && siteData.locationdetail.images.length > 0) {
          if (siteData.locationdetail.images.length === 1) {
            const singleImageHtml = `<div class="single-image-container">
              <img src="${environment.baseurl}/api/Files/Get?id=${siteData.locationdetail.images[0]}" alt="Location Image" class="single-image">
            </div>`;
            html = html.replace(/\{\{#if locationdetail\.images\}\}[\s\S]*?\{\{\/if\}\}/g, singleImageHtml);
          } else {
            const imagesHtml = siteData.locationdetail.images.map((imageId: number) =>
              `<img src="${environment.baseurl}/api/Files/Get?id=${imageId}" alt="Location Image" class="gallery-image">`
            ).join('');
            const galleryHtml = `<div class="image-gallery">${imagesHtml}</div>`;
            html = html.replace(/\{\{#if locationdetail\.images\}\}[\s\S]*?\{\{\/if\}\}/g, galleryHtml);
          }
        } else {
          const noImageHtml = `<div class="single-image-container" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-image text-muted" style="font-size: 3rem;"></i>
          </div>`;
          html = html.replace(/\{\{#if locationdetail\.images\}\}[\s\S]*?\{\{\/if\}\}/g, noImageHtml);
        }

        // Handle services loop
        const servicesHtml = siteData.orgnaisatinservice?.map((service: any) =>
          `<div class="service-card">
            <div class="row align-items-center">
              <div class="col-md-8">
                <h4 class="fw-bold mb-2">${service.Servicename}</h4>
                <p class="text-muted mb-3">${service.notes || ''}</p>
              </div>
              <div class="col-md-4 text-md-end">
                ${service.show_price !== false ? `<div class="price mb-2">₹${service.prize}</div>` : ''}
                <span class="badge">${service.timetaken} minutes</span>
              </div>
            </div>
          </div>`
        ).join('') || '';
        html = html.replace(/\{\{#orgnaisatinservice\}\}[\s\S]*?\{\{\/orgnaisatinservice\}\}/g, servicesHtml);

        // Handle timing loop
        const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const timingsHtml = siteData.OrganisationServiceTiming?.map((timing: any) =>
          `<div class="col-md-6 col-lg-4 mb-3">
            <div class="d-flex justify-content-between align-items-center p-3 bg-white rounded">
              <span class="fw-semibold">${dayNames[timing.day_of_week] || `Day ${timing.day_of_week}`}</span>
              <span class="text-primary fw-semibold">${timing.start_time} - ${timing.end_time}</span>
            </div>
          </div>`
        ).join('') || '';
        html = html.replace(/\{\{#OrganisationServiceTiming\}\}[\s\S]*?\{\{\/OrganisationServiceTiming\}\}/g, timingsHtml);

        console.log('✅ Template bound with data');
        setRenderedHtml(html);
        setError(null);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('❌ Error:', errorMessage);
        setError(errorMessage);

        // Show user-friendly error page
        setRenderedHtml(`
<!DOCTYPE html>
<html>
<head>
    <title>Error</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .error-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 500px;
            text-align: center;
        }
        .error-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        h1 {
            color: #dc2626;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        p {
            color: #666;
            margin: 10px 0;
            line-height: 1.6;
        }
        .error-message {
            background: #fee;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
            border-radius: 4px;
            color: #333;
            font-family: monospace;
            font-size: 13px;
        }
        .support-link {
            margin-top: 30px;
        }
        a {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h1>Unable to Load Booking Page</h1>
        <p>We encountered an error while loading your booking page.</p>
        <div class="error-message">${errorMessage}</div>
        <p>Please try the following:</p>
        <ul style="text-align: left; color: #666;">
            <li>Check that the URL is correct</li>
            <li>Refresh the page</li>
            <li>Contact support if the problem persists</li>
        </ul>
        <div class="support-link">
            <a href="javascript:location.reload()">🔄 Refresh Page</a>
        </div>
    </div>
</body>
</html>`);
      } finally {
        setLoading(false);
      }
    };

    fetchAndRenderTemplate();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>Loading your booking page...</h2>
          <p>Please wait while we prepare your booking page.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        srcDoc={renderedHtml}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Booking Page"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default SubdomainBookingPage;
