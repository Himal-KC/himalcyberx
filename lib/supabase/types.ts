export type ArticleStatus = "draft" | "published" | "archived";

export type ArticleContentType = "real" | "demo";

export type ArticlePattern = "network" | "grid" | "circuit" | "featured";

/** @deprecated Use ArticleStatus */
export type PublicationStatus = "draft" | "published";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string | null;
  category_id: string | null;
  author: string;
  published_at: string | null;
  read_time: string | null;
  content_type: ArticleContentType;
  label: string | null;
  featured: boolean;
  featured_image: string | null;
  featured_image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
  pattern: ArticlePattern | null;
  status: ArticleStatus;
  body: Record<string, unknown> | null;
  key_takeaways: string[] | null;
  hcx_analysis: Record<string, unknown> | null;
  technical_details: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type ArticleInsert = {
  slug: string;
  title: string;
  excerpt: string;
  content?: string | null;
  category_id?: string | null;
  author: string;
  published_at?: string | null;
  read_time?: string | null;
  content_type?: ArticleContentType;
  label?: string | null;
  featured?: boolean;
  featured_image?: string | null;
  featured_image_alt?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  pattern?: ArticlePattern | null;
  status: ArticleStatus;
  body?: Record<string, unknown> | null;
  key_takeaways?: string[] | null;
  hcx_analysis?: Record<string, unknown> | null;
  technical_details?: Record<string, unknown> | null;
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ArticleUpdate = Partial<ArticleInsert>;

export interface AdminArticleRow extends Article {
  categories: Pick<Category, "name"> | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface ArticleTag {
  article_id: string;
  tag_id: string;
}

export interface ArticleSource {
  id: string;
  article_id: string;
  name: string | null;
  title: string;
  url: string;
  publisher: string;
  sort_order: number | null;
  created_at: string;
}

export type LabStatus = "draft" | "published";

export type LabDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface Lab {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: LabDifficulty;
  estimated_time: string | null;
  learning_objectives: string | null;
  requirements_tools: string | null;
  introduction: string | null;
  instructions: string | null;
  expected_result: string | null;
  security_notes: string | null;
  featured: boolean;
  featured_image: string | null;
  status: LabStatus;
  published_at: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  lab_id?: string | null;
  tools?: string[] | null;
  tags?: string[] | null;
  tag_type?: string | null;
  difficulty_level?: string | null;
  icon?: string | null;
  button_text?: string | null;
}

export type LabInsert = {
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: LabDifficulty;
  estimated_time?: string | null;
  learning_objectives?: string | null;
  requirements_tools?: string | null;
  introduction?: string | null;
  instructions?: string | null;
  expected_result?: string | null;
  security_notes?: string | null;
  featured?: boolean;
  featured_image?: string | null;
  status: LabStatus;
  published_at?: string | null;
  sort_order?: number | null;
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type LabUpdate = Partial<LabInsert>;

export type TutorialDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type TutorialStatus = "draft" | "published";

export interface Tutorial {
  id: string;
  slug: string;
  category: string;
  title: string;
  description: string;
  difficulty: TutorialDifficulty;
  estimated_time: string | null;
  requirements: string | null;
  introduction: string | null;
  instructions: string | null;
  key_takeaways: string | null;
  security_notes: string | null;
  featured: boolean;
  featured_image: string | null;
  status: TutorialStatus;
  published_at: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export type TutorialInsert = {
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: TutorialDifficulty;
  estimated_time?: string | null;
  requirements?: string | null;
  introduction?: string | null;
  instructions?: string | null;
  key_takeaways?: string | null;
  security_notes?: string | null;
  featured?: boolean;
  featured_image?: string | null;
  status: TutorialStatus;
  published_at?: string | null;
  sort_order?: number | null;
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TutorialUpdate = Partial<TutorialInsert>;

export interface Subscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  source: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
}

export type SubscriberStatus = "active" | "unsubscribed";

export type SubscriberInsert = {
  email: string;
  status?: SubscriberStatus;
  source?: string;
  subscribed_at?: string;
  unsubscribed_at?: string | null;
  id?: string;
  created_at?: string;
};

export type SubscriberUpdate = Partial<SubscriberInsert>;

export interface ContentNotification {
  id: string;
  content_type: ContentNotificationContentType;
  content_id: string;
  notification_type: ContentNotificationBroadcastType;
  status: ContentNotificationStatus;
  attempted_count: number;
  sent_count: number;
  failed_count: number;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
}

export type ContentNotificationContentType = "article" | "lab" | "tutorial";

export type ContentNotificationBroadcastType = "published";

export type ContentNotificationStatus =
  | "pending"
  | "sending"
  | "sent"
  | "partial"
  | "failed";

export type ContentNotificationInsert = {
  content_type: ContentNotificationContentType;
  content_id: string;
  notification_type?: ContentNotificationBroadcastType;
  status?: ContentNotificationStatus;
  attempted_count?: number;
  sent_count?: number;
  failed_count?: number;
  last_error?: string | null;
  sent_at?: string | null;
  id?: string;
  created_at?: string;
};

export type ContentNotificationUpdate = Partial<ContentNotificationInsert>;

export type MessageStatus = "new" | "read" | "archived" | "spam";

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  created_at: string;
  read_at: string | null;
}

export type MessageReplyDirection = "outbound" | "inbound";

export type MessageReplyDeliveryStatus = "pending" | "sent" | "failed";

export interface MessageReply {
  id: string;
  message_id: string;
  direction: MessageReplyDirection;
  sender_email: string;
  recipient_email: string;
  body: string;
  subject: string | null;
  resend_email_id: string | null;
  delivery_status: MessageReplyDeliveryStatus;
  sent_at: string | null;
  created_at: string;
}

export type MessageReplyInsert = {
  message_id: string;
  direction: MessageReplyDirection;
  sender_email: string;
  recipient_email: string;
  body: string;
  subject?: string | null;
  resend_email_id?: string | null;
  delivery_status?: MessageReplyDeliveryStatus;
  sent_at?: string | null;
  id?: string;
  created_at?: string;
};

export type MessageInsert = {
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: MessageStatus;
  read_at?: string | null;
  id?: string;
  created_at?: string;
};

export type MessageUpdate = Partial<MessageInsert>;

export interface SiteSettings {
  id: string;
  site_name: string | null;
  site_tagline: string | null;
  public_author_name: string | null;
  contact_email: string | null;
  footer_description: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  location_display: string | null;
  created_at: string;
  updated_at: string;
}

export type SiteSettingsInsert = {
  site_name?: string | null;
  site_tagline?: string | null;
  public_author_name?: string | null;
  contact_email?: string | null;
  footer_description?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  x_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  location_display?: string | null;
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SiteSettingsUpdate = Partial<SiteSettingsInsert>;

export type TableRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Category>;
        Relationships: TableRelationship[];
      };
      articles: {
        Row: Article;
        Insert: ArticleInsert;
        Update: ArticleUpdate;
        Relationships: TableRelationship[];
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Tag>;
        Relationships: TableRelationship[];
      };
      article_tags: {
        Row: ArticleTag;
        Insert: ArticleTag;
        Update: Partial<ArticleTag>;
        Relationships: TableRelationship[];
      };
      article_sources: {
        Row: ArticleSource;
        Insert: Omit<ArticleSource, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ArticleSource>;
        Relationships: TableRelationship[];
      };
      labs: {
        Row: Lab;
        Insert: Omit<Lab, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Lab>;
        Relationships: TableRelationship[];
      };
      tutorials: {
        Row: Tutorial;
        Insert: TutorialInsert;
        Update: TutorialUpdate;
        Relationships: TableRelationship[];
      };
      subscribers: {
        Row: Subscriber;
        Insert: SubscriberInsert;
        Update: SubscriberUpdate;
        Relationships: TableRelationship[];
      };
      content_notifications: {
        Row: ContentNotification;
        Insert: ContentNotificationInsert;
        Update: ContentNotificationUpdate;
        Relationships: TableRelationship[];
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: MessageUpdate;
        Relationships: TableRelationship[];
      };
      message_replies: {
        Row: MessageReply;
        Insert: MessageReplyInsert;
        Update: Partial<MessageReplyInsert>;
        Relationships: TableRelationship[];
      };
      site_settings: {
        Row: SiteSettings;
        Insert: SiteSettingsInsert;
        Update: SiteSettingsUpdate;
        Relationships: TableRelationship[];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}
