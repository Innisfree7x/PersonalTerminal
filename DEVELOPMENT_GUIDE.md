# 🚀 Development Guide - AI-Assisted Coding Best Practices

## 📋 Before Starting Any Feature

### 1. Write Tests First (TDD)
```bash
# Start test watcher
npm run test:watch

# Write your test
# Example: tests/unit/MyFeature.test.tsx

# Then let AI implement the feature
# Test should pass!
```

### 2. Small, Incremental Changes
- ❌ Don't: "Refactor entire component + add 3 features"
- ✅ Do: One small change → Test → Commit → Next change

### 3. Always Review AI Code
Before accepting AI suggestions:
- Read the entire code
- Understand what it does
- Check for edge cases
- Ask: "What could break?"

## 🛠️ Tooling Setup

### TypeScript - Ultra Strict
```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

### ESLint - Catch Bugs Early
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/rules-of-hooks": "error",
    "@typescript-eslint/no-floating-promises": "error"
  }
}
```

### Pre-commit Hooks
- Runs automatically before every commit
- Blocks commits if:
  - Linting fails
  - Type checking fails
  - Tests fail

## 📝 Git Workflow

### Commit Messages Format
```
<type>: <short description>

<detailed description>

<why this change was made>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding tests
- `docs`: Documentation
- `chore`: Tooling/config

**Example:**
```
feat: Add AI task suggestion endpoint

Implements /api/ai/suggest-tasks that analyzes user's
goals and deadlines to suggest daily tasks.

Uses OpenAI GPT-4 with structured output for consistency.
Includes rate limiting (10 requests/hour per user).
```

## 🤖 Working with AI Agents

### Give Clear Specifications
❌ Bad: "Fix the bug"
✅ Good: "When user clicks checkbox, update DB and refetch ['tasks'] query. Test this flow."

### Context Management
- Start new chat every 20-30 messages
- Or when switching to new feature
- Document what was done in previous chat

### Template for New Agent Chat
```
# PROJECT: Personal Terminal

## Current Task: [YOUR TASK]

## Tech Stack:
- Next.js 14, TypeScript, Supabase, TanStack Query

## Requirements:
1. [Specific requirement]
2. [Specific requirement]
3. [Expected behavior]

## Constraints:
- Must write tests first (TDD)
- Must be type-safe (no `any`)
- Must follow existing patterns in codebase

## Definition of Done:
- [ ] Tests pass
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Manually tested in browser
- [ ] Code reviewed
```

## 🧪 Testing Strategy

### What to Test
1. **Critical User Flows** - Marking tasks complete, creating goals
2. **Data Transformations** - Parsing, validation, calculations
3. **Edge Cases** - Empty states, errors, loading states

### Test Structure
```typescript
describe('Feature', () => {
  it('should handle happy path', () => {
    // Arrange
    // Act
    // Assert
  });
  
  it('should handle error case', () => {
    // ...
  });
});
```

## 🚨 Common Pitfalls to Avoid

1. **React Hooks Rules** - Always call hooks at top level
2. **Async/Await** - Don't forget to await promises
3. **Type Safety** - Avoid `any`, use proper types
4. **Mutation Side Effects** - Always refetch affected queries
5. **Error Handling** - Wrap API calls in try/catch

## 📊 Quality Checklist Before Committing

- [ ] Code reviewed (read every line)
- [ ] Tests written and passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Manually tested in browser
- [ ] Edge cases considered
- [ ] Error states handled
- [ ] Loading states handled

## 🎯 Daily Workflow

1. **Morning:** Review what needs to be done
2. **Plan:** Break down into small tasks
3. **TDD:** Write test for first task
4. **Implement:** Let AI help, but review everything
5. **Test:** Manual + automated testing
6. **Commit:** Small, focused commits
7. **Repeat:** Next small task

## 💡 Remember

> AI is your junior developer.
> You are the senior developer.
> Review everything. Trust, but verify.

---

**Let's build something great! 🚀**
