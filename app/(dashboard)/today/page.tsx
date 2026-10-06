'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FolderKanban, Mail } from 'lucide-react';
import TerminalStatusBar from '@/components/features/terminal/TerminalStatusBar';
import TodaySchedulePanel from '@/components/features/terminal/TodaySchedulePanel';
import TodayTasksPanel, { DailyTaskItem } from '@/components/features/terminal/TodayTasksPanel';
import ActiveProjectsPanel, { ProjectGoalItem } from '@/components/features/terminal/ActiveProjectsPanel';
import GmailTriagePanel from '@/components/features/terminal/GmailTriagePanel';
import TerminalScratchpad from '@/components/features/terminal/TerminalScratchpad';
import StartupModelCard from '@/components/features/terminal/StartupModelCard';
import type { CalendarEntry } from '@/lib/supabase/calendarEntries';
import type { GmailMessageSummary } from '@/lib/google/gmail';
import { getLocalDayBounds } from '@/lib/utils/date';

export default function TodayCommandCenter() {
  const queryClient = useQueryClient();
  const [rightPanelTab, setRightPanelTab] = useState<'projects' | 'gmail'>('projects');

  // Timezone-safe local day bounds
  const { dateStr: todayStr, startIso: todayStartIso, endIso: todayEndIso } = useMemo(
    () => getLocalDayBounds(),
    []
  );

  // 1. Fetch Today's Calendar Entries (Google + Local)
  const {
    data: calendarData,
    isLoading: isCalendarLoading,
    refetch: refetchCalendar,
  } = useQuery<{ entries: CalendarEntry[] }>({
    queryKey: ['terminal', 'calendar', todayStr],
    queryFn: async () => {
      const res = await fetch(
        `/api/calendar/entries?from=${encodeURIComponent(todayStartIso)}&to=${encodeURIComponent(
          todayEndIso
        )}`
      );
      if (!res.ok) throw new Error('Failed to load calendar');
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  // 2. Fetch Today's Daily Tasks
  const {
    data: tasksData,
    isLoading: isTasksLoading,
    refetch: refetchTasks,
  } = useQuery<DailyTaskItem[]>({
    queryKey: ['terminal', 'tasks', todayStr],
    queryFn: async () => {
      const res = await fetch(`/api/daily-tasks?date=${todayStr}`);
      if (!res.ok) throw new Error('Failed to load tasks');
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  // 3. Fetch Active Projects / Goals
  const {
    data: projectsData,
    isLoading: isProjectsLoading,
    refetch: refetchProjects,
  } = useQuery<ProjectGoalItem[]>({
    queryKey: ['terminal', 'projects'],
    queryFn: async () => {
      const res = await fetch('/api/goals?status=active');
      if (!res.ok) throw new Error('Failed to load projects');
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  // 4. Fetch Recent Gmail Messages
  const {
    data: gmailData,
    isLoading: isGmailLoading,
    refetch: refetchGmail,
  } = useQuery<{ connected: boolean; messages: GmailMessageSummary[]; error?: string }>({
    queryKey: ['terminal', 'gmail'],
    queryFn: async () => {
      const res = await fetch('/api/google/gmail');
      if (!res.ok) throw new Error('Failed to load emails');
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  // Derived state
  const calendarEntries = calendarData?.entries || [];
  const tasks = tasksData || [];
  const projects = projectsData || [];
  const gmailMessages = gmailData?.messages || [];
  const googleConnected = Boolean(gmailData?.connected || calendarEntries.some((e) => e.source === 'google'));

  const tasksCompleted = tasks.filter((t) => t.completed).length;
  const unreadEmailsCount = gmailMessages.filter((m) => m.isUnread).length;

  // --- Handlers ---

  // Add Calendar Event (with Google Calendar Sync)
  const handleAddEvent = async (input: {
    title: string;
    startsAt: string;
    endsAt: string;
    location?: string | undefined;
    syncWithGoogle: boolean;
  }) => {
    try {
      const res = await fetch('/api/calendar/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to create calendar event');
      toast.success(input.syncWithGoogle ? 'Termin in Google Kalender geblockt!' : 'Termin erstellt!');
      await queryClient.invalidateQueries({ queryKey: ['terminal', 'calendar'] });
    } catch {
      toast.error('Fehler beim Erstellen des Termins');
    }
  };

  // Delete Calendar Event
  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/calendar/entries/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete event');
      toast.success('Termin entfernt');
      await queryClient.invalidateQueries({ queryKey: ['terminal', 'calendar'] });
    } catch {
      toast.error('Fehler beim Löschen des Termins');
    }
  };

  // Add Daily Task
  const handleAddTask = async (title: string, timeEstimate?: number) => {
    try {
      const res = await fetch('/api/daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date: todayStr,
          timeEstimate,
        }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      toast.success('Aufgabe angelegt');
      await queryClient.invalidateQueries({ queryKey: ['terminal', 'tasks'] });
    } catch {
      toast.error('Fehler beim Anlegen der Aufgabe');
    }
  };

  // Toggle Daily Task
  const handleToggleTask = async (id: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/daily-tasks/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      await queryClient.invalidateQueries({ queryKey: ['terminal', 'tasks'] });
    } catch {
      toast.error('Fehler beim Aktualisieren der Aufgabe');
    }
  };

  // Delete Daily Task
  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/daily-tasks/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete task');
      await queryClient.invalidateQueries({ queryKey: ['terminal', 'tasks'] });
    } catch {
      toast.error('Fehler beim Löschen');
    }
  };

  // Add Project
  const handleAddProject = async (input: {
    title: string;
    category?: string | undefined;
    description?: string | undefined;
  }) => {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: input.title,
          category: input.category || 'career',
          description: input.description,
          status: 'active',
        }),
      });
      if (!res.ok) throw new Error('Failed to create project');
      toast.success('Projekt angelegt');
      await queryClient.invalidateQueries({ queryKey: ['terminal', 'projects'] });
    } catch {
      toast.error('Fehler beim Anlegen des Projekts');
    }
  };

  // Schedule 60-min Deep Work block for a Project into Google Calendar
  const handleScheduleProject = async (project: ProjectGoalItem) => {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() + 15 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      await handleAddEvent({
        title: `Fokus: ${project.title}`,
        startsAt: startTime.toISOString(),
        endsAt: endTime.toISOString(),
        location: 'Command Center',
        syncWithGoogle: true,
      });
      toast.success(`60 Min für „${project.title}“ im Google Kalender geblockt!`);
    } catch {
      toast.error('Fehler beim Planen des Projekts');
    }
  };

  // Convert Email to Task
  const handleConvertToTask = async (msg: GmailMessageSummary) => {
    try {
      await handleAddTask(`Mail: ${msg.subject}`, 15);
      toast.success('E-Mail als Aufgabe übernommen!');
    } catch {
      toast.error('Fehler beim Erfassen der Aufgabe');
    }
  };

  const handleGlobalRefresh = () => {
    refetchCalendar();
    refetchTasks();
    refetchProjects();
    refetchGmail();
    toast.success('Terminal synchronisiert');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Status Bar */}
      <TerminalStatusBar
        tasksCount={tasks.length}
        tasksCompleted={tasksCompleted}
        eventsCount={calendarEntries.length}
        unreadEmailsCount={unreadEmailsCount}
        googleConnected={googleConnected}
        onRefresh={handleGlobalRefresh}
        onQuickTask={() => {
          window.dispatchEvent(
            new CustomEvent('terminal:quick-capture:open', { detail: { mode: 'task' } })
          );
        }}
        onQuickEvent={() => {
          window.dispatchEvent(
            new CustomEvent('terminal:quick-capture:open', { detail: { mode: 'calendar' } })
          );
        }}
      />

      {/* 2. Main 3-Column Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Column 1: Today's Schedule & Google Calendar */}
        <div className="h-[560px]">
          <TodaySchedulePanel
            entries={calendarEntries}
            isLoading={isCalendarLoading}
            onAddEvent={handleAddEvent}
            onDeleteEvent={handleDeleteEvent}
            onOpenCalendarView={() => {
              window.location.href = '/workspace/calendar';
            }}
          />
        </div>

        {/* Column 2: Focus Tasks & Priorities */}
        <div className="h-[560px]">
          <TodayTasksPanel
            tasks={tasks}
            isLoading={isTasksLoading}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
        </div>

        {/* Column 3: Projects & Email Triage (Tabs) */}
        <div className="flex flex-col h-[560px] space-y-2.5">
          {/* Linear-Style Segmented Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#090C14]/90 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <button
              onClick={() => setRightPanelTab('projects')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all duration-150 ${
                rightPanelTab === 'projects'
                  ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-sm'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
              <span>Projekte ({projects.length})</span>
            </button>

            <button
              onClick={() => setRightPanelTab('gmail')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all duration-150 ${
                rightPanelTab === 'gmail'
                  ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-sm'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-rose-400" />
              <span>Inbox ({unreadEmailsCount})</span>
            </button>
          </div>

          {/* Panel Display */}
          <div className="flex-1 min-h-0">
            {rightPanelTab === 'projects' ? (
              <ActiveProjectsPanel
                projects={projects}
                isLoading={isProjectsLoading}
                onAddProject={handleAddProject}
                onScheduleProject={handleScheduleProject}
              />
            ) : (
              <GmailTriagePanel
                messages={gmailMessages}
                connected={googleConnected}
                isLoading={isGmailLoading}
                error={gmailData?.error}
                onRefresh={refetchGmail}
                onConvertToTask={handleConvertToTask}
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. Startup Venture Telemetry & Financial Model */}
      <StartupModelCard
        onScheduleSession={async (title, durationMin) => {
          const now = new Date();
          const startTime = new Date(now.getTime() + 15 * 60 * 1000);
          const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);

          await handleAddEvent({
            title,
            startsAt: startTime.toISOString(),
            endsAt: endTime.toISOString(),
            location: 'Startup Terminal',
            syncWithGoogle: true,
          });
        }}
      />

      {/* 4. Bottom Quick Scratchpad */}
      <TerminalScratchpad
        onConvertToTask={async (text) => {
          await handleAddTask(text, 25);
        }}
      />
    </div>
  );
}
