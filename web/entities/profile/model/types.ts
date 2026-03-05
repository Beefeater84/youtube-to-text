export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  preferred_languages: string[];
  created_at: string;
  updated_at: string;
}
