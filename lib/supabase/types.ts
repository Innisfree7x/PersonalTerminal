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
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          type: 'meeting' | 'task' | 'break';
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          type: 'meeting' | 'task' | 'break';
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          type?: 'meeting' | 'task' | 'break';
          created_at?: string;
        };
        Relationships: [];
      };
      job_applications: {
        Row: {
          id: string;
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
      daily_tasks: {
        Row: {
          id: string;
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
          name: string;
          ects: number;
          num_exercises: number;
          exam_date: string | null; // ISO date string
          semester: string;
          created_at: string; // ISO timestamp
        };
        Insert: {
          id?: string;
          name: string;
          ects: number;
          num_exercises: number;
          exam_date?: string | null; // ISO date string
          semester: string;
          created_at?: string; // ISO timestamp
        };
        Update: {
          id?: string;
          name?: string;
          ects?: number;
          num_exercises?: number;
          exam_date?: string | null; // ISO date string
          semester?: string;
          created_at?: string; // ISO timestamp
        };
        Relationships: [];
      };
      exercise_progress: {
        Row: {
          id: string;
          course_id: string;
          exercise_number: number;
          completed: boolean;
          completed_at: string | null; // ISO timestamp
          created_at: string; // ISO timestamp
        };
        Insert: {
          id?: string;
          course_id: string;
          exercise_number: number;
          completed?: boolean;
          completed_at?: string | null; // ISO timestamp
          created_at?: string; // ISO timestamp
        };
        Update: {
          id?: string;
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
