import { z } from 'zod';

export const CvTargetTrackSchema = z.enum(['M&A', 'TS', 'CorpFin', 'Audit']);
export type CvTargetTrack = z.infer<typeof CvTargetTrackSchema>;

export const CvRankTierSchema = z.enum(['top', 'strong', 'developing', 'early']);
export type CvRankTier = z.infer<typeof CvRankTierSchema>;

export const CvAnalyzeInputSchema = z.object({
  cvText: z.string().trim().min(80).max(120_000),
  targetTracks: z.array(CvTargetTrackSchema).min(1).max(4).optional().default(['M&A']),
});

export type CvAnalyzeInput = z.infer<typeof CvAnalyzeInputSchema>;

export const CvAnalyzeResultSchema = z.object({
  cvRank: z.number().int().min(0).max(100),
  rankTier: CvRankTierSchema,
  topStrengths: z.array(z.string().min(1)).min(1).max(5),
  topGaps: z.array(z.string().min(1)).min(1).max(5),
  detectedSkills: z.array(z.string().min(1)).max(30),
  targetTracks: z.array(CvTargetTrackSchema).min(1),
});

export type CvAnalyzeResult = z.infer<typeof CvAnalyzeResultSchema>;
