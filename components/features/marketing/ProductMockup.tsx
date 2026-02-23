'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Timer, TrendingUp, BookOpen, Flame } from 'lucide-react';
import { BrandMark } from '@/components/shared/BrandLogo';

const tasks = [
  { title: 'Übungsblatt 8 einreichen', done: true },
  { title: 'Klausurvorbereitung Kap. 5', done: false },
  { title: 'Bewerbung für Praktikum', done: false },
];

const navItems = ['Today', 'Calendar', 'Goals', 'University', 'Career', 'Analytics'];

export function ProductMockup() {
  return (
    <div className="relative">
      {/* Ambient glow behind mockup */}
      <div className="pointer-events-none absolute -inset-10 rounded-3xl bg-gradient-to-tr from-red-500/15 via-transparent to-yellow-500/12 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 -bottom-8 mx-auto h-24 w-3/4 rounded-full bg-red-500/10 blur-2xl" />

      {/* Floating animation wrapper */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        {/* Browser chrome */}
        <div className="premium-card relative overflow-hidden rounded-3xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
          {/* Browser top bar */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-[#0A0A0A]/90 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <div className="flex-1 mx-3 h-5 rounded-md bg-white/5 flex items-center px-3">
              <span className="text-[10px] text-zinc-600 font-mono">innis.io/today</span>
            </div>
          </div>

          {/* Dashboard layout */}
          <div className="flex" style={{ height: '400px' }}>
            {/* Sidebar */}
            <div className="flex w-16 flex-shrink-0 flex-col items-center gap-4 border-r border-white/10 bg-[#0A0A0A] py-4">
              {/* Logo */}
              <BrandMark sizeClassName="h-8 w-8" className="mb-1 shadow-none" />
              {/* Nav dots */}
              {navItems.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className={`w-8 h-1.5 rounded-full ${i === 0 ? 'bg-red-500' : 'bg-white/8'}`}
                />
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-hidden bg-[#0F0F0F] p-5">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between mb-4"
              >
                <p className="text-xs font-semibold text-[#FAF0E6]">Today</p>
                <div className="px-2 py-0.5 rounded bg-[#1C1C1C] border border-white/5">
                  <p className="text-[10px] text-zinc-500 font-mono">14:51</p>
                </div>
              </motion.div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Aufgaben', value: '4 / 7', icon: CheckCircle2, color: 'text-red-400' },
                  { label: 'Streak', value: '12 Tage', icon: Flame, color: 'text-orange-400' },
                  { label: 'Fokus', value: '2h 40m', icon: Timer, color: 'text-violet-400' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.08 }}
                    className="rounded-xl border border-white/10 bg-[#1C1C1C] p-2.5"
                  >
                    <stat.icon className={`w-3 h-3 ${stat.color} mb-1.5`} />
                    <p className="text-[10px] text-zinc-600 leading-none mb-0.5">{stat.label}</p>
                    <p className="text-xs font-semibold text-[#FAF0E6]">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Task list */}
              <div className="mb-4">
                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-2">Aufgaben</p>
                <div className="space-y-1.5">
                  {tasks.map((task, i) => (
                    <motion.div
                      key={task.title}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + i * 0.08 }}
                      className="flex items-center gap-2 py-1"
                    >
                      {task.done ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-zinc-700 flex-shrink-0" />
                      )}
                      <p className={`text-[11px] leading-none ${task.done ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                        {task.title}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Course progress */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 }}
                className="rounded-xl border border-white/10 bg-[#1C1C1C] p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-3 h-3 text-blue-400" />
                  <p className="text-[11px] font-medium text-[#FAF0E6]">Lineare Algebra II</p>
                  <p className="text-[10px] text-zinc-600 ml-auto">7 / 12</p>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '58%' }}
                    transition={{ delay: 1.1, duration: 0.9, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            </div>

            {/* Right sidebar widget */}
            <div className="flex w-28 flex-shrink-0 flex-col gap-3 border-l border-white/10 bg-[#0A0A0A] p-3">
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Ziel-Streak</p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center"
              >
                <p className="text-2xl font-bold text-[#FAF0E6]">🔥 12</p>
                <p className="text-[10px] text-zinc-500">Tage in Folge</p>
              </motion.div>
              <div className="mt-auto">
                <div className="flex items-center gap-1 mb-1.5">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <p className="text-[10px] text-zinc-500">Fortschritt</p>
                </div>
                <div className="space-y-1">
                  {[80, 60, 90, 45, 75].map((v, i) => (
                    <div key={i} className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500/60 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${v}%` }}
                        transition={{ delay: 1 + i * 0.08, duration: 0.5 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reflection/shadow effect */}
        <div className="absolute -bottom-7 left-8 right-6 h-8 rounded-full bg-black/40 blur-xl" />
      </motion.div>
    </div>
  );
}
