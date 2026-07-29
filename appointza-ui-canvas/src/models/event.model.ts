export class Event {
  id: number = 0
  organisation_id: number = 0
  organisation_location_id: number = 0
  event_name: string = ""
  event_type: string = "single" // 'single', 'range', 'daily'
  event_date: string | null = null
  from_date: string | null = null
  to_date: string | null = null
  start_time: string = ''
  end_time: string = ''
  timing_config: Event.TimingConfigData = new Event.TimingConfigData()
  payment_type: string = "userpay" // 'clientpay', 'userpay'
  entry_amount: number = 0
  slot_limit: number = 0
  remainingslot: number = 0
  dress_code: string = ""
  location: string = ""
  description: string = ""
  images: Event.ImagesData = new Event.ImagesData()
  is_public: boolean = true
  status: string = "active" // 'active', 'completed', 'cancelled'
  rating: number | null = null
  created_by: number = 0
  created_at: Date = new Date()
  updated_at: Date = new Date()
  notes: string = ""
  isactive: boolean = true
}

export namespace Event {
  export class TimingConfigData {
    Days?: { [key: string]: string[] } = {}
    StartTime?: string = ""
    EndTime?: string = ""
  }

  export class ImagesData {
    ImageIds: number[] = []
  }
}

export class EventSelectReq {
  id: number = 0
  organisation_id: number = 0
  organisation_location_id: number = 0
  status: string = ""
  is_public: boolean = true
  include_past: boolean = false
}

export class EventDeleteReq {
  id: number = 0
}

