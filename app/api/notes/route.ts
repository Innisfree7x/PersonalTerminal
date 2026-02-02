import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { z } from 'zod';

const createNoteSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  content: z.string().min(1).max(1000),
});

/**
 * GET /api/notes - Fetch notes for a specific date
 * Query params: date (YYYY-MM-DD, defaults to today)
 */
export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get('date');
    const date = dateParam || new Date().toISOString().split('T')[0];

    // For now, we'll create a simple notes table if it doesn't exist
    // In production, create: CREATE TABLE notes (id UUID PRIMARY KEY, date DATE NOT NULL, content TEXT, created_at TIMESTAMPTZ DEFAULT NOW())
    // For now, return empty array as notes table doesn't exist yet
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notes - Create or update a note for today
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createNoteSchema.parse(body);

    // Note: This requires a notes table in Supabase
    // CREATE TABLE notes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), date DATE NOT NULL, content TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
    // For now, just return success
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { message: 'Validation error', errors: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create note' },
      { status: 500 }
    );
  }
}
