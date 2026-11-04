// READ-ONLY snapshot generated from live Production Supabase on 2026-11-04.
// Do not wire this file into the app until a reviewed Staging migration is complete.
// Contains schema typings only; no row data or credentials.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: never
        }
        Relationships: []
      }
      competition_snapshots: {
        Row: {
          snapshot: Json
          tournament_id: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          snapshot?: Json
          tournament_id: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          snapshot?: Json
          tournament_id?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "competition_snapshots_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "recent_tournament_champions"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "competition_snapshots_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          player_one_id: string | null
          player_one_score: number | null
          player_two_id: string | null
          player_two_score: number | null
          reported_by: string | null
          round_name: string | null
          scheduled_at: string | null
          status: string
          tournament_id: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          player_one_id?: string | null
          player_one_score?: number | null
          player_two_id?: string | null
          player_two_score?: number | null
          reported_by?: string | null
          round_name?: string | null
          scheduled_at?: string | null
          status?: string
          tournament_id: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          player_one_id?: string | null
          player_one_score?: number | null
          player_two_id?: string | null
          player_two_score?: number | null
          reported_by?: string | null
          round_name?: string | null
          scheduled_at?: string | null
          status?: string
          tournament_id?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_player_one_id_fkey"
            columns: ["player_one_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player_two_id_fkey"
            columns: ["player_two_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "recent_tournament_champions"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_admin_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          description: string
          due_at: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string
          due_at?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          due_at?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      owner_private_notes: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          created_by: string
          id?: string
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      plato_land_prediction_votes: {
        Row: {
          created_at: string
          id: string
          predicted_player_key: string
          predicted_player_name: string
          voter_plato_id: string
          voter_plato_id_normalized: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          predicted_player_key: string
          predicted_player_name: string
          voter_plato_id: string
          voter_plato_id_normalized?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          predicted_player_key?: string
          predicted_player_name?: string
          voter_plato_id?: string
          voter_plato_id_normalized?: string | null
        }
        Relationships: []
      }
      plato_land_semifinal_prediction_votes: {
        Row: {
          created_at: string
          id: string
          semifinal_one_winner_key: string
          semifinal_two_winner_key: string
          voter_plato_id: string
          voter_plato_id_normalized: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          semifinal_one_winner_key: string
          semifinal_two_winner_key: string
          voter_plato_id: string
          voter_plato_id_normalized?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          semifinal_one_winner_key?: string
          semifinal_two_winner_key?: string
          voter_plato_id?: string
          voter_plato_id_normalized?: string | null
        }
        Relationships: []
      }
      plato_land_series2_registration_requests: {
        Row: {
          created_at: string
          id: string
          plato_id: string
          plato_id_normalized: string | null
          rules_accepted: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          plato_id: string
          plato_id_normalized?: string | null
          rules_accepted?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          plato_id?: string
          plato_id_normalized?: string | null
          rules_accepted?: boolean
        }
        Relationships: []
      }
      player_bans: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          normalized_plato_id: string | null
          plato_id: string
          reason: string
          starts_at: string
          tournament_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          normalized_plato_id?: string | null
          plato_id: string
          reason: string
          starts_at?: string
          tournament_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          normalized_plato_id?: string | null
          plato_id?: string
          reason?: string
          starts_at?: string
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_bans_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "recent_tournament_champions"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "player_bans_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          plato_id: string
          public_avatar_path: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          plato_id: string
          public_avatar_path?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          plato_id?: string
          public_avatar_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      registration_evidence: {
        Row: {
          created_at: string
          extracted_data: Json
          extraction_status: string
          registration_id: string
          reviewed_at: string | null
          reviewer_id: string | null
          rules_accepted_at: string
          storage_path: string
          submitted_by: string
        }
        Insert: {
          created_at?: string
          extracted_data?: Json
          extraction_status?: string
          registration_id: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          rules_accepted_at: string
          storage_path: string
          submitted_by: string
        }
        Update: {
          created_at?: string
          extracted_data?: Json
          extraction_status?: string
          registration_id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          rules_accepted_at?: string
          storage_path?: string
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_evidence_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_members: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_captain: boolean
          plato_id: string
          registration_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_captain?: boolean
          plato_id: string
          registration_id: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_captain?: boolean
          plato_id?: string
          registration_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_members_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_members_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "recent_tournament_champions"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "registration_members_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          created_at: string
          display_name: string | null
          evidence_path: string | null
          id: string
          is_reserve: boolean
          plato_id: string | null
          player_id: string
          registration_type: string
          reserve_position: number | null
          rules_accepted_at: string | null
          slot_count: number
          status: string
          team_name: string | null
          tournament_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          evidence_path?: string | null
          id?: string
          is_reserve?: boolean
          plato_id?: string | null
          player_id: string
          registration_type?: string
          reserve_position?: number | null
          rules_accepted_at?: string | null
          slot_count?: number
          status?: string
          team_name?: string | null
          tournament_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          evidence_path?: string | null
          id?: string
          is_reserve?: boolean
          plato_id?: string | null
          player_id?: string
          registration_type?: string
          reserve_position?: number | null
          rules_accepted_at?: string | null
          slot_count?: number
          status?: string
          team_name?: string | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "recent_tournament_champions"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      site_announcements: {
        Row: {
          enabled: boolean
          id: string
          title: string
          updated_at: string
          updated_by: string | null
          video_path: string
        }
        Insert: {
          enabled?: boolean
          id: string
          title: string
          updated_at?: string
          updated_by?: string | null
          video_path: string
        }
        Update: {
          enabled?: boolean
          id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          video_path?: string
        }
        Relationships: []
      }
      site_games: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          enabled: boolean
          id: string
          image_url: string | null
          included_game_slugs: string[]
          is_mixed: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          enabled?: boolean
          id?: string
          image_url?: string | null
          included_game_slugs?: string[]
          is_mixed?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          enabled?: boolean
          id?: string
          image_url?: string | null
          included_game_slugs?: string[]
          is_mixed?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_maintenance: {
        Row: {
          enabled: boolean
          message: string
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          message?: string
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          message?: string
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_news: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          featured: boolean
          featured_ends_at: string | null
          featured_starts_at: string | null
          id: string
          image_url: string | null
          publish_at: string | null
          published_at: string | null
          status: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          featured?: boolean
          featured_ends_at?: string | null
          featured_starts_at?: string | null
          id?: string
          image_url?: string | null
          publish_at?: string | null
          published_at?: string | null
          status?: string
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          featured?: boolean
          featured_ends_at?: string | null
          featured_starts_at?: string | null
          id?: string
          image_url?: string | null
          publish_at?: string | null
          published_at?: string | null
          status?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_news_versions: {
        Row: {
          body: string
          changed_by: string | null
          created_at: string
          expires_at: string | null
          featured: boolean
          featured_ends_at: string | null
          featured_starts_at: string | null
          id: string
          image_url: string | null
          news_id: string
          publish_at: string | null
          published_at: string | null
          status: string
          summary: string
          title: string
          version_number: number
        }
        Insert: {
          body?: string
          changed_by?: string | null
          created_at?: string
          expires_at?: string | null
          featured?: boolean
          featured_ends_at?: string | null
          featured_starts_at?: string | null
          id?: string
          image_url?: string | null
          news_id: string
          publish_at?: string | null
          published_at?: string | null
          status: string
          summary?: string
          title: string
          version_number: number
        }
        Update: {
          body?: string
          changed_by?: string | null
          created_at?: string
          expires_at?: string | null
          featured?: boolean
          featured_ends_at?: string | null
          featured_starts_at?: string | null
          id?: string
          image_url?: string | null
          news_id?: string
          publish_at?: string | null
          published_at?: string | null
          status?: string
          summary?: string
          title?: string
          version_number?: number
        }
        Relationships: []
      }
      site_page_versions: {
        Row: {
          changed_by: string | null
          content: Json
          created_at: string
          id: string
          published_at: string | null
          published_content: Json | null
          published_title: string | null
          slug: string
          status: string
          title: string
          version_number: number
        }
        Insert: {
          changed_by?: string | null
          content: Json
          created_at?: string
          id?: string
          published_at?: string | null
          published_content?: Json | null
          published_title?: string | null
          slug: string
          status: string
          title: string
          version_number: number
        }
        Update: {
          changed_by?: string | null
          content?: Json
          created_at?: string
          id?: string
          published_at?: string | null
          published_content?: Json | null
          published_title?: string | null
          slug?: string
          status?: string
          title?: string
          version_number?: number
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          content: Json
          created_at: string
          published_at: string | null
          published_content: Json | null
          published_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          created_at?: string
          published_at?: string | null
          published_content?: Json | null
          published_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          published_at?: string | null
          published_content?: Json | null
          published_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tournament_manager_access: {
        Row: {
          created_at: string
          granted_by: string
          permissions_configured: boolean
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string
          permissions_configured?: boolean
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string
          permissions_configured?: boolean
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_manager_access_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "recent_tournament_champions"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "tournament_manager_access_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_manager_section_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          permission_key: string
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          permission_key: string
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          permission_key?: string
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_manager_section_permissions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "recent_tournament_champions"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "tournament_manager_section_permissions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_results: {
        Row: {
          id: string
          losses: number
          placement: number | null
          player_id: string
          points: number
          score_against: number
          score_for: number
          tournament_id: string
          updated_at: string
          wins: number
        }
        Insert: {
          id?: string
          losses?: number
          placement?: number | null
          player_id: string
          points?: number
          score_against?: number
          score_for?: number
          tournament_id: string
          updated_at?: string
          wins?: number
        }
        Update: {
          id?: string
          losses?: number
          placement?: number | null
          player_id?: string
          points?: number
          score_against?: number
          score_for?: number
          tournament_id?: string
          updated_at?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournament_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_results_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "recent_tournament_champions"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "tournament_results_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_settings: {
        Row: {
          settings: Json
          tournament_id: string
          updated_at: string
          updated_by: string | null
          visibility: Json
        }
        Insert: {
          settings?: Json
          tournament_id: string
          updated_at?: string
          updated_by?: string | null
          visibility?: Json
        }
        Update: {
          settings?: Json
          tournament_id?: string
          updated_at?: string
          updated_by?: string | null
          visibility?: Json
        }
        Relationships: [
          {
            foreignKeyName: "tournament_settings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "recent_tournament_champions"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "tournament_settings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          capacity: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          game_type: string
          id: string
          platform_settings: Json
          prize_details: Json
          registration_ends_at: string | null
          registration_open: boolean
          registration_starts_at: string | null
          rules: string | null
          series_name: string | null
          starts_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          game_type: string
          id?: string
          platform_settings?: Json
          prize_details?: Json
          registration_ends_at?: string | null
          registration_open?: boolean
          registration_starts_at?: string | null
          rules?: string | null
          series_name?: string | null
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          game_type?: string
          id?: string
          platform_settings?: Json
          prize_details?: Json
          registration_ends_at?: string | null
          registration_open?: boolean
          registration_starts_at?: string | null
          rules?: string | null
          series_name?: string | null
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_admin_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          permission_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          permission_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          permission_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          notification_type: string
          read_at: string | null
          title: string
          tournament_id: string | null
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          notification_type: string
          read_at?: string | null
          title: string
          tournament_id?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          notification_type?: string
          read_at?: string | null
          title?: string
          tournament_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "recent_tournament_champions"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "user_notifications_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      recent_tournament_champions: {
        Row: {
          completed_at: string | null
          display_name: string | null
          game_type: string | null
          plato_id: string | null
          prize_text: string | null
          public_avatar_path: string | null
          series_name: string | null
          tournament_id: string | null
          tournament_title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_list_site_users: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          last_sign_in_at: string
          plato_id: string
          user_id: string
        }[]
      }
      current_user_role: { Args: never; Returns: string }
      remove_tournament_registration: {
        Args: { p_registration_id: string }
        Returns: string
      }
      review_tournament_registration: {
        Args: { p_approved: boolean; p_registration_id: string }
        Returns: undefined
      }
      save_tournament_manager_access: {
        Args: { p_assignments: Json; p_tournament_id: string }
        Returns: undefined
      }
      submit_tournament_registration:
        | {
            Args: {
              p_evidence_path: string
              p_extracted_data: Json
              p_tournament_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_display_name: string
              p_evidence_path: string
              p_extracted_data: Json
              p_members?: Json
              p_plato_id: string
              p_registration_type?: string
              p_rules_text: string
              p_team_name?: string
              p_tournament_id: string
            }
            Returns: string
          }
      withdraw_tournament_registration: {
        Args: { p_registration_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
