export interface RawArticle {
  title: string;
  url: string;
  content?: string;
  published_at?: string;
  source_id: string;
}

export interface Story {
  id?: string;
  title: string;
  summary?: string;
  main_subject?: string;
  cycle?: string;
  article_count?: number;
}

export interface Analysis {
  article_id: string;
  political_bias?: string;
  sentiment?: string;
  bias_score?: number;
  sentiment_score?: number;
  categories?: string[];
  confidence?: number;
  model_used?: string;
}

export interface Entity {
  name: string;
  type: 'person' | 'org' | 'place';
  role?: string;
}