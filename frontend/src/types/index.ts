/**
 * CargoSync — TypeScript interfaces matching the backend schemas
 */

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  role: string;
  company_id?: string;
  company_name?: string;
  user_type: 'admin' | 'user';
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  created_at: string;
}

export interface Driver {
  id: string;
  company_id: string;
  name: string;
  email?: string;
  phone?: string;
  license_number?: string;
  license_expiry?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  truck_plate?: string;
}

export interface Truck {
  id: string;
  company_id: string;
  truck_name: string;
  plate_number: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  max_weight_kg: number;
  driver_name?: string;
  driver_id?: string;
  availability_schedule?: string;
  is_active: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  truck_id?: string;
  job_name: string;
  date: string;
  time_window?: string;
  status: JobStatus;
  packing_data?: string;
  created_at: string;
  box_count?: number;
  delivery_count?: number;
}

export type JobStatus =
  | 'draft'
  | 'posted'
  | 'matched'
  | 'accepted'
  | 'loading'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered';

export interface JobDetail extends Job {
  boxes: Box[];
  deliveries: Delivery[];
  truck?: Truck;
}

export interface Box {
  id: string;
  job_id: string;
  label_reference: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_kg: number;
  stop_order: number;
  fragile: boolean;
  hazard: boolean;
  qr_code?: string;
  pack_x?: number;
  pack_y?: number;
  pack_z?: number;
  pack_rotation?: number;
  created_at: string;
}

export interface Delivery {
  id: string;
  job_id: string;
  box_id?: string;
  stop_order: number;
  recipient_name: string;
  address?: string;
  signature_url?: string;
  photo_url?: string;
  gps_lat?: number;
  gps_lng?: number;
  notes?: string;
  delivered_at?: string;
  status: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  job_id: string;
  box_id?: string;
  user_id?: string;
  action: string;
  details?: string;
  gps_lat?: number;
  gps_lng?: number;
  scanned_at: string;
}

export interface PackingResult {
  placements: Placement[];
  unpacked: { id: string; label: string; reason: string }[];
  efficiency: number;
  total_weight: number;
  weight_capacity_used: number;
  truck_dimensions: { length: number; width: number; height: number };
}

export interface Placement {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
  rotation: number;
  stop_order: number;
  fragile: boolean;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}
