'use client';

import { useEffect, useState } from 'react';
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
    Check,
    Volume2,
    VolumeX,
    Music,
    Database,
    Trash2,
    MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { updateProfileAction } from '@/app/actions/profile';
import toast from 'react-hot-toast';
import { hasDemoData, removeDemoData } from '@/app/onboarding/demoSeedService';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { usePowerHotkeys, type SummonerSpellAction } from '@/components/providers/PowerHotkeysProvider';
import { useChampion } from '@/components/providers/ChampionProvider';

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
    const { user, signOut, refreshUser } = useAuth();
    const { theme, setTheme, accentColor, setAccentColor } = useTheme();
    const { play, settings: soundSettings, setEnabled: setSoundEnabled, setMasterVolume } = useAppSound();
    const { summonerSpells, setSummonerSpell } = usePowerHotkeys();
    const { settings: championSettings, updateSettings: updateChampionSettings, stats: championStats } = useChampion();
    const [displayName, setDisplayName] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [lucianMuted, setLucianMuted] = useState(false);
    const [hasDemoDataState, setHasDemoDataState] = useState(false);
    const [showDemoConfirm, setShowDemoConfirm] = useState(false);
    const [removingDemo, setRemovingDemo] = useState(false);

    useEffect(() => {
        const name =
            user?.user_metadata?.full_name ||
            user?.user_metadata?.fullName ||
            user?.user_metadata?.name ||
            user?.email?.split('@')[0] ||
            '';
        setDisplayName(name);
    }, [user]);

    useEffect(() => {
        setLucianMuted(localStorage.getItem('innis_lucian_muted') === '1');
        setHasDemoDataState(hasDemoData());
    }, []);

    const toggleLucianMuted = () => {
        const next = !lucianMuted;
        if (next) {
            localStorage.setItem('innis_lucian_muted', '1');
        } else {
            localStorage.removeItem('innis_lucian_muted');
        }
        setLucianMuted(next);
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            const trimmedName = displayName.trim();
            await updateProfileAction(trimmedName ? { fullName: trimmedName } : {});
            await refreshUser();
            toast.success('Profile updated');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const summonerOptions: Array<{ value: SummonerSpellAction; label: string; description: string }> = [
        { value: 'quick-capture', label: 'Quick Capture', description: 'Open quick task input on Today' },
        { value: 'focus-toggle', label: 'Focus Toggle', description: 'Start/pause/resume focus timer' },
        { value: 'command-bar', label: 'Command Bar', description: 'Open the global command palette' },
        { value: 'go-today', label: 'Go to Today', description: 'Jump directly to Today dashboard' },
        { value: 'new-task', label: 'New Task', description: 'Create a new task action' },
        { value: 'new-goal', label: 'New Goal', description: 'Open goal creation action' },
        { value: 'start-next-best', label: 'Start Next Best', description: 'Execute next best action on Today' },
    ];

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
                                {user?.user_metadata?.full_name || 'INNIS User'}
                            </h3>
                            <div className="flex items-center gap-2 text-text-tertiary">
                                <Mail className="w-4 h-4" />
                                <span>{user?.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[1fr_auto] mb-6">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Display Name
                            </label>
                            <input
                                id="settings-display-name"
                                data-testid="settings-display-name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your name"
                                className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                data-testid="settings-save-profile"
                                variant="primary"
                                onClick={handleSaveProfile}
                                disabled={savingProfile}
                            >
                                {savingProfile ? 'Saving...' : 'Save Profile'}
                            </Button>
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
                                onClick={() => { setTheme(t.id); play('click'); }}
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
                                onClick={() => { setAccentColor(a.id); play('click'); }}
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

            {/* Sound Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        Sound
                    </h2>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                        Saved to local storage
                    </span>
                </div>

                <div className="p-6 bg-surface border border-border rounded-xl space-y-6">
                    {/* On/Off toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-primary">Interaction Sounds</p>
                            <p className="text-xs text-text-tertiary mt-0.5">Subtle audio feedback for UI actions</p>
                        </div>
                        <button
                            onClick={() => setSoundEnabled(!soundSettings.enabled)}
                            className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                soundSettings.enabled ? 'bg-primary' : 'bg-surface-hover'
                            }`}
                            aria-label={soundSettings.enabled ? 'Disable sounds' : 'Enable sounds'}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                    soundSettings.enabled ? 'translate-x-6' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>

                    {/* Volume slider */}
                    <div className={`space-y-3 transition-opacity ${soundSettings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                                {soundSettings.masterVolume === 0 ? (
                                    <VolumeX className="w-4 h-4" />
                                ) : (
                                    <Volume2 className="w-4 h-4" />
                                )}
                                Master Volume
                            </label>
                            <span className="text-xs font-mono text-text-tertiary">
                                {Math.round(soundSettings.masterVolume * 100)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={soundSettings.masterVolume}
                            onChange={(e) => setMasterVolume(Number(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-border"
                        />
                    </div>

                    {/* Preview buttons */}
                    <div className={`space-y-2 pt-4 border-t border-border transition-opacity ${soundSettings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Preview</p>
                        <div className="flex flex-wrap gap-3">
                            {([
                                { event: 'pop' as const, label: 'Pop', description: 'Task complete' },
                                { event: 'swoosh' as const, label: 'Swoosh', description: 'Send / move' },
                                { event: 'click' as const, label: 'Click', description: 'Toggle / select' },
                            ] as const).map(({ event, label, description }) => (
                                <motion.button
                                    key={event}
                                    onClick={() => play(event)}
                                    className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg border border-border hover:border-primary/50 bg-surface-hover hover:bg-primary/5 transition-all text-left"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <span className="text-sm font-medium text-text-primary">{label}</span>
                                    <span className="text-xs text-text-tertiary">{description}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Lucian Companion Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Lucian Companion
                    </h2>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                        Saved to local storage
                    </span>
                </div>

                <div className="p-6 bg-surface border border-border rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-primary">Lucian aktiv</p>
                            <p className="text-xs text-text-tertiary mt-0.5">
                                Kontextuelle Hinweise von deinem Execution Companion
                            </p>
                        </div>
                        <button
                            onClick={toggleLucianMuted}
                            className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                !lucianMuted ? 'bg-primary' : 'bg-surface-hover'
                            }`}
                            aria-label={lucianMuted ? 'Lucian aktivieren' : 'Lucian deaktivieren'}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                    !lucianMuted ? 'translate-x-6' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </section>

            {/* Demo Data Section — only visible when demo data is active */}
            {hasDemoDataState && (
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-text-secondary" />
                        <h2 className="text-xl font-semibold text-text-primary">Demo-Daten</h2>
                    </div>

                    <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-xl space-y-4">
                        <div>
                            <p className="text-sm font-medium text-text-primary mb-1">Beispieldaten aktiv</p>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Dein Dashboard enthält Demo-Kurse, -Ziele und -Aufgaben zum Ausprobieren.
                                Du kannst sie jederzeit entfernen — deine eigenen Daten bleiben erhalten.
                            </p>
                        </div>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setShowDemoConfirm(true)}
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                            Demo-Daten entfernen
                        </Button>
                    </div>

                    <ConfirmModal
                        isOpen={showDemoConfirm}
                        title="Demo-Daten entfernen?"
                        description="Alle Beispielkurse, -ziele und -aufgaben werden unwiderruflich gelöscht. Deine eigenen Daten bleiben erhalten."
                        confirmLabel="Ja, entfernen"
                        dangerous
                        loading={removingDemo}
                        onCancel={() => setShowDemoConfirm(false)}
                        onConfirm={async () => {
                            setRemovingDemo(true);
                            try {
                                await removeDemoData();
                                setHasDemoDataState(false);
                                setShowDemoConfirm(false);
                                toast.success('Demo-Daten wurden entfernt.');
                            } catch {
                                toast.error('Fehler beim Entfernen der Demo-Daten.');
                            } finally {
                                setRemovingDemo(false);
                            }
                        }}
                    />
                </section>
            )}

            {/* Hotkeys Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Power Hotkeys
                    </h2>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                        LoL-style controls
                    </span>
                </div>

                <div className="p-6 bg-surface border border-border rounded-xl space-y-6">
                    <p className="text-sm text-text-secondary">
                        Global keys: <span className="font-mono text-text-primary">1-7</span>,{' '}
                        <span className="font-mono text-text-primary">B</span>,{' '}
                        <span className="font-mono text-text-primary">P</span>,{' '}
                        <span className="font-mono text-text-primary">QWER</span>,{' '}
                        <span className="font-mono text-text-primary">J/K</span>,{' '}
                        <span className="font-mono text-text-primary">?</span>.
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Summoner Spell D</label>
                            <select
                                value={summonerSpells.d}
                                onChange={(event) => setSummonerSpell('d', event.target.value as SummonerSpellAction)}
                                className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                {summonerOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-text-tertiary">
                                {summonerOptions.find((option) => option.value === summonerSpells.d)?.description}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Summoner Spell F</label>
                            <select
                                value={summonerSpells.f}
                                onChange={(event) => setSummonerSpell('f', event.target.value as SummonerSpellAction)}
                                className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                {summonerOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-text-tertiary">
                                {summonerOptions.find((option) => option.value === summonerSpells.f)?.description}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Terminal Champion */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Terminal Champion
                    </h2>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                        Phase 6
                    </span>
                </div>

                <div className="p-6 bg-surface border border-border rounded-xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-primary">Champion enabled</p>
                            <p className="text-xs text-text-tertiary mt-0.5">Desktop pet overlay with LoL controls</p>
                        </div>
                        <button
                            onClick={() => updateChampionSettings({ enabled: !championSettings.enabled })}
                            className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                championSettings.enabled ? 'bg-primary' : 'bg-surface-hover'
                            }`}
                            aria-label={championSettings.enabled ? 'Disable champion' : 'Enable champion'}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                    championSettings.enabled ? 'translate-x-6' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Champion</label>
                            <select
                                value={championSettings.champion}
                                onChange={(event) =>
                                    updateChampionSettings({ champion: event.target.value as 'lucian' | 'aphelios' })
                                }
                                className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="lucian">Lucian (generic gunner sprite for now)</option>
                                <option value="aphelios">Aphelios</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Sprite size</label>
                            <select
                                value={championSettings.renderScale}
                                onChange={(event) =>
                                    updateChampionSettings({ renderScale: event.target.value as 'small' | 'normal' | 'large' })
                                }
                                className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="small">Small</option>
                                <option value="normal">Normal</option>
                                <option value="large">Large</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Passive behavior</label>
                            <select
                                value={championSettings.passiveBehavior}
                                onChange={(event) =>
                                    updateChampionSettings({ passiveBehavior: event.target.value as 'active' | 'idle-only' })
                                }
                                className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="active">Idle + random walk</option>
                                <option value="idle-only">Idle only</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Event reactions</label>
                            <select
                                value={championSettings.eventReactions}
                                onChange={(event) =>
                                    updateChampionSettings({ eventReactions: event.target.value as 'all' | 'none' })
                                }
                                className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="all">All reactions</option>
                                <option value="none">No reactions</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-text-secondary">Range indicator radius</label>
                            <span className="text-xs font-mono text-text-tertiary">{championSettings.rangeRadius}px</span>
                        </div>
                        <input
                            type="range"
                            min={180}
                            max={500}
                            step={10}
                            value={championSettings.rangeRadius}
                            onChange={(event) => updateChampionSettings({ rangeRadius: Number(event.target.value) })}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-border"
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <button
                            onClick={() => updateChampionSettings({ showCooldowns: !championSettings.showCooldowns })}
                            className="rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-text-primary hover:border-primary/40"
                        >
                            Cooldown HUD: {championSettings.showCooldowns ? 'On' : 'Off'}
                        </button>
                        <button
                            onClick={() => updateChampionSettings({ soundsEnabled: !championSettings.soundsEnabled })}
                            className="rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-text-primary hover:border-primary/40"
                        >
                            Champion SFX: {championSettings.soundsEnabled ? 'On' : 'Off'}
                        </button>
                    </div>

                    <div className="rounded-lg border border-border bg-background/40 p-4">
                        <p className="text-xs uppercase tracking-wider text-text-tertiary mb-2">Champion stats</p>
                        <p className="text-sm text-text-primary font-medium">
                            Level {championStats.level} · XP {championStats.xp}/{championStats.nextLevelXp}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
