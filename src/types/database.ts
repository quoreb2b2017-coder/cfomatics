export type ArticleStatus = "draft" | "published";
export type ArticleSource = "ai" | "manual";

export type ArticleBodySection = {
  heading: string;
  paragraphs: string[];
};

export type ArticleChartSeries = {
  name: string;
  values: number[];
};

export type ArticleChart = {
  title: string;
  type: "bar" | "line";
  unit?: string;
  labels: string[];
  series: ArticleChartSeries[];
  sourceNote?: string;
};

export type ArticleBody = {
  lede: string;
  sections: ArticleBodySection[];
  pullQuote?: string;
  takeaways?: string[];
  chart?: ArticleChart;
  /** Optional SEO extras from AI generation (not rendered in body). */
  seo?: {
    focus_keyword?: string;
    og_title?: string;
  };
};

export type Topic = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  body_json: ArticleBody;
  topic_id: string | null;
  status: ArticleStatus;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  cover_image_credit: string | null;
  cover_image_credit_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  read_time_minutes: number | null;
  author_name: string;
  source: ArticleSource;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleWithTopic = Article & { topic: Topic | null };

export type GenerationLogEntry = {
  id: string;
  run_at: string;
  topic_searched: string | null;
  status: "success" | "failed";
  article_id: string | null;
  error_message: string | null;
};

export type Database = {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Tables: {
      topics: {
        Row: Topic;
        Insert: Partial<Topic> & { slug: string; name: string };
        Update: Partial<Topic>;
        Relationships: never[];
      };
      articles: {
        Row: Article;
        Insert: Partial<Article> & {
          slug: string;
          title: string;
          dek: string;
          body_json: ArticleBody;
        };
        Update: Partial<Article>;
        Relationships: [
          {
            foreignKeyName: "articles_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      generation_log: {
        Row: GenerationLogEntry;
        Insert: Partial<GenerationLogEntry> & { status: "success" | "failed" };
        Update: Partial<GenerationLogEntry>;
        Relationships: [
          {
            foreignKeyName: "generation_log_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_users: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: { user_id?: string; created_at?: string };
        Relationships: never[];
      };
    };
  };
};
