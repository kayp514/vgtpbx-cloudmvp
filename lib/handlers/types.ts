export interface HttpApiAction {
  command: string;
  data: string;
}

export interface HttpApiResponse {
  status?: string;
  actions: HttpApiAction[];
  error?: string;
}

export interface FreeswitchEventData {
  session_id?: string; // UUID needed for ESL commands
  variable_originate_disposition?: string;
  variable_dialed_extension?: string;
  variable_domain_name?: string;
  Caller_Context?: string;
  variable_last_busy_dialed_extension?: string;
  variable_forward_busy_enabled?: string;
  variable_forward_busy_destination?: string;
  variable_forward_no_answer_enabled?: string;
  variable_forward_no_answer_destination?: string;
  variable_forward_user_not_registered_enabled?: string;
  variable_forward_user_not_registered_destination?: string;
  variable_missed_call_app?: string;
  variable_missed_call_data?: string;
  [key: string]: any;
}