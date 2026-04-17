export interface AnalysisResult {
  summary: string;
  main_subject: string;
  cycle: 'conflito' | 'pandemia' | 'economico' | 'politico' | 'social' | 'tecnologico' | 'ambiental' | 'cultural';
  political_bias: 'esquerda' | 'centro-esquerda' | 'centro' | 'centro-direita' | 'direita' | 'indefinido';
  bias_score: number;        // -1.0 a +1.0
  sentiment: 'positivo' | 'neutro' | 'negativo';
  sentiment_score: number;   // -1.0 a +1.0
  categories: string[];      // ['economia', 'politica']
  entities: Entity[];        // personagens mencionados
  regions: string[];           // regiões mencionadas
  confidence: number;        // 0.0 a 1.0
}

export interface Entity {
  name: string;
  type: 'person' | 'org' | 'place';
  role: 'protagonista' | 'citado' | 'afetado' | 'opositor';
}

export interface ArticleToAnalyze {
  id: string;
  title: string;
  content?: string;
  source_id: string;
}