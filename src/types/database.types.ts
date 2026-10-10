export type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
export type Database = {
    "graphql_public": {
        Tables: {
            [_ in never]: never;
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            "graphql": {
                Args: {
                    "extensions"?: Json;
                    "operationName"?: string;
                    "query"?: string;
                    "variables"?: Json;
                };
                Returns: Json;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
    "public": {
        Tables: {
            "diagnostic_trees": {
                Row: {
                    "category": string | null;
                    "created_at": string | null;
                    "description": string | null;
                    "difficulty": string | null;
                    "id": string;
                    "motorcycle_id": string | null;
                    "title": string;
                    "tree_data": NonNullable<Json>;
                };
                Insert: {
                    "category"?: string | null;
                    "created_at"?: string | null;
                    "description"?: string | null;
                    "difficulty"?: string | null;
                    "id"?: string;
                    "motorcycle_id"?: string | null;
                    "title": string;
                    "tree_data": NonNullable<Json>;
                };
                Update: {
                    "category"?: string | null;
                    "created_at"?: string | null;
                    "description"?: string | null;
                    "difficulty"?: string | null;
                    "id"?: string;
                    "motorcycle_id"?: string | null;
                    "title"?: string;
                    "tree_data"?: NonNullable<Json>;
                };
                Relationships: [
                    {
                        foreignKeyName: "diagnostic_trees_motorcycle_id_fkey";
                        columns: [
                            "motorcycle_id"
                        ];
                        isOneToOne: false;
                        referencedRelation: "motorcycles";
                        referencedColumns: [
                            "id"
                        ];
                    }
                ];
            };
            "document_chunks": {
                Row: {
                    "chunk_index": number;
                    "content": string;
                    "content_length": number;
                    "content_type": string;
                    "created_at": string | null;
                    "document_source_id": string;
                    "embedding": string;
                    "id": string;
                    "make": string | null;
                    "model": string | null;
                    "motorcycle_id": string | null;
                    "page_numbers": (number)[] | null;
                    "section_hierarchy": (string)[] | null;
                    "section_title": string | null;
                };
                Insert: {
                    "chunk_index": number;
                    "content": string;
                    "content_length": number;
                    "content_type"?: string;
                    "created_at"?: string | null;
                    "document_source_id": string;
                    "embedding": string;
                    "id"?: string;
                    "make"?: string | null;
                    "model"?: string | null;
                    "motorcycle_id"?: string | null;
                    "page_numbers"?: (number)[] | null;
                    "section_hierarchy"?: (string)[] | null;
                    "section_title"?: string | null;
                };
                Update: {
                    "chunk_index"?: number;
                    "content"?: string;
                    "content_length"?: number;
                    "content_type"?: string;
                    "created_at"?: string | null;
                    "document_source_id"?: string;
                    "embedding"?: string;
                    "id"?: string;
                    "make"?: string | null;
                    "model"?: string | null;
                    "motorcycle_id"?: string | null;
                    "page_numbers"?: (number)[] | null;
                    "section_hierarchy"?: (string)[] | null;
                    "section_title"?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "document_chunks_document_source_id_fkey";
                        columns: [
                            "document_source_id"
                        ];
                        isOneToOne: false;
                        referencedRelation: "document_sources";
                        referencedColumns: [
                            "id"
                        ];
                    },
                    {
                        foreignKeyName: "document_chunks_motorcycle_id_fkey";
                        columns: [
                            "motorcycle_id"
                        ];
                        isOneToOne: false;
                        referencedRelation: "motorcycles";
                        referencedColumns: [
                            "id"
                        ];
                    }
                ];
            };
            "document_sources": {
                Row: {
                    "created_at": string | null;
                    "file_hash": string | null;
                    "file_path": string | null;
                    "id": string;
                    "make": string | null;
                    "manual_type": string | null;
                    "model": string | null;
                    "motorcycle_id": string | null;
                    "processed_at": string | null;
                    "processing_error": string | null;
                    "processing_status": string;
                    "source_type": string;
                    "title": string;
                    "total_pages": number | null;
                    "year_end": number | null;
                    "year_start": number | null;
                };
                Insert: {
                    "created_at"?: string | null;
                    "file_hash"?: string | null;
                    "file_path"?: string | null;
                    "id"?: string;
                    "make"?: string | null;
                    "manual_type"?: string | null;
                    "model"?: string | null;
                    "motorcycle_id"?: string | null;
                    "processed_at"?: string | null;
                    "processing_error"?: string | null;
                    "processing_status"?: string;
                    "source_type": string;
                    "title": string;
                    "total_pages"?: number | null;
                    "year_end"?: number | null;
                    "year_start"?: number | null;
                };
                Update: {
                    "created_at"?: string | null;
                    "file_hash"?: string | null;
                    "file_path"?: string | null;
                    "id"?: string;
                    "make"?: string | null;
                    "manual_type"?: string | null;
                    "model"?: string | null;
                    "motorcycle_id"?: string | null;
                    "processed_at"?: string | null;
                    "processing_error"?: string | null;
                    "processing_status"?: string;
                    "source_type"?: string;
                    "title"?: string;
                    "total_pages"?: number | null;
                    "year_end"?: number | null;
                    "year_start"?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "document_sources_motorcycle_id_fkey";
                        columns: [
                            "motorcycle_id"
                        ];
                        isOneToOne: false;
                        referencedRelation: "motorcycles";
                        referencedColumns: [
                            "id"
                        ];
                    }
                ];
            };
            "dtc_codes": {
                Row: {
                    "applies_to_makes": (string)[] | null;
                    "category": string | null;
                    "code": string;
                    "common_causes": (string)[] | null;
                    "created_at": string | null;
                    "description": string;
                    "diagnostic_method": string | null;
                    "fix_reference": string | null;
                    "id": string;
                    "manufacturer": string | null;
                    "severity": string | null;
                    "subcategory": string | null;
                    "system": string | null;
                };
                Insert: {
                    "applies_to_makes"?: (string)[] | null;
                    "category"?: string | null;
                    "code": string;
                    "common_causes"?: (string)[] | null;
                    "created_at"?: string | null;
                    "description": string;
                    "diagnostic_method"?: string | null;
                    "fix_reference"?: string | null;
                    "id"?: string;
                    "manufacturer"?: string | null;
                    "severity"?: string | null;
                    "subcategory"?: string | null;
                    "system"?: string | null;
                };
                Update: {
                    "applies_to_makes"?: (string)[] | null;
                    "category"?: string | null;
                    "code"?: string;
                    "common_causes"?: (string)[] | null;
                    "created_at"?: string | null;
                    "description"?: string;
                    "diagnostic_method"?: string | null;
                    "fix_reference"?: string | null;
                    "id"?: string;
                    "manufacturer"?: string | null;
                    "severity"?: string | null;
                    "subcategory"?: string | null;
                    "system"?: string | null;
                };
                Relationships: [
                ];
            };
            "extraction_jobs": {
                Row: {
                    "chunks_used": (string)[] | null;
                    "completed_at": string | null;
                    "completion_tokens": number | null;
                    "cost_usd": number | null;
                    "created_at": string | null;
                    "document_source_id": string;
                    "error_message": string | null;
                    "extraction_type": string;
                    "id": string;
                    "llm_model": string | null;
                    "prompt_tokens": number | null;
                    "result_data": Json | null;
                    "review_notes": string | null;
                    "status": string;
                    "target_table": string;
                };
                Insert: {
                    "chunks_used"?: (string)[] | null;
                    "completed_at"?: string | null;
                    "completion_tokens"?: number | null;
                    "cost_usd"?: number | null;
                    "created_at"?: string | null;
                    "document_source_id": string;
                    "error_message"?: string | null;
                    "extraction_type": string;
                    "id"?: string;
                    "llm_model"?: string | null;
                    "prompt_tokens"?: number | null;
                    "result_data"?: Json | null;
                    "review_notes"?: string | null;
                    "status"?: string;
                    "target_table": string;
                };
                Update: {
                    "chunks_used"?: (string)[] | null;
                    "completed_at"?: string | null;
                    "completion_tokens"?: number | null;
                    "cost_usd"?: number | null;
                    "created_at"?: string | null;
                    "document_source_id"?: string;
                    "error_message"?: string | null;
                    "extraction_type"?: string;
                    "id"?: string;
                    "llm_model"?: string | null;
                    "prompt_tokens"?: number | null;
                    "result_data"?: Json | null;
                    "review_notes"?: string | null;
                    "status"?: string;
                    "target_table"?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "extraction_jobs_document_source_id_fkey";
                        columns: [
                            "document_source_id"
                        ];
                        isOneToOne: false;
                        referencedRelation: "document_sources";
                        referencedColumns: [
                            "id"
                        ];
                    }
                ];
            };
            "garage_bikes": {
                Row: {
                    "archived_at": string | null;
                    "created_at": string;
                    "file_cleanup_pending": boolean;
                    "id": string;
                    "import_key": string | null;
                    "make": string;
                    "market": string;
                    "mileage_km": number | null;
                    "model": string;
                    "motorcycle_id": string | null;
                    "nickname": string;
                    "owner_id": string;
                    "photo_path": string | null;
                    "registration": string;
                    "variant": string;
                    "year": number | null;
                };
                Insert: {
                    "archived_at"?: string | null;
                    "created_at"?: string;
                    "file_cleanup_pending"?: boolean;
                    "id": string;
                    "import_key"?: string | null;
                    "make": string;
                    "market"?: string;
                    "mileage_km"?: number | null;
                    "model": string;
                    "motorcycle_id"?: string | null;
                    "nickname"?: string;
                    "owner_id": string;
                    "photo_path"?: string | null;
                    "registration"?: string;
                    "variant"?: string;
                    "year"?: number | null;
                };
                Update: {
                    "archived_at"?: string | null;
                    "created_at"?: string;
                    "file_cleanup_pending"?: boolean;
                    "id"?: string;
                    "import_key"?: string | null;
                    "make"?: string;
                    "market"?: string;
                    "mileage_km"?: number | null;
                    "model"?: string;
                    "motorcycle_id"?: string | null;
                    "nickname"?: string;
                    "owner_id"?: string;
                    "photo_path"?: string | null;
                    "registration"?: string;
                    "variant"?: string;
                    "year"?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "garage_bikes_motorcycle_id_fkey";
                        columns: [
                            "motorcycle_id"
                        ];
                        isOneToOne: false;
                        referencedRelation: "motorcycles";
                        referencedColumns: [
                            "id"
                        ];
                    }
                ];
            };
            "garage_file_states": {
                Row: {
                    "bike_id": string;
                    "id": string;
                    "job_id": string | null;
                    "kind": string;
                    "owner_id": string;
                    "path": string;
                    "state": string;
                };
                Insert: {
                    "bike_id": string;
                    "id": string;
                    "job_id"?: string | null;
                    "kind": string;
                    "owner_id": string;
                    "path": string;
                    "state": string;
                };
                Update: {
                    "bike_id"?: string;
                    "id"?: string;
                    "job_id"?: string | null;
                    "kind"?: string;
                    "owner_id"?: string;
                    "path"?: string;
                    "state"?: string;
                };
                Relationships: [
                ];
            };
            "garage_files": {
                Row: {
                    "bike_id": string;
                    "cleanup_pending": boolean;
                    "created_at": string;
                    "filename": string;
                    "id": string;
                    "job_id": string | null;
                    "kind": string;
                    "owner_id": string;
                    "path": string;
                    "source_pending": boolean;
                };
                Insert: {
                    "bike_id": string;
                    "cleanup_pending"?: boolean;
                    "created_at"?: string;
                    "filename": string;
                    "id": string;
                    "job_id"?: string | null;
                    "kind": string;
                    "owner_id": string;
                    "path": string;
                    "source_pending"?: boolean;
                };
                Update: {
                    "bike_id"?: string;
                    "cleanup_pending"?: boolean;
                    "created_at"?: string;
                    "filename"?: string;
                    "id"?: string;
                    "job_id"?: string | null;
                    "kind"?: string;
                    "owner_id"?: string;
                    "path"?: string;
                    "source_pending"?: boolean;
                };
                Relationships: [
                    {
                        foreignKeyName: "garage_files_owner_id_bike_id_fkey";
                        columns: [
                            "owner_id",
                            "bike_id"
                        ];
                        isOneToOne: false;
                        referencedRelation: "garage_bikes";
                        referencedColumns: [
                            "owner_id",
                            "id"
                        ];
                    },
                    {
                        foreignKeyName: "garage_files_owner_id_bike_id_job_id_fkey";
                        columns: [
                            "owner_id",
                            "bike_id",
                            "job_id"
                        ];
                        isOneToOne: false;
                        referencedRelation: "maintenance_jobs";
                        referencedColumns: [
                            "owner_id",
                            "bike_id",
                            "id"
                        ];
                    }
                ];
            };
            "glossary_terms": {
                Row: {
                    "aliases": (string)[] | null;
                    "applies_to": (string)[] | null;
                    "category": string;
                    "created_at": string | null;
                    "definition": string;
                    "difficulty": string | null;
                    "id": string;
                    "illustration_url": string | null;
                    "related_terms": (string)[] | null;
                    "slug": string;
                    "subcategory": string | null;
                    "term": string;
                };
                Insert: {
                    "aliases"?: (string)[] | null;
                    "applies_to"?: (string)[] | null;
                    "category": string;
                    "created_at"?: string | null;
                    "definition": string;
                    "difficulty"?: string | null;
                    "id"?: string;
                    "illustration_url"?: string | null;
                    "related_terms"?: (string)[] | null;
                    "slug": string;
                    "subcategory"?: string | null;
                    "term": string;
                };
                Update: {
                    "aliases"?: (string)[] | null;
                    "applies_to"?: (string)[] | null;
                    "category"?: string;
                    "created_at"?: string | null;
                    "definition"?: string;
                    "difficulty"?: string | null;
                    "id"?: string;
                    "illustration_url"?: string | null;
                    "related_terms"?: (string)[] | null;
                    "slug"?: string;
                    "subcategory"?: string | null;
                    "term"?: string;
                };
                Relationships: [
                ];
            };
            "maintenance_jobs": {
                Row: {
                    "bike_id": string;
                    "close_reason": string | null;
                    "closed_at": string | null;
                    "cost_minor": number | null;
                    "created_at": string;
                    "currency": string | null;
                    "file_cleanup_pending": boolean;
                    "id": string;
                    "job_date": string;
                    "mileage_km": number;
                    "notes": string;
                    "owner_id": string;
                    "parts": string;
                    "performer": string;
                    "revision": number;
                    "status": string;
                    "tasks": NonNullable<Json>;
                    "template_id": string | null;
                    "template_snapshot": Json | null;
                    "template_version": number | null;
                    "title": string;
                };
                Insert: {
                    "bike_id": string;
                    "close_reason"?: string | null;
                    "closed_at"?: string | null;
                    "cost_minor"?: number | null;
                    "created_at"?: string;
                    "currency"?: string | null;
                    "file_cleanup_pending"?: boolean;
                    "id": string;
                    "job_date": string;
                    "mileage_km": number;
                    "notes"?: string;
                    "owner_id": string;
                    "parts"?: string;
                    "performer"?: string;
                    "revision"?: number;
                    "status": string;
                    "tasks": NonNullable<Json>;
                    "template_id"?: string | null;
                    "template_snapshot"?: Json | null;
                    "template_version"?: number | null;
                    "title": string;
                };
                Update: {
                    "bike_id"?: string;
                    "close_reason"?: string | null;
                    "closed_at"?: string | null;
                    "cost_minor"?: number | null;
                    "created_at"?: string;
                    "currency"?: string | null;
                    "file_cleanup_pending"?: boolean;
                    "id"?: string;
                    "job_date"?: string;
                    "mileage_km"?: number;
                    "notes"?: string;
                    "owner_id"?: string;
                    "parts"?: string;
                    "performer"?: string;
                    "revision"?: number;
                    "status"?: string;
                    "tasks"?: NonNullable<Json>;
                    "template_id"?: string | null;
                    "template_snapshot"?: Json | null;
                    "template_version"?: number | null;
                    "title"?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "maintenance_jobs_owner_id_bike_id_fkey";
                        columns: [
                            "owner_id",
                            "bike_id"
                        ];
                        isOneToOne: false;
                        referencedRelation: "garage_bikes";
                        referencedColumns: [
                            "owner_id",
                            "id"
                        ];
                    }
                ];
            };
            "motorcycle_images": {
                Row: {
                    "alt_text": string;
                    "created_at": string | null;
                    "id": string;
                    "image_url": string;
                    "is_primary": boolean | null;
                    "motorcycle_id": string;
                    "source_attribution": string | null;
                };
                Insert: {
                    "alt_text": string;
                    "created_at"?: string | null;
                    "id"?: string;
                    "image_url": string;
                    "is_primary"?: boolean | null;
                    "motorcycle_id": string;
                    "source_attribution"?: string | null;
                };
                Update: {
                    "alt_text"?: string;
                    "created_at"?: string | null;
                    "id"?: string;
                    "image_url"?: string;
                    "is_primary"?: boolean | null;
                    "motorcycle_id"?: string;
                    "source_attribution"?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "motorcycle_images_motorcycle_id_fkey";
                        columns: [
                            "motorcycle_id"
                        ];
                        isOneToOne: false;
                        referencedRelation: "motorcycles";
                        referencedColumns: [
                            "id"
                        ];
                    }
                ];
            };
            "motorcycles": {
                Row: {
                    "category": string | null;
                    "coolant_capacity_liters": number | null;
                    "created_at": string | null;
                    "displacement_cc": number | null;
                    "dry_weight_kg": number | null;
                    "engine_type": string | null;
                    "fuel_capacity_liters": number | null;
                    "fuel_system": string | null;
                    "generation": string | null;
                    "horsepower": number | null;
                    "id": string;
                    "image_url": string | null;
                    "make": string;
                    "model": string;
                    "oil_capacity_liters": number | null;
                    "spark_plug": string | null;
                    "tire_front": string | null;
                    "tire_rear": string | null;
                    "torque_nm": number | null;
                    "valve_clearance_exhaust": string | null;
                    "valve_clearance_intake": string | null;
                    "year_end": number | null;
                    "year_start": number;
                };
                Insert: {
                    "category"?: string | null;
                    "coolant_capacity_liters"?: number | null;
                    "created_at"?: string | null;
                    "displacement_cc"?: number | null;
                    "dry_weight_kg"?: number | null;
                    "engine_type"?: string | null;
                    "fuel_capacity_liters"?: number | null;
                    "fuel_system"?: string | null;
                    "generation"?: string | null;
                    "horsepower"?: number | null;
                    "id"?: string;
                    "image_url"?: string | null;
                    "make": string;
                    "model": string;
                    "oil_capacity_liters"?: number | null;
                    "spark_plug"?: string | null;
                    "tire_front"?: string | null;
                    "tire_rear"?: string | null;
                    "torque_nm"?: number | null;
                    "valve_clearance_exhaust"?: string | null;
                    "valve_clearance_intake"?: string | null;
                    "year_end"?: number | null;
                    "year_start": number;
                };
                Update: {
                    "category"?: string | null;
                    "coolant_capacity_liters"?: number | null;
                    "created_at"?: string | null;
                    "displacement_cc"?: number | null;
                    "dry_weight_kg"?: number | null;
                    "engine_type"?: string | null;
                    "fuel_capacity_liters"?: number | null;
                    "fuel_system"?: string | null;
                    "generation"?: string | null;
                    "horsepower"?: number | null;
                    "id"?: string;
                    "image_url"?: string | null;
                    "make"?: string;
                    "model"?: string;
                    "oil_capacity_liters"?: number | null;
                    "spark_plug"?: string | null;
                    "tire_front"?: string | null;
                    "tire_rear"?: string | null;
                    "torque_nm"?: number | null;
                    "valve_clearance_exhaust"?: string | null;
                    "valve_clearance_intake"?: string | null;
                    "year_end"?: number | null;
                    "year_start"?: number;
                };
                Relationships: [
                ];
            };
            "recalls": {
                Row: {
                    "component": string | null;
                    "consequence": string | null;
                    "created_at": string | null;
                    "data_source": string;
                    "id": string;
                    "make": string;
                    "manufacturer": string;
                    "model": string;
                    "model_year": number;
                    "nhtsa_campaign_number": string;
                    "notes": string | null;
                    "park_it": boolean | null;
                    "park_outside": boolean | null;
                    "remedy": string | null;
                    "report_received_date": string | null;
                    "summary": string | null;
                };
                Insert: {
                    "component"?: string | null;
                    "consequence"?: string | null;
                    "created_at"?: string | null;
                    "data_source"?: string;
                    "id"?: string;
                    "make": string;
                    "manufacturer": string;
                    "model": string;
                    "model_year": number;
                    "nhtsa_campaign_number": string;
                    "notes"?: string | null;
                    "park_it"?: boolean | null;
                    "park_outside"?: boolean | null;
                    "remedy"?: string | null;
                    "report_received_date"?: string | null;
                    "summary"?: string | null;
                };
                Update: {
                    "component"?: string | null;
                    "consequence"?: string | null;
                    "created_at"?: string | null;
                    "data_source"?: string;
                    "id"?: string;
                    "make"?: string;
                    "manufacturer"?: string;
                    "model"?: string;
                    "model_year"?: number;
                    "nhtsa_campaign_number"?: string;
                    "notes"?: string | null;
                    "park_it"?: boolean | null;
                    "park_outside"?: boolean | null;
                    "remedy"?: string | null;
                    "report_received_date"?: string | null;
                    "summary"?: string | null;
                };
                Relationships: [
                ];
            };
            "service_intervals": {
                Row: {
                    "created_at": string | null;
                    "description": string | null;
                    "fluid_spec": string | null;
                    "id": string;
                    "interval_km": number | null;
                    "interval_miles": number | null;
                    "interval_months": number | null;
                    "motorcycle_id": string;
                    "service_name": string;
                    "torque_spec": string | null;
                };
                Insert: {
                    "created_at"?: string | null;
                    "description"?: string | null;
                    "fluid_spec"?: string | null;
                    "id"?: string;
                    "interval_km"?: number | null;
                    "interval_miles"?: number | null;
                    "interval_months"?: number | null;
                    "motorcycle_id": string;
                    "service_name": string;
                    "torque_spec"?: string | null;
                };
                Update: {
                    "created_at"?: string | null;
                    "description"?: string | null;
                    "fluid_spec"?: string | null;
                    "id"?: string;
                    "interval_km"?: number | null;
                    "interval_miles"?: number | null;
                    "interval_months"?: number | null;
                    "motorcycle_id"?: string;
                    "service_name"?: string;
                    "torque_spec"?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "service_intervals_motorcycle_id_fkey";
                        columns: [
                            "motorcycle_id"
                        ];
                        isOneToOne: false;
                        referencedRelation: "motorcycles";
                        referencedColumns: [
                            "id"
                        ];
                    }
                ];
            };
            "technical_documents": {
                Row: {
                    "created_at": string | null;
                    "description": string | null;
                    "doc_type": string;
                    "file_type": string;
                    "file_url": string;
                    "id": string;
                    "motorcycle_id": string | null;
                    "source_attribution": string | null;
                    "title": string;
                };
                Insert: {
                    "created_at"?: string | null;
                    "description"?: string | null;
                    "doc_type": string;
                    "file_type": string;
                    "file_url": string;
                    "id"?: string;
                    "motorcycle_id"?: string | null;
                    "source_attribution"?: string | null;
                    "title": string;
                };
                Update: {
                    "created_at"?: string | null;
                    "description"?: string | null;
                    "doc_type"?: string;
                    "file_type"?: string;
                    "file_url"?: string;
                    "id"?: string;
                    "motorcycle_id"?: string | null;
                    "source_attribution"?: string | null;
                    "title"?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "technical_documents_motorcycle_id_fkey";
                        columns: [
                            "motorcycle_id"
                        ];
                        isOneToOne: false;
                        referencedRelation: "motorcycles";
                        referencedColumns: [
                            "id"
                        ];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            "attach_garage_file": {
                Args: {
                    "p_input": Json;
                };
                Returns: {
                    "bike_id": string;
                    "cleanup_pending": boolean;
                    "created_at": string;
                    "filename": string;
                    "id": string;
                    "job_id": string | null;
                    "kind": string;
                    "owner_id": string;
                    "path": string;
                    "source_pending": boolean;
                };
                SetofOptions: {
                    from: "*";
                    to: "garage_files";
                    isOneToOne: true;
                    isSetofReturn: false;
                };
            } | {
                Args: {
                    "p_input": Json;
                    "p_owner_id": string;
                };
                Returns: {
                    "bike_id": string;
                    "cleanup_pending": boolean;
                    "created_at": string;
                    "filename": string;
                    "id": string;
                    "job_id": string | null;
                    "kind": string;
                    "owner_id": string;
                    "path": string;
                    "source_pending": boolean;
                };
                SetofOptions: {
                    from: "*";
                    to: "garage_files";
                    isOneToOne: true;
                    isSetofReturn: false;
                };
            };
            "begin_file_removal": {
                Args: {
                    "p_file_id": string;
                };
                Returns: {
                    "bike_id": string;
                    "cleanup_pending": boolean;
                    "created_at": string;
                    "filename": string;
                    "id": string;
                    "job_id": string | null;
                    "kind": string;
                    "owner_id": string;
                    "path": string;
                    "source_pending": boolean;
                };
                SetofOptions: {
                    from: "*";
                    to: "garage_files";
                    isOneToOne: true;
                    isSetofReturn: false;
                };
            } | {
                Args: {
                    "p_file_id": string;
                    "p_owner_id": string;
                };
                Returns: {
                    "bike_id": string;
                    "cleanup_pending": boolean;
                    "created_at": string;
                    "filename": string;
                    "id": string;
                    "job_id": string | null;
                    "kind": string;
                    "owner_id": string;
                    "path": string;
                    "source_pending": boolean;
                };
                SetofOptions: {
                    from: "*";
                    to: "garage_files";
                    isOneToOne: true;
                    isSetofReturn: false;
                };
            };
            "begin_garage_cleanup": {
                Args: {
                    "p_bike_id": string;
                    "p_job_id"?: string;
                };
                Returns: boolean;
            } | {
                Args: {
                    "p_bike_id": string;
                    "p_job_id"?: string;
                    "p_owner_id": string;
                };
                Returns: boolean;
            };
            "begin_garage_finalisation": {
                Args: {
                    "p_input": Json;
                    "p_owner_id": string;
                };
                Returns: string;
            };
            "create_quick_job": {
                Args: {
                    "p_draft": Json;
                };
                Returns: {
                    "bike_id": string;
                    "close_reason": string | null;
                    "closed_at": string | null;
                    "cost_minor": number | null;
                    "created_at": string;
                    "currency": string | null;
                    "file_cleanup_pending": boolean;
                    "id": string;
                    "job_date": string;
                    "mileage_km": number;
                    "notes": string;
                    "owner_id": string;
                    "parts": string;
                    "performer": string;
                    "revision": number;
                    "status": string;
                    "tasks": NonNullable<Json>;
                    "template_id": string | null;
                    "template_snapshot": Json | null;
                    "template_version": number | null;
                    "title": string;
                };
                SetofOptions: {
                    from: "*";
                    to: "maintenance_jobs";
                    isOneToOne: true;
                    isSetofReturn: false;
                };
            };
            "edit_job_details": {
                Args: {
                    "p_details": Json;
                    "p_expected_revision": number;
                    "p_job_id": string;
                };
                Returns: {
                    "bike_id": string;
                    "close_reason": string | null;
                    "closed_at": string | null;
                    "cost_minor": number | null;
                    "created_at": string;
                    "currency": string | null;
                    "file_cleanup_pending": boolean;
                    "id": string;
                    "job_date": string;
                    "mileage_km": number;
                    "notes": string;
                    "owner_id": string;
                    "parts": string;
                    "performer": string;
                    "revision": number;
                    "status": string;
                    "tasks": NonNullable<Json>;
                    "template_id": string | null;
                    "template_snapshot": Json | null;
                    "template_version": number | null;
                    "title": string;
                };
                SetofOptions: {
                    from: "*";
                    to: "maintenance_jobs";
                    isOneToOne: true;
                    isSetofReturn: false;
                };
            };
            "finish_garage_file_removal": {
                Args: {
                    "p_file_id": string;
                    "p_owner_id": string;
                };
                Returns: undefined;
            };
            "garage_upload_allowed": {
                Args: {
                    "p_bucket": string;
                    "p_name": string;
                };
                Returns: boolean;
            };
            "lock_garage_file_target": {
                Args: {
                    "p_bike_id": string;
                    "p_job_id": string;
                    "p_owner_id": string;
                };
                Returns: undefined;
            };
            "maintenance_details_valid": {
                Args: {
                    "p_details": Json;
                };
                Returns: boolean;
            };
            "maintenance_tasks_valid": {
                Args: {
                    "p_tasks": Json;
                };
                Returns: boolean;
            };
            "maintenance_template_valid": {
                Args: {
                    "p_template": Json;
                };
                Returns: boolean;
            };
            "match_document_chunks": {
                Args: {
                    "filter_content_type"?: string;
                    "filter_make"?: string;
                    "filter_model"?: string;
                    "filter_motorcycle_id"?: string;
                    "match_count"?: number;
                    "query_embedding": string;
                    "similarity_threshold"?: number;
                };
                Returns: {
                    "content": string;
                    "content_type": string;
                    "id": string;
                    "make": string;
                    "model": string;
                    "page_numbers": (number)[];
                    "section_hierarchy": (string)[];
                    "section_title": string;
                    "similarity": number;
                }[];
            };
            "release_garage_finalisation": {
                Args: {
                    "p_file_id": string;
                    "p_owner_id": string;
                };
                Returns: undefined;
            };
            "restore_garage_image": {
                Args: {
                    "p_bike_id": string;
                };
                Returns: boolean;
            } | {
                Args: {
                    "p_bike_id": string;
                    "p_owner_id": string;
                };
                Returns: boolean;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];
export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
    Row: infer R;
} ? R : never : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
    Row: infer R;
} ? R : never : never;
export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
} ? I : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I;
} ? I : never : never;
export type TablesUpdate<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
} ? U : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U;
} ? U : never : never;
export type Enums<DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | {
    schema: keyof DatabaseWithoutInternals;
}, EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never = never> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName] : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] : never;
export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | {
    schema: keyof DatabaseWithoutInternals;
}, CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never = never> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName] : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] : never;
export const Constants = {
    "graphql_public": {
        Enums: {}
    }, "public": {
        Enums: {}
    }
} as const;
// Convenience types for each table
export type Motorcycle = Tables<'motorcycles'>;
// Preserve the application union enforced by the database's text CHECK constraint.
export type DiagnosticTree = Omit<Tables<'diagnostic_trees'>, 'difficulty'> & {
    difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
};
export type DtcCode = Tables<'dtc_codes'>;
export type ServiceInterval = Tables<'service_intervals'>;
export type TechnicalDocument = Tables<'technical_documents'>;
export type Recall = Tables<'recalls'>;
export type MotorcycleImage = Tables<'motorcycle_images'>;
export type GlossaryTerm = Tables<'glossary_terms'>;
export type DocumentSource = Tables<'document_sources'>;
export type DocumentChunk = Tables<'document_chunks'>;
export type ExtractionJob = Tables<'extraction_jobs'>;
// Decision tree node types (for tree_data JSONB structure)
export interface DecisionTreeNode {
    id: string;
    type: 'question' | 'check' | 'solution';
    text: string;
    safety: 'green' | 'yellow' | 'red';
    warning?: string;
    instructions?: string;
    options?: Array<{
        text: string;
        next: string;
    }>;
    next?: string;
    action?: string;
    details?: string;
}
export interface DecisionTreeData {
    nodes: DecisionTreeNode[];
}
// VIN decoder types (NHTSA vPIC API response)
export interface VinDecodedResult {
    make: string | null;
    model: string | null;
    year: number | null;
    vehicleType: string | null;
    engineSize: string | null;
    fuelType: string | null;
    displacement: string | null;
    cylinders: string | null;
    transmissionType: string | null;
    errorCode: string | null;
    errorText: string | null;
}
