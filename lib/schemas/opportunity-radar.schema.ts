import { z } from 'zod';

export const RadarTrackSchema = z.enum(['M&A', 'TS', 'CorpFin', 'Audit']);
export const RadarBandSchema = z.enum(['realistic', 'target', 'stretch']);
export const DachLocationSchema = z.enum(['DE', 'AT', 'CH']);

export type RadarTrack = z.infer<typeof RadarTrackSchema>;
export type RadarBand = z.infer<typeof RadarBandSchema>;
export type DachLocation = z.infer<typeof DachLocationSchema>;

export const OpportunitySearchInputSchema = z.object({
  query: z.string().trim().max(120).optional().default(''),
  priorityTrack: RadarTrackSchema.optional().default('M&A'),
  locations: z.array(DachLocationSchema).min(1).max(3).optional().default(['DE', 'AT', 'CH']),
  bands: z.array(RadarBandSchema).min(1).max(3).optional().default(['realistic', 'target', 'stretch']),
  limit: z.number().int().min(1).max(30).optional().default(12),
});

export type OpportunitySearchInput = z.infer<typeof OpportunitySearchInputSchema>;

export interface OpportunitySearchItem {
  id: string;
  title: string;
  company: string;
  city: string;
  country: DachLocation;
  track: RadarTrack;
  fitScore: number;
  band: RadarBand;
  topReasons: string[];
  topGaps: string[];
  sourceLabels: string[];
  jobUrl?: string;
}

export interface OpportunitySearchResponse {
  items: OpportunitySearchItem[];
  meta: {
    query: string;
    priorityTrack: RadarTrack;
    totalBeforeLimit: number;
    sourcesQueried: number;
    liveSourceConfigured: boolean;
    liveSourceHealthy: boolean;
    liveSourceContributed: boolean;
  };
}
