# 🐛 DEBUG: University Exercises nicht synchronisiert

## Problem:
User erledigt Exercise in University Tab → bleibt im Dashboard

## Was SOLLTE passieren:
1. User checkt "Mathe 1: Blatt 1" in University ✅
2. Exercise wird als `completed: true` gespeichert ✅
3. Dashboard refetched study-tasks Query
4. API returned NÄCHSTES incomplete Exercise (Blatt 2)
5. Dashboard zeigt Blatt 2 statt Blatt 1

## Was zu checken ist:

### 1. Ist die Exercise ID konsistent?
- Dashboard: task.id = `study-${studyTask.id}`
- Was ist studyTask.id? courseId-exerciseNumber?

### 2. Wird die richtige API aufgerufen?
- `/api/courses/${courseId}/exercises/${exerciseNumber}` PATCH

### 3. Wird die study-tasks Query refetched?
- `queryClient.refetchQueries({ queryKey: ['study-tasks'] })`

### 4. Gibt die API die richtigen Daten zurück?
- `/api/dashboard/study-tasks` sollte completed exercises filtern

## DEBUG STEPS:

1. Push code & restart dev server
2. Open browser console
3. Erledige Exercise in University
4. Gehe zu Dashboard
5. Checke Console logs:
   - "📚 COURSES FETCHED: X"
   - "✅ RETURNING STUDY TASKS: X tasks"
6. Ist das Exercise noch da?

## MÖGLICHE URSACHEN:

A) Exercise ID mismatch
   - Dashboard denkt es ist Exercise 1
   - Aber API bekommt falsche ID

B) Query refetch funktioniert nicht
   - Mutation succeeds but query doesn't refetch
   - Cache problem

C) API gibt falsche Daten
   - `completed: true` wird nicht gespeichert
   - API gibt immer gleiche Exercise zurück
