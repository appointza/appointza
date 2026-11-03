import { ActionRes } from "@/models/actionres.model";
import type {
  CrmPlaceSearchReq,
  CrmPlaceSearchRes,
  CrmSavePlaceAsLeadReq,
} from "@/models/crmLeadDiscovery.model";
import type { Enquiry } from "@/models/enquiry.model";
import type {
  OrganisationLeadFitList,
  OrganisationLeadSalesAction,
  OrganisationSalesProfileSaveReq,
  OrganisationSalesProfileView,
} from "@/models/organisationSalesProfile.model";
import type {
  OrganisationCrmCatalogueOverview,
  OrganisationCrmCatalogueSelectReq,
} from "@/models/organisationCrmCatalogue.model";
import { AxiosHelperUtils } from "@/utils/axioshelper.utils";
import { environment } from "@/utils/environment";

export class OrganisationCrmService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + "/api/OrganisationCrm";
  }

  async getCatalogueOverview(
    req: OrganisationCrmCatalogueSelectReq = {},
  ): Promise<OrganisationCrmCatalogueOverview> {
    const resp = await this.http.post<ActionRes<OrganisationCrmCatalogueOverview>>(
      `${this.baseurl}/GetCatalogueOverview`,
      { item: req },
    );
    if (!resp.item) {
      throw new Error("Failed to load CRM catalogue");
    }
    return resp.item;
  }

  async searchPlaces(req: CrmPlaceSearchReq): Promise<CrmPlaceSearchRes> {
    const resp = await this.http.post<ActionRes<CrmPlaceSearchRes>>(
      `${this.baseurl}/SearchPlaces`,
      { item: req },
    );
    if (!resp.item) {
      throw new Error("Place search failed");
    }
    return resp.item;
  }

  async savePlaceAsLead(req: CrmSavePlaceAsLeadReq): Promise<Enquiry> {
    const resp = await this.http.post<ActionRes<Enquiry>>(
      `${this.baseurl}/SavePlaceAsLead`,
      { item: req },
    );
    if (!resp.item) {
      throw new Error("Could not save lead");
    }
    return resp.item;
  }

  async getSalesProfile(organisationId?: number): Promise<OrganisationSalesProfileView> {
    const resp = await this.http.post<ActionRes<OrganisationSalesProfileView>>(
      `${this.baseurl}/GetSalesProfile`,
      { item: { organisation_id: organisationId } },
    );
    if (!resp.item) {
      throw new Error("Failed to load the sales profile");
    }
    return resp.item;
  }

  async generateSalesProfile(organisationId?: number): Promise<OrganisationSalesProfileView> {
    const resp = await this.http.post<ActionRes<OrganisationSalesProfileView>>(
      `${this.baseurl}/GenerateSalesProfile`,
      { item: { organisation_id: organisationId } },
    );
    if (!resp.item) {
      throw new Error("Failed to generate the sales profile");
    }
    return resp.item;
  }

  async saveSalesProfile(req: OrganisationSalesProfileSaveReq): Promise<OrganisationSalesProfileView> {
    const resp = await this.http.post<ActionRes<OrganisationSalesProfileView>>(
      `${this.baseurl}/SaveSalesProfile`,
      { item: req },
    );
    if (!resp.item) {
      throw new Error("Failed to save the sales profile");
    }
    return resp.item;
  }

  async approveSalesProfile(organisationId?: number): Promise<OrganisationSalesProfileView> {
    const resp = await this.http.post<ActionRes<OrganisationSalesProfileView>>(
      `${this.baseurl}/ApproveSalesProfile`,
      { item: { organisation_id: organisationId } },
    );
    if (!resp.item) {
      throw new Error("Failed to approve the sales profile");
    }
    return resp.item;
  }

  async prepareLeadSalesAction(
    enquiryId: number,
    organisationId?: number,
  ): Promise<OrganisationLeadSalesAction> {
    const resp = await this.http.post<ActionRes<OrganisationLeadSalesAction>>(
      `${this.baseurl}/PrepareLeadSalesAction`,
      { item: { enquiry_id: enquiryId, organisation_id: organisationId } },
    );
    if (!resp.item) {
      throw new Error("Failed to prepare the next sales step");
    }
    return resp.item;
  }

  async listLeadFit(organisationId?: number): Promise<OrganisationLeadFitList> {
    const resp = await this.http.post<ActionRes<OrganisationLeadFitList>>(
      `${this.baseurl}/ListLeadFit`,
      { item: { organisation_id: organisationId } },
    );
    if (!resp.item) {
      throw new Error("Failed to score contacts");
    }
    return resp.item;
  }
}
