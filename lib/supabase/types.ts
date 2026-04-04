import { GoalCategory } from '@/lib/schemas/goal.schema';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          target_date: string;
          category: GoalCategory;
          metrics_current: number | null;
          metrics_target: number | null;
          metrics_unit: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          target_date: string;
          category: GoalCategory;
          metrics_current?: number | null;
          metrics_target?: number | null;
          metrics_unit?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          target_date?: string;
          category?: GoalCategory;
          metrics_current?: number | null;
          metrics_target?: number | null;
          metrics_unit?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      job_applications: {
        Row: {
          id: string;
          user_id: string;
          company: string;
          position: string;
          status: 'applied' | 'interview' | 'offer' | 'rejected';
          application_date: string; // ISO date string
          interview_date: string | null; // ISO date string
          notes: string | null;
          salary_range: string | null;
          location: string | null;
          job_url: string | null;
          created_at: string; // ISO timestamp
          updated_at: string; // ISO timestamp
        };
        Insert: {
          id?: string;
          user_id: string;
          company: string;
          position: string;
          status: 'applied' | 'interview' | 'offer' | 'rejected';
          application_date: string; // ISO date string
          interview_date?: string | null; // ISO date string
          notes?: string | null;
          salary_range?: string | null;
          location?: string | null;
          job_url?: string | null;
          created_at?: string; // ISO timestamp
          updated_at?: string; // ISO timestamp
        };
        Update: {
          id?: string;
          user_id?: string;
          company?: string;
          position?: string;
          status?: 'applied' | 'interview' | 'offer' | 'rejected';
          application_date?: string; // ISO date string
          interview_date?: string | null; // ISO date string
          notes?: string | null;
          salary_range?: string | null;
          location?: string | null;
          job_url?: string | null;
          created_at?: string; // ISO timestamp
          updated_at?: string; // ISO timestamp
        };
        Relationships: [];
      };
      career_cv_profiles: {
        Row: {
          id: string;
          user_id: string;
          cv_text: string;
          cv_rank: number;
          rank_tier: 'top' | 'strong' | 'developing' | 'early';
          strengths: string[];
          gaps: string[];
          skills: string[];
          target_tracks: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cv_text: string;
          cv_rank: number;
          rank_tier: 'top' | 'strong' | 'developing' | 'early';
          strengths?: string[];
          gaps?: string[];
          skills?: string[];
          target_tracks?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cv_text?: string;
          cv_rank?: number;
          rank_tier?: 'top' | 'strong' | 'developing' | 'early';
          strengths?: string[];
          gaps?: string[];
          skills?: string[];
          target_tracks?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kit_sync_profiles: {
        Row: {
          id: string;
          user_id: string;
          campus_webcal_url_encrypted: string | null;
          campus_webcal_url_masked: string | null;
          campus_webcal_calendar_name: string | null;
          campus_webcal_last_validated_at: string | null;
          campus_webcal_last_synced_at: string | null;
          campus_webcal_last_error: string | null;
          campus_webcal_last_feed_fingerprint: string | null;
          connector_version: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          campus_webcal_url_encrypted?: string | null;
          campus_webcal_url_masked?: string | null;
          campus_webcal_calendar_name?: string | null;
          campus_webcal_last_validated_at?: string | null;
          campus_webcal_last_synced_at?: string | null;
          campus_webcal_last_error?: string | null;
          campus_webcal_last_feed_fingerprint?: string | null;
          connector_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          campus_webcal_url_encrypted?: string | null;
          campus_webcal_url_masked?: string | null;
          campus_webcal_calendar_name?: string | null;
          campus_webcal_last_validated_at?: string | null;
          campus_webcal_last_synced_at?: string | null;
          campus_webcal_last_error?: string | null;
          campus_webcal_last_feed_fingerprint?: string | null;
          connector_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kit_sync_runs: {
        Row: {
          id: string;
          user_id: string;
          source: 'campus_webcal' | 'campus_connector' | 'ilias_connector';
          trigger: 'manual' | 'cron' | 'connector';
          status: 'running' | 'success' | 'partial' | 'failed';
          items_read: number;
          items_written: number;
          error_code: string | null;
          error_message: string | null;
          connector_version: string | null;
          started_at: string;
          finished_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: 'campus_webcal' | 'campus_connector' | 'ilias_connector';
          trigger: 'manual' | 'cron' | 'connector';
          status: 'running' | 'success' | 'partial' | 'failed';
          items_read?: number;
          items_written?: number;
          error_code?: string | null;
          error_message?: string | null;
          connector_version?: string | null;
          started_at?: string;
          finished_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: 'campus_webcal' | 'campus_connector' | 'ilias_connector';
          trigger?: 'manual' | 'cron' | 'connector';
          status?: 'running' | 'success' | 'partial' | 'failed';
          items_read?: number;
          items_written?: number;
          error_code?: string | null;
          error_message?: string | null;
          connector_version?: string | null;
          started_at?: string;
          finished_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      kit_campus_events: {
        Row: {
          id: string;
          user_id: string;
          profile_id: string;
          external_id: string;
          source: 'campus_webcal' | 'campus_connector';
          title: string;
          description: string | null;
          location: string | null;
          starts_at: string;
          ends_at: string | null;
          all_day: boolean;
          kind: 'lecture' | 'exercise' | 'exam' | 'deadline' | 'other';
          source_updated_at: string | null;
          content_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_id: string;
          external_id: string;
          source: 'campus_webcal' | 'campus_connector';
          title: string;
          description?: string | null;
          location?: string | null;
          starts_at: string;
          ends_at?: string | null;
          all_day?: boolean;
          kind?: 'lecture' | 'exercise' | 'exam' | 'deadline' | 'other';
          source_updated_at?: string | null;
          content_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          profile_id?: string;
          external_id?: string;
          source?: 'campus_webcal' | 'campus_connector';
          title?: string;
          description?: string | null;
          location?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          all_day?: boolean;
          kind?: 'lecture' | 'exercise' | 'exam' | 'deadline' | 'other';
          source_updated_at?: string | null;
          content_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kit_campus_modules: {
        Row: {
          id: string;
          user_id: string;
          external_id: string;
          module_code: string | null;
          title: string;
          status: 'active' | 'completed' | 'dropped' | 'planned' | 'unknown';
          semester_label: string | null;
          credits: number | null;
          source_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          external_id: string;
          module_code?: string | null;
          title: string;
          status?: 'active' | 'completed' | 'dropped' | 'planned' | 'unknown';
          semester_label?: string | null;
          credits?: number | null;
          source_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          external_id?: string;
          module_code?: string | null;
          title?: string;
          status?: 'active' | 'completed' | 'dropped' | 'planned' | 'unknown';
          semester_label?: string | null;
          credits?: number | null;
          source_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kit_campus_grades: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          external_grade_id: string;
          grade_value: number | null;
          grade_label: string;
          exam_date: string | null;
          published_at: string | null;
          source_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_id: string;
          external_grade_id: string;
          grade_value?: number | null;
          grade_label: string;
          exam_date?: string | null;
          published_at?: string | null;
          source_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          module_id?: string;
          external_grade_id?: string;
          grade_value?: number | null;
          grade_label?: string;
          exam_date?: string | null;
          published_at?: string | null;
          source_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kit_ilias_favorites: {
        Row: {
          id: string;
          user_id: string;
          external_id: string;
          title: string;
          semester_label: string | null;
          course_url: string | null;
          source_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          external_id: string;
          title: string;
          semester_label?: string | null;
          course_url?: string | null;
          source_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          external_id?: string;
          title?: string;
          semester_label?: string | null;
          course_url?: string | null;
          source_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kit_ilias_items: {
        Row: {
          id: string;
          user_id: string;
          favorite_id: string;
          external_id: string;
          item_type: 'announcement' | 'document' | 'folder' | 'link' | 'other';
          title: string;
          item_url: string | null;
          summary: string | null;
          published_at: string | null;
          source_updated_at: string | null;
          first_seen_at: string;
          last_seen_at: string;
          acknowledged_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          favorite_id: string;
          external_id: string;
          item_type?: 'announcement' | 'document' | 'folder' | 'link' | 'other';
          title: string;
          item_url?: string | null;
          summary?: string | null;
          published_at?: string | null;
          source_updated_at?: string | null;
          first_seen_at?: string;
          last_seen_at?: string;
          acknowledged_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          favorite_id?: string;
          external_id?: string;
          item_type?: 'announcement' | 'document' | 'folder' | 'link' | 'other';
          title?: string;
          item_url?: string | null;
          summary?: string | null;
          published_at?: string | null;
          source_updated_at?: string | null;
          first_seen_at?: string;
          last_seen_at?: string;
          acknowledged_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      llm_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          route: string;
          model: string;
          units: number;
          usage_date: string; // ISO date string
          created_at: string; // ISO timestamp
        };
        Insert: {
          id?: string;
          user_id: string;
          route: string;
          model: string;
          units: number;
          usage_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          route?: string;
          model?: string;
          units?: number;
          usage_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_tasks: {
        Row: {
          id: string;
          user_id: string;
          date: string; // ISO date string
          title: string;
          completed: boolean;
          source: string | null; // 'goal', 'manual', 'application'
          source_id: string | null; // UUID reference
          time_estimate: string | null; // e.g. "2h", "30m"
          created_at: string; // ISO timestamp
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string; // ISO date string
          title: string;
          completed?: boolean;
          source?: string | null;
          source_id?: string | null;
          time_estimate?: string | null;
          created_at?: string; // ISO timestamp
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string; // ISO date string
          title?: string;
          completed?: boolean;
          source?: string | null;
          source_id?: string | null;
          time_estimate?: string | null;
          created_at?: string; // ISO timestamp
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          ects: number;
          num_exercises: number;
          exam_date: string | null; // ISO date string
          semester: string;
          created_at: string; // ISO timestamp
          expected_grade: number | null; // 1.0–5.0 German scale, null = not entered
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          ects: number;
          num_exercises: number;
          exam_date?: string | null; // ISO date string
          semester: string;
          created_at?: string; // ISO timestamp
          expected_grade?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          ects?: number;
          num_exercises?: number;
          exam_date?: string | null; // ISO date string
          semester?: string;
          created_at?: string; // ISO timestamp
          expected_grade?: number | null;
        };
        Relationships: [];
      };
      focus_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_type: 'focus' | 'break';
          duration_seconds: number;
          planned_duration_seconds: number;
          started_at: string;
          ended_at: string;
          completed: boolean;
          label: string | null;
          category: 'study' | 'work' | 'exercise' | 'reading' | 'other' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_type?: 'focus' | 'break';
          duration_seconds: number;
          planned_duration_seconds: number;
          started_at: string;
          ended_at: string;
          completed?: boolean;
          label?: string | null;
          category?: 'study' | 'work' | 'exercise' | 'reading' | 'other' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_type?: 'focus' | 'break';
          duration_seconds?: number;
          planned_duration_seconds?: number;
          started_at?: string;
          ended_at?: string;
          completed?: boolean;
          label?: string | null;
          category?: 'study' | 'work' | 'exercise' | 'reading' | 'other' | null;
          created_at?: string;
        };
        Relationships: [];
      };
      exercise_progress: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          exercise_number: number;
          completed: boolean;
          completed_at: string | null; // ISO timestamp
          created_at: string; // ISO timestamp
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          exercise_number: number;
          completed?: boolean;
          completed_at?: string | null; // ISO timestamp
          created_at?: string; // ISO timestamp
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          exercise_number?: number;
          completed?: boolean;
          completed_at?: string | null; // ISO timestamp
          created_at?: string; // ISO timestamp
        };
        Relationships: [
          {
            foreignKeyName: 'exercise_progress_course_id_fkey';
            columns: ['course_id'];
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          }
        ];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          actor_user_id: string;
          action: string;
          resource: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id: string;
          action: string;
          resource: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string;
          action?: string;
          resource?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      trajectory_settings: {
        Row: {
          id: string;
          user_id: string;
          hours_per_week: number;
          horizon_months: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hours_per_week: number;
          horizon_months?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          hours_per_week?: number;
          horizon_months?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trajectory_goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: 'thesis' | 'gmat' | 'master_app' | 'internship' | 'other';
          due_date: string;
          effort_hours: number;
          buffer_weeks: number;
          priority: number;
          status: 'active' | 'done' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category: 'thesis' | 'gmat' | 'master_app' | 'internship' | 'other';
          due_date: string;
          effort_hours: number;
          buffer_weeks?: number;
          priority?: number;
          status?: 'active' | 'done' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: 'thesis' | 'gmat' | 'master_app' | 'internship' | 'other';
          due_date?: string;
          effort_hours?: number;
          buffer_weeks?: number;
          priority?: number;
          status?: 'active' | 'done' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trajectory_windows: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          window_type: 'internship' | 'master_cycle' | 'exam_period' | 'other';
          start_date: string;
          end_date: string;
          confidence: 'low' | 'medium' | 'high';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          window_type: 'internship' | 'master_cycle' | 'exam_period' | 'other';
          start_date: string;
          end_date: string;
          confidence?: 'low' | 'medium' | 'high';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          window_type?: 'internship' | 'master_cycle' | 'exam_period' | 'other';
          start_date?: string;
          end_date?: string;
          confidence?: 'low' | 'medium' | 'high';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trajectory_blocks: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string;
          title: string;
          start_date: string;
          end_date: string;
          weekly_hours: number;
          status: 'planned' | 'in_progress' | 'done' | 'skipped';
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_id: string;
          title: string;
          start_date: string;
          end_date: string;
          weekly_hours: number;
          status?: 'planned' | 'in_progress' | 'done' | 'skipped';
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          goal_id?: string;
          title?: string;
          start_date?: string;
          end_date?: string;
          weekly_hours?: number;
          status?: 'planned' | 'in_progress' | 'done' | 'skipped';
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trajectory_blocks_goal_id_fkey';
            columns: ['goal_id'];
            referencedRelation: 'trajectory_goals';
            referencedColumns: ['id'];
          }
        ];
      };
      strategy_decisions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          context: string | null;
          target_date: string | null;
          status: 'draft' | 'committed' | 'archived';
          last_score_total: number | null;
          last_scored_at: string | null;
          last_winner_option_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          context?: string | null;
          target_date?: string | null;
          status?: 'draft' | 'committed' | 'archived';
          last_score_total?: number | null;
          last_scored_at?: string | null;
          last_winner_option_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          context?: string | null;
          target_date?: string | null;
          status?: 'draft' | 'committed' | 'archived';
          last_score_total?: number | null;
          last_scored_at?: string | null;
          last_winner_option_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      strategy_options: {
        Row: {
          id: string;
          user_id: string;
          decision_id: string;
          title: string;
          summary: string | null;
          impact_potential: number;
          confidence_level: number;
          strategic_fit: number;
          effort_cost: number;
          downside_risk: number;
          time_to_value_weeks: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          decision_id: string;
          title: string;
          summary?: string | null;
          impact_potential?: number;
          confidence_level?: number;
          strategic_fit?: number;
          effort_cost?: number;
          downside_risk?: number;
          time_to_value_weeks?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          decision_id?: string;
          title?: string;
          summary?: string | null;
          impact_potential?: number;
          confidence_level?: number;
          strategic_fit?: number;
          effort_cost?: number;
          downside_risk?: number;
          time_to_value_weeks?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'strategy_options_decision_id_fkey';
            columns: ['decision_id'];
            referencedRelation: 'strategy_decisions';
            referencedColumns: ['id'];
          }
        ];
      };
      strategy_decision_commits: {
        Row: {
          id: string;
          user_id: string;
          decision_id: string;
          option_id: string;
          task_source_key: string;
          note: string | null;
          snooze_until: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          decision_id: string;
          option_id: string;
          task_source_key: string;
          note?: string | null;
          snooze_until?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          decision_id?: string;
          option_id?: string;
          task_source_key?: string;
          note?: string | null;
          snooze_until?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'strategy_decision_commits_decision_id_fkey';
            columns: ['decision_id'];
            referencedRelation: 'strategy_decisions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'strategy_decision_commits_option_id_fkey';
            columns: ['option_id'];
            referencedRelation: 'strategy_options';
            referencedColumns: ['id'];
          }
        ];
      };
      ops_flow_metrics: {
        Row: {
          id: string;
          flow: 'login' | 'create_task' | 'toggle_exercise' | 'today_load';
          status: 'success' | 'failure';
          duration_ms: number;
          route: string | null;
          request_id: string | null;
          user_id: string | null;
          error_code: string | null;
          context: Json;
          measured_at: string;
        };
        Insert: {
          id?: string;
          flow: 'login' | 'create_task' | 'toggle_exercise' | 'today_load';
          status: 'success' | 'failure';
          duration_ms: number;
          route?: string | null;
          request_id?: string | null;
          user_id?: string | null;
          error_code?: string | null;
          context?: Json;
          measured_at?: string;
        };
        Update: {
          id?: string;
          flow?: 'login' | 'create_task' | 'toggle_exercise' | 'today_load';
          status?: 'success' | 'failure';
          duration_ms?: number;
          route?: string | null;
          request_id?: string | null;
          user_id?: string | null;
          error_code?: string | null;
          context?: Json;
          measured_at?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_key: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_key: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_key?: string;
          unlocked_at?: string;
        };
        Relationships: [];
      };
      user_room_items: {
        Row: {
          id: string;
          user_id: string;
          item_key: string;
          equipped: boolean;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_key: string;
          equipped?: boolean;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_key?: string;
          equipped?: boolean;
          unlocked_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      goal_category: GoalCategory;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper type to convert Supabase Goal Row to our Goal type
export type SupabaseGoal = Database['public']['Tables']['goals']['Row'];

// Helper type to convert Supabase Application Row to our Application type
export type SupabaseApplication = Database['public']['Tables']['job_applications']['Row'];

// Helper type to convert Supabase Course Row to our Course type
export type SupabaseCourse = Database['public']['Tables']['courses']['Row'];

// Helper type to convert Supabase ExerciseProgress Row to our ExerciseProgress type
export type SupabaseExerciseProgress = Database['public']['Tables']['exercise_progress']['Row'];

// Helper type for Focus Session
export type SupabaseFocusSession = Database['public']['Tables']['focus_sessions']['Row'];
export type SupabaseAdminAuditLog = Database['public']['Tables']['admin_audit_logs']['Row'];
export type SupabaseOpsFlowMetric = Database['public']['Tables']['ops_flow_metrics']['Row'];
export type SupabaseStrategyDecision = Database['public']['Tables']['strategy_decisions']['Row'];
export type SupabaseStrategyOption = Database['public']['Tables']['strategy_options']['Row'];
export type SupabaseStrategyDecisionCommit = Database['public']['Tables']['strategy_decision_commits']['Row'];
