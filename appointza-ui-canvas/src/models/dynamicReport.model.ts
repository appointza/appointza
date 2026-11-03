export type ReportOptionItem = {
  label: string;
  value: string;
};

export type ReportParameterDto = {
  id?: number;
  report_id?: number;
  parameter_name: string;
  display_name: string;
  data_type: string;
  input_type: string;
  is_required: boolean;
  is_visible: boolean;
  default_value: string;
  options_source: string;
  options_config: string;
  sort_order: number;
  resolved_options?: ReportOptionItem[];
};

export type ReportColumnDto = {
  id?: number;
  report_id?: number;
  column_key: string;
  display_name: string;
  is_visible: boolean;
  format_type: string;
  sort_order: number;
};

export type ReportChartDto = {
  id?: number;
  report_id?: number;
  chart_type: string;
  x_column: string;
  y_column: string;
  title: string;
  is_enabled: boolean;
};

export type ReportPermissionDto = {
  id?: number;
  report_id?: number;
  organisation_id?: number | null;
  role_key: string;
  can_view: boolean;
  can_export: boolean;
};

export type ReportDefinitionDto = {
  id: number;
  name: string;
  description: string;
  category: string;
  sql_query: string;
  is_active: boolean;
  is_published: boolean;
  export_excel: boolean;
  export_csv: boolean;
  export_pdf: boolean;
  max_rows: number;
  timeout_seconds: number;
  version?: number;
  created_at?: string;
  updated_at?: string;
  parameters: ReportParameterDto[];
  columns: ReportColumnDto[];
  chart?: ReportChartDto | null;
  permissions: ReportPermissionDto[];
};

export type ReportListItemDto = {
  id: number;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  is_published: boolean;
  export_excel: boolean;
  export_csv: boolean;
  export_pdf: boolean;
  updated_at: string;
};

export type ReportValidateResult = {
  is_valid: boolean;
  errors: string[];
  detected_parameters: string[];
  warnings: string[];
};

export type ReportExecutionResult = {
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  duration_ms: number;
  report?: ReportDefinitionDto | null;
};

export type ReportDefinitionUpsertReq = Omit<
  ReportDefinitionDto,
  "id" | "version" | "created_at" | "updated_at"
> & { id?: number | null };
