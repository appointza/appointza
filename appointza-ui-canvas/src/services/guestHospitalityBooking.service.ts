import { ActionReq } from "../models/actionreq.model";
import { ActionRes } from "../models/actionres.model";
import { AxiosHelperUtils } from "../utils/axioshelper.utils";
import { getApiErrorMessage } from "../utils/apiError.util";
import { environment } from "../utils/environment";

export type HospitalityBookingQuote = {
  booking_type?: string;
  nights?: number;
  hours?: number;
  duration?: number;
  duration_label?: string;
  room_total?: number;
  extra_bed_total?: number;
  extra_guest_total?: number;
  packages_total?: number;
  services_total?: number;
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  max_extra_beds?: number;
  max_persons?: number;
  extra_bed_charge_per_night?: number;
  price_per_hour?: number;
  minimum_hours?: number;
};

export type GuestHospitalityBookingCreateReq = {
  organisation_id: number;
  organisation_location_id: number;
  room_id: string;
  guest_name: string;
  phone: string;
  email?: string;
  check_in: string;
  check_out: string;
  check_in_time: string;
  check_out_time: string;
  persons: number;
  extra_beds: number;
  package_ids: string[];
  guest_service_ids: string[];
};

export type GuestHospitalityBookingResult = {
  booking_code: string;
  booking_id: string;
  room_number: string;
  room_name: string;
  quote: HospitalityBookingQuote;
  guest_name: string;
  check_in: string;
  check_out: string;
  check_in_time: string;
  check_out_time: string;
  persons: number;
  extra_beds: number;
};

export class GuestHospitalityBookingService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get base(): string {
    return `${environment.baseurl}/api/GuestHospitalityBooking`;
  }

  async index(params: {
    organisationId: number;
    organisationLocationId: number;
    roomId?: string;
    packageId?: string;
    checkIn?: string;
    checkOut?: string;
    checkInTime?: string;
    checkOutTime?: string;
  }) {
    const query = new URLSearchParams();
    query.set("organisationId", String(params.organisationId));
    query.set("organisationLocationId", String(params.organisationLocationId));
    if (params.roomId) query.set("roomId", params.roomId);
    if (params.packageId) query.set("packageId", params.packageId);
    if (params.checkIn) query.set("checkIn", params.checkIn);
    if (params.checkOut) query.set("checkOut", params.checkOut);
    if (params.checkInTime) query.set("checkInTime", params.checkInTime);
    if (params.checkOutTime) query.set("checkOutTime", params.checkOutTime);

    try {
      const resp = await this.http.get<ActionRes<Record<string, unknown>>>(
        `${this.base}/Index?${query.toString()}`,
        true,
      );
      if (resp.error) throw new Error(resp.error);
      return resp.item ?? {};
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Could not load booking details."));
    }
  }

  async quote(params: {
    organisationId: number;
    organisationLocationId: number;
    checkIn: string;
    checkOut: string;
    roomId?: string;
    persons?: number;
    extraBeds?: number;
    packageIds?: string[];
    guestServiceIds?: string[];
    checkInTime?: string;
    checkOutTime?: string;
  }) {
    const query = new URLSearchParams();
    query.set("organisationId", String(params.organisationId));
    query.set("organisationLocationId", String(params.organisationLocationId));
    query.set("checkIn", params.checkIn);
    query.set("checkOut", params.checkOut);
    if (params.roomId) query.set("roomId", params.roomId);
    query.set("persons", String(params.persons ?? 2));
    query.set("extraBeds", String(params.extraBeds ?? 0));
    if (params.packageIds?.length) query.set("packageIds", params.packageIds.join(","));
    if (params.guestServiceIds?.length) query.set("serviceIds", params.guestServiceIds.join(","));
    if (params.checkInTime) query.set("checkInTime", params.checkInTime);
    if (params.checkOutTime) query.set("checkOutTime", params.checkOutTime);

    try {
      const resp = await this.http.get<ActionRes<HospitalityBookingQuote>>(
        `${this.base}/Quote?${query.toString()}`,
        true,
      );
      if (resp.error) throw new Error(resp.error);
      return resp.item ?? null;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Could not calculate price."));
    }
  }

  async create(req: GuestHospitalityBookingCreateReq) {
    try {
      const postdata = new ActionReq<GuestHospitalityBookingCreateReq>();
      postdata.item = req;
      const resp = await this.http.post<ActionRes<GuestHospitalityBookingResult>>(
        `${this.base}/Create`,
        postdata,
        true,
      );
      if (resp.error) throw new Error(resp.error);
      return resp.item ?? null;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Booking failed."));
    }
  }
}
