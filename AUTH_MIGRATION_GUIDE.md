# 🔐 Auth Migration Guide

## What We Built

✅ **Complete Authentication System with Supabase Auth**

### Files Created:
1. `lib/auth/client.ts` - Client-side auth utilities
2. `lib/auth/server.ts` - Server-side auth utilities  
3. `lib/auth/AuthProvider.tsx` - React Context for auth state
4. `app/auth/login/page.tsx` - Login UI
5. `app/auth/signup/page.tsx` - Sign up UI
6. `app/auth/callback/route.ts` - Auth callback handler
7. `middleware.ts` - Route protection

### Files Updated:
1. `app/layout.tsx` - Added AuthProvider

---

## How to Use Auth in Your Code

### 🎯 In Client Components

```typescript
'use client';

import { useAuth } from '@/lib/auth/AuthProvider';

export default function MyComponent() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <p>Welcome {user.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### 🎯 In API Routes

**Old Way (REMOVE THIS):**
```typescript
// ❌ DON'T DO THIS ANYMORE
const userId = 'anonymous';
```

**New Way:**
```typescript
// ✅ DO THIS
import { getUserId } from '@/lib/auth/server';

export async function GET() {
  const userId = await getUserId();
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Now use userId in queries
  const { data } = await supabase
    .from('table')
    .select('*')
    .eq('user_id', userId);
    
  return NextResponse.json(data);
}
```

**Or use requireAuth() for cleaner code:**
```typescript
import { requireAuth } from '@/lib/auth/server';

export async function GET() {
  try {
    const user = await requireAuth();
    // user is guaranteed to be defined here
    
    const { data } = await supabase
      .from('table')
      .select('*')
      .eq('user_id', user.id);
      
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

---

## 📋 TODO: Migrate Existing API Routes

### Routes to Update (Replace `userId = 'anonymous'`):

- [ ] `app/api/dashboard/stats/route.ts` - Line 35 (get stats)
- [ ] `app/api/dashboard/focus-time/route.ts` - Line 26
- [ ] `app/api/dashboard/week-events/route.ts` - Line 24
- [ ] `app/api/user/streak/route.ts` - Line 23
- [ ] Any other routes with hardcoded userId

### Example Migration:

**Before:**
```typescript
export async function GET(_request: NextRequest) {
  try {
    // ❌ Old
    const userId = 'anonymous';
    
    const { data } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', userId);
```

**After:**
```typescript
import { getUserId } from '@/lib/auth/server';

export async function GET(_request: NextRequest) {
  try {
    // ✅ New
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', userId);
```

---

## 🗄️ TODO: Add Row Level Security (RLS)

**Once API routes are updated, enable RLS in Supabase:**

```sql
-- Enable RLS on all tables
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;

-- Add policies (users can only see their own data)
CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- Repeat for other tables (applications, courses, daily_tasks, exercise_progress)
```

---

## 🧪 Testing

### Test Login:
1. Go to `/auth/signup`
2. Create account
3. Check email for verification
4. Go to `/auth/login`
5. Sign in
6. Should redirect to `/today`

### Test Protected Routes:
1. Sign out
2. Try to access `/today` → Should redirect to login
3. Try to access `/goals` → Should redirect to login

### Test API:
1. Sign in
2. Open DevTools Network tab
3. Navigate to dashboard
4. API calls should work with your user data

---

## 🎉 What You Get

✅ Secure user authentication  
✅ Protected routes (can't access without login)  
✅ User-specific data (each user sees only their data)  
✅ Professional login/signup UI  
✅ Email verification  
✅ Password reset functionality  

---

## Next Steps

1. ✅ **Auth system is built** (DONE!)
2. ⏳ **Update API routes** (use guide above)
3. ⏳ **Enable RLS in Supabase** (SQL above)
4. ⏳ **Test everything**
5. ⏳ **Add user profile page** (optional)

---

**Ready to migrate? Start with one API route, test it, then do the rest!** 🚀
