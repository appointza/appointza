export class Review {
  id: number = 0
  user_id: number = 0
  organisation_service_id: number | null = null
  event_id: number | null = null
  rating: number = 0
  comment: string = ""
  created_at: Date = new Date()
  updated_at: Date = new Date()
  isactive: boolean = true
}

export class ReviewSelectReq {
  id: number = 0
  user_id: number = 0
  organisation_service_id: number | null = null
  event_id: number | null = null
}

export class ReviewDeleteReq {
  id: number = 0
}

