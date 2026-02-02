import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local or File_Explorer.env.local
function loadEnvVars() {
  const paths = [
    join(process.cwd(), '.env.local'),
    join(process.cwd(), 'File_Explorer.env.local'),
  ];

  for (const path of paths) {
    try {
      const content = readFileSync(path, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
      console.log(`✅ Loaded environment variables from ${path}\n`);
      return;
    } catch (error) {
      // Try next file
    }
  }
  throw new Error('Could not find .env.local or File_Explorer.env.local');
}

loadEnvVars();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fix existing courses by creating missing exercise_progress entries
 */
async function fixCourseExercises() {
  try {
    console.log('🔧 Fixing course exercises...\n');

    // Fetch all courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, name, num_exercises');

    if (coursesError) {
      throw new Error(`Failed to fetch courses: ${coursesError.message}`);
    }

    if (!courses || courses.length === 0) {
      console.log('No courses found.');
      return;
    }

    console.log(`Found ${courses.length} courses.\n`);

    for (const course of courses) {
      console.log(`Processing: ${course.name} (${course.num_exercises} exercises)`);

      // Check existing exercise_progress entries
      const { data: existingExercises, error: existingError } = await supabase
        .from('exercise_progress')
        .select('exercise_number')
        .eq('course_id', course.id);

      if (existingError) {
        console.error(`  ❌ Error fetching exercises: ${existingError.message}`);
        continue;
      }

      const existingNumbers = new Set(existingExercises?.map((e) => e.exercise_number) || []);

      // Create missing exercises
      const missingExercises: Array<{ course_id: string; exercise_number: number; completed: boolean }> = [];
      for (let i = 1; i <= course.num_exercises; i++) {
        if (!existingNumbers.has(i)) {
          missingExercises.push({
            course_id: course.id,
            exercise_number: i,
            completed: false,
          });
        }
      }

      if (missingExercises.length > 0) {
        const { error: insertError } = await supabase.from('exercise_progress').insert(missingExercises);

        if (insertError) {
          console.error(`  ❌ Error creating exercises: ${insertError.message}`);
        } else {
          console.log(`  ✅ Created ${missingExercises.length} missing exercises`);
        }
      } else {
        console.log(`  ✅ All exercises already exist`);
      }

      // Fix NULL completed values
      const { error: updateError } = await supabase
        .from('exercise_progress')
        .update({ completed: false })
        .eq('course_id', course.id)
        .is('completed', null);

      if (updateError) {
        console.error(`  ❌ Error fixing NULL values: ${updateError.message}`);
      }
    }

    console.log('\n✅ Done! All courses fixed.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixCourseExercises();
