import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  ReferenceValue,
  ReferenceValueSelectReq,
  ReferenceValueDeleteReq,
} from '../models/referencevalue.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';
import { WebsiteService } from './website.service';
import { WebsiteSelectReq } from '../models/website.model';

export class ReferenceValueService {
  baseurl: string;
  http: AxiosHelperUtils;
  websiteService: WebsiteService;
  
  constructor() {
    this.baseurl = environment.baseurl + '/api/ReferenceValue';
    this.http = new AxiosHelperUtils();
    this.websiteService = new WebsiteService();
  }

  async select(req: ReferenceValueSelectReq) {
    let postdata: ActionReq<ReferenceValueSelectReq> = new ActionReq<ReferenceValueSelectReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<ReferenceValue[]>>(
      this.baseurl + '/Select',
      postdata,
      false, // Requires authentication
    );
    
    const referenceValues = resp.item || [];
    
    // Fetch websites and map website names to identifier and displaytext
    try {
      const websiteService = new WebsiteService();
      const websites = await websiteService.select({
        id: 0,
        user_id: 0,
        type: ''
      });
      
      // Create a map of website ID to website name
      const websiteMap = new Map<number, string>();
      websites.forEach(website => {
        websiteMap.set(website.id, website.name);
      });
      
      // Update reference values with website names
      // Match by checking if identifier contains website ID, is a direct website ID, or stored in attributes
      referenceValues.forEach(refValue => {
        let websiteId: number | null = null;
        
        // Check if identifier is a direct website ID (e.g., "3")
        const identifierAsNumber = parseInt(refValue.identifier, 10);
        if (!isNaN(identifierAsNumber) && identifierAsNumber > 0) {
          websiteId = identifierAsNumber;
        }
        
        // Try to extract website ID from identifier (e.g., "website_3", "website-3", "Exported website: Untitled Website (ID: 3)")
        if (!websiteId) {
          const websiteIdMatch = refValue.identifier.match(/(?:ID[:\s]+|id[:\s]+)?(\d+)/i);
          if (websiteIdMatch) {
            websiteId = parseInt(websiteIdMatch[1], 10);
          }
        }
        
        // Check attributes field for website_id
        if (!websiteId && refValue.attributes) {
          if (typeof refValue.attributes === 'object') {
            websiteId = refValue.attributes.website_id || refValue.attributes.websiteId || refValue.attributes.id || null;
          }
        }
        
        // If we found a website ID, update identifier and displaytext with website name
        if (websiteId && websiteId > 0) {
          const websiteName = websiteMap.get(websiteId);
          if (websiteName) {
            refValue.identifier = websiteName;
            refValue.displaytext = websiteName;
          }
        }
      });
    } catch (error) {
      console.error('Error fetching websites for reference value mapping:', error);
      // Continue with original reference values if website fetch fails
    }
    
    return referenceValues;
  }

  async insert(referenceValue: ReferenceValue) {
    let postdata: ActionReq<ReferenceValue> = new ActionReq<ReferenceValue>();
    postdata.item = referenceValue;
    let resp = await this.http.post<ActionRes<ReferenceValue>>(
      this.baseurl + '/Insert',
      postdata,
      false, // Requires authentication
    );
    return resp.item!;
  }

  async update(referenceValue: ReferenceValue) {
    let postdata: ActionReq<ReferenceValue> = new ActionReq<ReferenceValue>();
    postdata.item = referenceValue;
    let resp = await this.http.post<ActionRes<ReferenceValue>>(
      this.baseurl + '/Update',
      postdata,
      false, // Requires authentication
    );
    return resp.item!;
  }

  async save(referenceValue: ReferenceValue) {
    let postdata: ActionReq<ReferenceValue> = new ActionReq<ReferenceValue>();
    postdata.item = referenceValue;
    let resp = await this.http.post<ActionRes<ReferenceValue>>(
      this.baseurl + '/Save',
      postdata,
      false, // Requires authentication
    );
    return resp.item!;
  }

  async delete(req: ReferenceValueDeleteReq) {
    let postdata: ActionReq<ReferenceValueDeleteReq> = new ActionReq<ReferenceValueDeleteReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/Delete',
      postdata,
      false, // Requires authentication
    );
    return resp.item!;
  }
}

