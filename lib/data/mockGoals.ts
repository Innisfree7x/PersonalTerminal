import { Goal } from '@/lib/schemas/goal.schema';

export const mockGoals: Goal[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    title: 'Lose 5kg Weight',
    description: 'Get in shape for summer by losing 5kg',
    targetDate: new Date('2024-06-30'),
    category: 'fitness',
    metrics: {
      current: 75,
      target: 70,
      unit: 'kg',
    },
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    title: 'Get Senior Developer Promotion',
    description: 'Achieve senior developer position within Q2',
    targetDate: new Date('2024-06-30'),
    category: 'career',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    title: 'Master TypeScript & Next.js',
    description: 'Complete advanced TypeScript course and build 3 Next.js projects',
    targetDate: new Date('2024-05-31'),
    category: 'learning',
    metrics: {
      current: 2,
      target: 3,
      unit: 'projects',
    },
    createdAt: new Date('2024-01-05'),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    title: 'Save €10,000 Emergency Fund',
    description: 'Build emergency fund for financial security',
    targetDate: new Date('2024-12-31'),
    category: 'finance',
    metrics: {
      current: 3500,
      target: 10000,
      unit: 'EUR',
    },
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174005',
    title: 'Run Half Marathon',
    description: 'Complete a half marathon under 2 hours',
    targetDate: new Date('2024-09-15'),
    category: 'fitness',
    metrics: {
      current: 8,
      target: 21.1,
      unit: 'km',
    },
    createdAt: new Date('2024-01-20'),
  },
];
