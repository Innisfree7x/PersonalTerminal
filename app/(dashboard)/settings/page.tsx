'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import {
    User,
    Mail,
    Palette,
    Monitor,
    LogOut,
    Sparkles,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const themes = [
    { id: 'midnight', name: 'Midnight', color: '#0A0A0A', border: '#262626' },
    { id: 'nord', name: 'Nord', color: '#2E3440', border: '#4C566A' },
    { id: 'dracula', name: 'Dracula', color: '#282a36', border: '#6272a4' },
    { id: 'ocean', name: 'Ocean', color: '#0f172a', border: '#334155' },
    { id: 'emerald', name: 'Emerald', color: '#022c22', border: '#065f46' },
    { id: 'gold', name: 'Gold (Premium)', color: 'linear-gradient(135deg, #2e2412 0%, #000 100%)', border: '#ca8a04' },
] as const;

const accents = [
    { id: 'purple', name: 'Purple', color: 'bg-purple-600' },
    { id: 'blue', name: 'Blue', color: 'bg-blue-500' },
    { id: 'green', name: 'Green', color: 'bg-emerald-500' },
    { id: 'orange', name: 'Orange', color: 'bg-orange-500' },
    { id: 'pink', name: 'Pink', color: 'bg-pink-500' },
    { id: 'red', name: 'Red', color: 'bg-red-500' },
    { id: 'gold', name: 'Gold', color: 'bg-yellow-500' },
] as const;

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const { theme, setTheme, accentColor, setAccentColor } = useTheme();

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">Settings</h1>
                <p className="text-text-secondary">Manage your preferences and account settings.</p>
            </div>

            {/* Account Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account
                </h2>
                <div className="p-6 bg-surface border border-border rounded-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-2xl font-bold text-white ring-4 ring-surface">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-text-primary">
                                {user?.user_metadata?.full_name || 'Prism User'}
                            </h3>
                            <div className="flex items-center gap-2 text-text-tertiary">
                                <Mail className="w-4 h-4" />
                                <span>{user?.email}</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() => signOut()}
                        className="text-error hover:text-error hover:bg-error/10 border border-error/30 hover:border-error"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </section>

            {/* Appearance Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Appearance
                    </h2>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                        Saved to local storage
                    </span>
                </div>

                {/* Theme Picker */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        Interface Theme
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {themes.map((t) => (
                            <motion.button
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={`relative group p-4 rounded-xl border-2 text-left transition-all ${theme === t.id
                                    ? 'border-primary ring-2 ring-primary/20'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div
                                    className="w-full aspect-video rounded-lg mb-3 shadow-inner"
                                    style={{ background: t.color, borderColor: t.border, borderWidth: 1 }}
                                >
                                    <div className="w-full h-full p-2 flex gap-2">
                                        <div className="w-1/4 h-full rounded bg-white/5" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-2 w-3/4 rounded bg-white/10" />
                                            <div className="h-2 w-1/2 rounded bg-white/10" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${theme === t.id ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                                        {t.name}
                                    </span>
                                    {theme === t.id && (
                                        <motion.div
                                            layoutId="theme-check"
                                            className="bg-primary text-white p-0.5 rounded-full"
                                        >
                                            <Check className="w-3 h-3" />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Accent Color Picker */}
                <div className="space-y-3 pt-4 border-t border-border">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Accent Color
                    </label>
                    <div className="flex flex-wrap gap-4">
                        {accents.map((a) => (
                            <motion.button
                                key={a.id}
                                onClick={() => setAccentColor(a.id)}
                                className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${accentColor === a.id
                                    ? 'ring-4 ring-offset-2 ring-offset-background'
                                    : 'hover:scale-110'
                                    } ${accentColor === a.id ? 'ring-primary' : ''}`}
                                title={a.name}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <div className={`w-full h-full rounded-full ${a.color} shadow-lg`} />
                                {accentColor === a.id && (
                                    <Check className="absolute w-6 h-6 text-white drop-shadow-md" />
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
