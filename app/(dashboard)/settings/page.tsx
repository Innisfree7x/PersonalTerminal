'use client';

import { useEffect, useState } from 'react';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme, type Theme, type AccentColor } from '@/components/providers/ThemeProvider';
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
    ShieldCheck,
    ExternalLink,
    Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { useAppLanguage } from '@/components/providers/LanguageProvider';
import { updateProfileAction } from '@/app/actions/profile';
import { fetchDemoDataIdsAction } from '@/app/actions/profile';
import { useSoundToast } from '@/lib/hooks/useSoundToast';
import { hasDemoData, removeDemoData } from '@/app/onboarding/demoSeedService';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { usePowerHotkeys, type SummonerSpellAction } from '@/components/providers/PowerHotkeysProvider';
import { useChampion } from '@/components/providers/ChampionProvider';

const themes = [
    { id: 'gold', name: 'Gold (Premium)', preview: 'linear-gradient(135deg, #2f2412 0%, #0b0908 100%)', border: '#ca8a04', tag: 'Metal' },
    { id: 'platinum', name: 'Platinum', preview: 'linear-gradient(135deg, #1d2430 0%, #0a0f16 100%)', border: '#64748b', tag: 'Metal' },
    { id: 'sapphire', name: 'Sapphire', preview: 'linear-gradient(135deg, #162646 0%, #070e1e 100%)', border: '#0ea5e9', tag: 'Metal' },
    { id: 'copper', name: 'Copper', preview: 'linear-gradient(135deg, #3d2318 0%, #140d0a 100%)', border: '#ea580c', tag: 'Metal' },
    { id: 'amethyst', name: 'Amethyst', preview: 'linear-gradient(135deg, #362357 0%, #130d1f 100%)', border: '#a855f7', tag: 'Metal' },
    { id: 'obsidian', name: 'Obsidian', preview: 'linear-gradient(135deg, #1a1610 0%, #080808 100%)', border: '#d4af37', tag: 'Metal' },
    { id: 'rosegold', name: 'Rose Gold', preview: 'linear-gradient(135deg, #2a1c1e 0%, #0d0a0b 100%)', border: '#de968c', tag: 'Metal' },
    { id: 'carbon', name: 'Carbon', preview: 'linear-gradient(135deg, #1e1e22 0%, #0c0c0e 100%)', border: '#a0a5af', tag: 'Metal' },
    { id: 'titanium', name: 'Titanium', preview: 'linear-gradient(135deg, #1e2230 0%, #111214 100%)', border: '#829bc3', tag: 'Metal' },
    { id: 'onyx', name: 'Onyx', preview: 'linear-gradient(135deg, #0e160f 0%, #050505 100%)', border: '#50c878', tag: 'Metal' },
    { id: 'midnight', name: 'Midnight', preview: '#0A0A0A', border: '#262626' },
    { id: 'nord', name: 'Nord', preview: '#2E3440', border: '#4C566A' },
    { id: 'dracula', name: 'Dracula', preview: '#282a36', border: '#6272a4' },
    { id: 'ocean', name: 'Ocean', preview: '#0f172a', border: '#334155' },
    { id: 'emerald', name: 'Emerald', preview: '#022c22', border: '#065f46' },
] as const satisfies ReadonlyArray<{ id: Theme; name: string; preview: string; border: string; tag?: string }>;

const accents = [
    { id: 'gold', name: 'Gold', swatch: 'linear-gradient(135deg, rgb(234 179 8), rgb(245 158 11))' },
    { id: 'sunset', name: 'Sunset', swatch: 'linear-gradient(135deg, rgb(249 115 22), rgb(236 72 153))' },
    { id: 'aurora', name: 'Aurora', swatch: 'linear-gradient(135deg, rgb(16 185 129), rgb(59 130 246))' },
    { id: 'royal', name: 'Royal', swatch: 'linear-gradient(135deg, rgb(99 102 241), rgb(236 72 153))' },
    { id: 'plasma', name: 'Plasma', swatch: 'linear-gradient(135deg, rgb(168 85 247), rgb(59 130 246))' },
    { id: 'ember', name: 'Ember', swatch: 'linear-gradient(135deg, rgb(239 68 68), rgb(245 158 11))' },
    { id: 'red', name: 'Red', swatch: 'radial-gradient(circle at 30% 25%, rgb(248 113 113), rgb(220 38 38))' },
    { id: 'purple', name: 'Purple', swatch: 'radial-gradient(circle at 30% 25%, rgb(192 132 252), rgb(109 40 217))' },
    { id: 'blue', name: 'Blue', swatch: 'radial-gradient(circle at 30% 25%, rgb(96 165 250), rgb(37 99 235))' },
    { id: 'green', name: 'Green', swatch: 'radial-gradient(circle at 30% 25%, rgb(52 211 153), rgb(5 150 105))' },
    { id: 'orange', name: 'Orange', swatch: 'radial-gradient(circle at 30% 25%, rgb(251 146 60), rgb(234 88 12))' },
    { id: 'pink', name: 'Pink', swatch: 'radial-gradient(circle at 30% 25%, rgb(244 114 182), rgb(219 39 119))' },
    { id: 'champagne', name: 'Champagne', swatch: 'linear-gradient(135deg, rgb(212 175 55), rgb(232 204 110))' },
    { id: 'ice', name: 'Ice', swatch: 'linear-gradient(135deg, rgb(148 210 236), rgb(200 230 255))' },
    { id: 'rose', name: 'Rosé', swatch: 'linear-gradient(135deg, rgb(201 135 143), rgb(232 169 176))' },
    { id: 'jade', name: 'Jade', swatch: 'linear-gradient(135deg, rgb(0 168 107), rgb(46 204 113))' },
    { id: 'slate', name: 'Slate', swatch: 'linear-gradient(135deg, rgb(112 128 144), rgb(143 163 179))' },
] as const satisfies ReadonlyArray<{ id: AccentColor; name: string; swatch: string }>;

const championVfxPresetDescriptions = {
    de: {
        performance: 'Niedrigste VFX-Last für ältere Geräte und maximale Flüssigkeit.',
        balanced: 'Standard-Preset mit starker Lesbarkeit und stabiler Performance.',
        cinematic: 'Aufwendigeres Spell-Polish mit dichteren Partikeln und längerem Nachglühen.',
    },
    en: {
        performance: 'Lowest VFX load for older devices and maximum smoothness.',
        balanced: 'Default preset with strong readability and stable performance.',
        cinematic: 'Heavier spell polish with denser particles and longer afterglow.',
    },
} as const;

export default function SettingsPage() {
    const { user, signOut, refreshUser } = useAuth();
    const { theme, setTheme, accentColor, setAccentColor } = useTheme();
    const { language, setLanguage, copy } = useAppLanguage();
    const {
        play,
        settings: soundSettings,
        setEnabled: setSoundEnabled,
        setMasterVolume,
        setNotificationSound,
    } = useAppSound();
    const { summonerSpells, setSummonerSpell } = usePowerHotkeys();
    const {
        settings: championSettings,
        updateSettings: updateChampionSettings,
        resetPosition: resetChampionPosition,
        restoreDefaults: restoreChampionDefaults,
        stats: championStats,
    } = useChampion();
    const soundToast = useSoundToast();
    const [displayName, setDisplayName] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [lucianMuted, setLucianMuted] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [hasDemoDataState, setHasDemoDataState] = useState(false);
    const [showDemoConfirm, setShowDemoConfirm] = useState(false);
    const [removingDemo, setRemovingDemo] = useState(false);
    const isGerman = language === 'de';

    useEffect(() => {
        const name =
            user?.user_metadata?.full_name ||
            user?.user_metadata?.fullName ||
            user?.user_metadata?.name ||
            user?.email?.split('@')[0] ||
            '';
        setDisplayName(name);
        // email_notifications defaults to true when not set
        setEmailNotifications(user?.user_metadata?.email_notifications !== false);
    }, [user]);

    useEffect(() => {
        let active = true;
        const loadDemoState = async () => {
            setLucianMuted(localStorage.getItem('innis_lucian_muted') === '1');
            const localHasData = hasDemoData();
            if (localHasData) {
                if (active) setHasDemoDataState(true);
                return;
            }
            try {
                const remoteIds = await fetchDemoDataIdsAction();
                const remoteHasData = !!remoteIds && (remoteIds.courseIds.length + remoteIds.goalIds.length + remoteIds.taskIds.length > 0);
                if (active) setHasDemoDataState(remoteHasData);
            } catch {
                if (active) setHasDemoDataState(false);
            }
        };
        void loadDemoState();
        return () => {
            active = false;
        };
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

    const toggleEmailNotifications = async () => {
        const next = !emailNotifications;
        setEmailNotifications(next);
        try {
            await updateProfileAction({ emailNotifications: next });
            await refreshUser();
            soundToast.success(next ? (isGerman ? 'E-Mail-Benachrichtigungen aktiviert.' : 'Email notifications enabled.') : (isGerman ? 'E-Mail-Benachrichtigungen deaktiviert.' : 'Email notifications disabled.'));
        } catch {
            // revert on error
            setEmailNotifications(!next);
            soundToast.error(isGerman ? 'Einstellung konnte nicht gespeichert werden.' : 'Setting could not be saved.');
        }
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            const trimmedName = displayName.trim();
            await updateProfileAction(trimmedName ? { fullName: trimmedName } : {});
            await refreshUser();
            soundToast.success(isGerman ? 'Profil aktualisiert.' : 'Profile updated.');
        } catch (error) {
            soundToast.error(error instanceof Error ? error.message : isGerman ? 'Profil konnte nicht gespeichert werden. Bitte erneut versuchen.' : 'Profile could not be saved. Please try again.');
        } finally {
            setSavingProfile(false);
        }
    };

    const summonerOptions: Array<{ value: SummonerSpellAction; label: string; description: string }> = [
        {
            value: 'quick-capture',
            label: isGerman ? 'Quick Capture' : 'Quick Capture',
            description: isGerman ? 'Öffnet die schnelle Aufgabenerfassung in Heute' : 'Open quick task input on Today',
        },
        {
            value: 'focus-toggle',
            label: isGerman ? 'Fokus umschalten' : 'Focus Toggle',
            description: isGerman ? 'Startet, pausiert oder setzt den Fokus-Timer fort' : 'Start, pause, or resume focus timer',
        },
        {
            value: 'command-bar',
            label: isGerman ? 'Command Bar' : 'Command Bar',
            description: isGerman ? 'Öffnet die globale Command-Palette' : 'Open the global command palette',
        },
        {
            value: 'go-today',
            label: isGerman ? 'Zu Heute' : 'Go to Today',
            description: isGerman ? 'Springt direkt ins Heute-Dashboard' : 'Jump directly to Today dashboard',
        },
        {
            value: 'new-task',
            label: isGerman ? 'Neue Aufgabe' : 'New Task',
            description: isGerman ? 'Öffnet die Aktion zum Anlegen einer Aufgabe' : 'Create a new task action',
        },
        {
            value: 'new-goal',
            label: isGerman ? 'Neues Ziel' : 'New Goal',
            description: isGerman ? 'Öffnet die Aktion zum Anlegen eines Ziels' : 'Open goal creation action',
        },
        {
            value: 'start-next-best',
            label: isGerman ? 'Nächste beste Aktion' : 'Start Next Best',
            description: isGerman ? 'Führt die nächste beste Aktion in Heute aus' : 'Execute next best action on Today',
        },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">{copy.settings.title}</h1>
                <p className="text-text-secondary">{copy.settings.description}</p>
            </div>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {copy.settings.languageTitle}
                </h2>
                <div className="p-6 bg-surface border border-border rounded-xl space-y-4">
                    <div>
                        <p className="text-sm text-text-secondary">
                            {copy.settings.languageDescription}
                        </p>
                    </div>
                    <div className="inline-flex rounded-xl border border-border bg-surface-hover/60 p-1">
                        {(['de', 'en'] as const).map((value) => {
                            const isActive = language === value;
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setLanguage(value)}
                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                        isActive
                                            ? 'bg-primary/20 text-primary border border-primary/25 shadow-[0_0_16px_rgb(var(--primary)/0.12)]'
                                            : 'border border-transparent text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {value === 'de' ? copy.settings.german : copy.settings.english}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Account Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {copy.settings.account}
                </h2>
                <div className="p-6 bg-surface border border-border rounded-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-2xl font-bold text-white ring-4 ring-surface">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-text-primary">
                                {user?.user_metadata?.full_name || (isGerman ? 'INNIS Nutzer' : 'INNIS User')}
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
                                {copy.settings.displayName}
                            </label>
                            <input
                                id="settings-display-name"
                                data-testid="settings-display-name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder={copy.settings.yourName}
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
                                {savingProfile ? copy.settings.savingProfile : copy.settings.saveProfile}
                            </Button>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() => signOut()}
                        className="text-error hover:text-error hover:bg-error/10 border border-error/30 hover:border-error"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        {copy.settings.signOut}
                    </Button>
                </div>
            </section>

            {/* Appearance Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        {copy.settings.appearance}
                    </h2>
                    <span className="settings-chip">
                        {copy.settings.savedLocal}
                    </span>
                </div>

                {/* Theme Picker */}
                <div className="space-y-3 rounded-2xl border border-border bg-surface/60 p-4 sm:p-5">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        {copy.settings.interfaceTheme}
                    </label>
                    <p className="text-xs text-text-tertiary">
                        {isGerman
                            ? 'Premium-Themes bleiben über Desktop- und Tablet-Layouts hinweg visuell konsistent.'
                            : 'Premium themes stay visually consistent across desktop and tablet layouts.'}
                    </p>
                    <div className="settings-theme-grid">
                        {themes.map((t) => (
                            <motion.button
                                key={t.id}
                                onClick={() => { setTheme(t.id); play('click'); }}
                                className={`settings-theme-card ${theme === t.id ? 'settings-theme-card--active' : ''}`}
                                whileHover={{ scale: 1.012 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                {theme === t.id ? (
                                    <motion.div
                                        layoutId="theme-check"
                                        className="absolute right-2 top-2 rounded-full border border-primary/40 bg-primary/15 p-1 text-primary"
                                    >
                                        <Check className="h-3 w-3" />
                                    </motion.div>
                                ) : null}
                                <div
                                    className="settings-theme-preview"
                                    style={{ background: t.preview, borderColor: t.border }}
                                >
                                    <div className="h-full w-full p-2.5">
                                        <div className="flex h-full gap-2.5 rounded-lg border border-white/10 bg-black/15 p-2">
                                            <div className="h-full w-6 shrink-0 rounded-md bg-white/10" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-2.5 w-4/5 rounded bg-white/20" />
                                                <div className="h-2.5 w-2/3 rounded bg-white/12" />
                                                <div className="h-2.5 w-3/4 rounded bg-white/10" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 min-h-[2.5rem]">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`block text-sm font-semibold leading-tight ${theme === t.id ? 'text-text-primary' : 'text-text-secondary'}`}>
                                            {t.name}
                                        </span>
                                        {'tag' in t && t.tag ? (
                                            <span className="rounded-full border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-text-tertiary">
                                                {t.tag}
                                            </span>
                                        ) : (
                                            <span className="rounded-full border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-text-tertiary">
                                                Core
                                            </span>
                                        )}
                                    </div>
                                    <span className="mt-1 block text-[11px] text-text-tertiary">
                                        {theme === t.id ? copy.settings.active : copy.settings.select}
                                    </span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Accent Color Picker */}
                <div className="space-y-3 border-t border-border pt-5">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        {copy.settings.accentColor}
                    </label>
                    <div className="settings-accent-grid">
                        {accents.map((a) => (
                            <motion.button
                                key={a.id}
                                onClick={() => { setAccentColor(a.id); play('click'); }}
                                className={`settings-accent-chip ${accentColor === a.id ? 'settings-accent-chip--active' : ''}`}
                                title={a.name}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div
                                    className="settings-accent-swatch"
                                    style={{ background: a.swatch }}
                                >
                                    <span className="settings-accent-swatch-overlay" />
                                </div>
                                <span className="min-w-0 truncate text-[11px] font-medium text-text-secondary">
                                    {a.name}
                                </span>
                                {accentColor === a.id ? (
                                    <span className="absolute right-1.5 top-1.5 rounded-full border border-primary/35 bg-primary/20 p-0.5 text-primary">
                                        <Check className="h-3 w-3" />
                                    </span>
                                ) : null}
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
                        {copy.settings.sound}
                    </h2>
                    <span className="settings-chip">
                        {copy.settings.savedLocal}
                    </span>
                </div>

                <div className="p-6 bg-surface border border-border rounded-xl space-y-6">
                    {/* On/Off toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-primary">{isGerman ? 'Interaktionssounds' : 'Interaction Sounds'}</p>
                            <p className="text-xs text-text-tertiary mt-0.5">{isGerman ? 'Subtiles Audio-Feedback für UI-Aktionen' : 'Subtle audio feedback for UI actions'}</p>
                        </div>
                        <ToggleSwitch
                            enabled={soundSettings.enabled}
                            onChange={(v) => setSoundEnabled(v)}
                            ariaLabel={soundSettings.enabled ? (isGerman ? 'Sounds deaktivieren' : 'Disable sounds') : (isGerman ? 'Sounds aktivieren' : 'Enable sounds')}
                        />
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
                                {isGerman ? 'Master-Lautstärke' : 'Master Volume'}
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
                        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">{isGerman ? 'Vorschau' : 'Preview'}</p>
                        <div className="space-y-2 mb-3">
                            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">{isGerman ? 'Benachrichtigungston' : 'Notification Tone'}</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNotificationSound('teams-default');
                                        play('pop', { notificationSound: 'teams-default', force: true });
                                    }}
                                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                                        soundSettings.notificationSound === 'teams-default'
                                            ? 'border-primary/60 bg-primary/15 text-primary'
                                            : 'border-border bg-surface-hover text-text-secondary hover:border-primary/35'
                                    }`}
                                >
                                    {isGerman ? 'Teams-Kit' : 'Teams Kit'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNotificationSound('classic');
                                        play('pop', { notificationSound: 'classic', force: true });
                                    }}
                                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                                        soundSettings.notificationSound === 'classic'
                                            ? 'border-primary/60 bg-primary/15 text-primary'
                                            : 'border-border bg-surface-hover text-text-secondary hover:border-primary/35'
                                    }`}
                                >
                                    {isGerman ? 'Classic Synth' : 'Classic Synth'}
                                </button>
                            </div>
                            <p className="text-[11px] text-text-tertiary">
                                {isGerman
                                    ? 'Das Teams-Kit deckt Benachrichtigung, Swoosh und Click ab. Quelle ist das verlinkte Community-Pack für die private Nutzung.'
                                    : 'Teams kit covers notification, swoosh and click. Sourced from the linked community pack for personal use.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {([
                                {
                                    event: 'pop' as const,
                                    label: isGerman ? 'Benachrichtigung' : 'Notification',
                                    description: soundSettings.notificationSound === 'teams-default' ? 'Teams kit' : 'Classic synth',
                                },
                                {
                                    event: 'swoosh' as const,
                                    label: 'Swoosh',
                                    description: soundSettings.notificationSound === 'teams-default'
                                        ? (isGerman ? 'Teams Bewegungs-Cue' : 'Teams move cue')
                                        : (isGerman ? 'Senden / verschieben' : 'Send / move'),
                                },
                                {
                                    event: 'click' as const,
                                    label: 'Click',
                                    description: soundSettings.notificationSound === 'teams-default'
                                        ? (isGerman ? 'Teams UI-Tick' : 'Teams UI tick')
                                        : (isGerman ? 'Umschalten / auswählen' : 'Toggle / select'),
                                },
                            ] as const).map(({ event, label, description }) => (
                                <motion.button
                                    key={event}
                                    onClick={() =>
                                        play(event, {
                                            force: true,
                                            ...(event === 'pop' || event === 'swoosh' || event === 'click'
                                                ? { notificationSound: soundSettings.notificationSound }
                                                : {}),
                                        })
                                    }
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
                        {copy.settings.lucian}
                    </h2>
                    <span className="settings-chip">
                        {copy.settings.savedLocal}
                    </span>
                </div>

                <div className="p-6 bg-surface border border-border rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-primary">{isGerman ? 'Lucian aktiv' : 'Lucian enabled'}</p>
                            <p className="text-xs text-text-tertiary mt-0.5">
                                {isGerman ? 'Kontextuelle Hinweise von deinem Execution Companion' : 'Contextual hints from your execution companion'}
                            </p>
                        </div>
                        <ToggleSwitch
                            enabled={!lucianMuted}
                            onChange={() => toggleLucianMuted()}
                            ariaLabel={lucianMuted ? (isGerman ? 'Lucian aktivieren' : 'Enable Lucian') : (isGerman ? 'Lucian deaktivieren' : 'Disable Lucian')}
                        />
                    </div>
                </div>
            </section>

            {/* Demo Data Section — only visible when demo data is active */}
            {hasDemoDataState && (
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-text-secondary" />
                        <h2 className="text-xl font-semibold text-text-primary">{isGerman ? 'Demo-Daten' : 'Demo Data'}</h2>
                    </div>

                    <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-xl space-y-4">
                        <div>
                            <p className="text-sm font-medium text-text-primary mb-1">{isGerman ? 'Beispieldaten aktiv' : 'Sample data active'}</p>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                {isGerman
                                    ? 'Dein Dashboard enthält Demo-Kurse, -Ziele und -Aufgaben zum Ausprobieren. Du kannst sie jederzeit entfernen — deine eigenen Daten bleiben erhalten.'
                                    : 'Your dashboard currently contains demo courses, goals, and tasks for exploration. You can remove them at any time — your own data stays untouched.'}
                            </p>
                        </div>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setShowDemoConfirm(true)}
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                            {isGerman ? 'Demo-Daten entfernen' : 'Remove Demo Data'}
                        </Button>
                    </div>

                    <ConfirmModal
                        isOpen={showDemoConfirm}
                        title={isGerman ? 'Demo-Daten entfernen?' : 'Remove demo data?'}
                        description={isGerman ? 'Alle Beispielkurse, -ziele und -aufgaben werden unwiderruflich gelöscht. Deine eigenen Daten bleiben erhalten.' : 'All sample courses, goals, and tasks will be deleted permanently. Your own data will stay untouched.'}
                        confirmLabel={isGerman ? 'Ja, entfernen' : 'Yes, remove'}
                        dangerous
                        loading={removingDemo}
                        onCancel={() => setShowDemoConfirm(false)}
                        onConfirm={async () => {
                            setRemovingDemo(true);
                            try {
                                await removeDemoData();
                                setHasDemoDataState(false);
                                setShowDemoConfirm(false);
                                soundToast.success(isGerman ? 'Demo-Daten wurden entfernt.' : 'Demo data was removed.');
                            } catch {
                                soundToast.error(isGerman ? 'Fehler beim Entfernen der Demo-Daten.' : 'Failed to remove demo data.');
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
                        {copy.settings.powerHotkeys}
                    </h2>
                    <span className="settings-chip">
                        {isGerman ? 'LoL-inspirierte Steuerung' : 'LoL-style controls'}
                    </span>
                </div>

                <div className="p-6 bg-surface border border-border rounded-xl space-y-6">
                    <p className="text-sm text-text-secondary">
                        {isGerman ? 'Globale Tasten:' : 'Global keys:'} <span className="font-mono text-text-primary">1-7</span>,{' '}
                        <span className="font-mono text-text-primary">B</span>,{' '}
                        <span className="font-mono text-text-primary">P</span>,{' '}
                        <span className="font-mono text-text-primary">QWER</span>,{' '}
                        <span className="font-mono text-text-primary">J/K</span>,{' '}
                        <span className="font-mono text-text-primary">?</span>.
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">{isGerman ? 'Summoner Spell D' : 'Summoner Spell D'}</label>
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
                            <label className="text-sm font-medium text-text-secondary">{isGerman ? 'Summoner Spell F' : 'Summoner Spell F'}</label>
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
                        {copy.settings.champion}
                    </h2>
                </div>

                <div className="p-6 bg-surface border border-border rounded-xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-primary">{isGerman ? 'Champion aktiv' : 'Champion enabled'}</p>
                            <p className="text-xs text-text-tertiary mt-0.5">{isGerman ? 'Desktop-Pet-Overlay mit LoL-Steuerung' : 'Desktop pet overlay with LoL controls'}</p>
                        </div>
                        <ToggleSwitch
                            enabled={championSettings.enabled}
                            onChange={(v) => updateChampionSettings({ enabled: v })}
                            ariaLabel={championSettings.enabled ? (isGerman ? 'Champion deaktivieren' : 'Disable champion') : (isGerman ? 'Champion aktivieren' : 'Enable champion')}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">{isGerman ? 'Champion' : 'Champion'}</label>
                            <select
                                value={championSettings.champion}
                                onChange={(event) =>
                                    updateChampionSettings({ champion: event.target.value as 'lucian' | 'aphelios' })
                                }
                                className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="lucian">Lucian (Chibi Sprite V2)</option>
                                <option value="aphelios">Aphelios</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">{isGerman ? 'Sprite-Größe' : 'Sprite size'}</label>
                            <select
                                value={championSettings.renderScale}
                                onChange={(event) =>
                                    updateChampionSettings({ renderScale: event.target.value as 'small' | 'normal' | 'large' })
                                }
                                className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="small">{isGerman ? 'Klein' : 'Small'}</option>
                                <option value="normal">{isGerman ? 'Normal' : 'Normal'}</option>
                                <option value="large">{isGerman ? 'Groß' : 'Large'}</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">{isGerman ? 'Passives Verhalten' : 'Passive behavior'}</label>
                            <select
                                value={championSettings.passiveBehavior}
                                onChange={(event) =>
                                    updateChampionSettings({ passiveBehavior: event.target.value as 'active' | 'idle-only' })
                                }
                                className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="active">{isGerman ? 'Idle + Zufallsbewegung' : 'Idle + random walk'}</option>
                                <option value="idle-only">{isGerman ? 'Nur Idle' : 'Idle only'}</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">{isGerman ? 'Event-Reaktionen' : 'Event reactions'}</label>
                            <select
                                value={championSettings.eventReactions}
                                onChange={(event) =>
                                    updateChampionSettings({ eventReactions: event.target.value as 'all' | 'none' })
                                }
                                className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="all">{isGerman ? 'Alle Reaktionen' : 'All reactions'}</option>
                                <option value="none">{isGerman ? 'Keine Reaktionen' : 'No reactions'}</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">{isGerman ? 'VFX-Preset' : 'VFX preset'}</label>
                        <select
                            value={championSettings.vfxPreset}
                            onChange={(event) =>
                                updateChampionSettings({ vfxPreset: event.target.value as 'performance' | 'balanced' | 'cinematic' })
                            }
                            className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="performance">{isGerman ? 'Performance' : 'Performance'}</option>
                            <option value="balanced">{isGerman ? 'Ausgewogen' : 'Balanced'}</option>
                            <option value="cinematic">{isGerman ? 'Cinematic' : 'Cinematic'}</option>
                        </select>
                        <p className="text-xs text-text-tertiary">
                            {championVfxPresetDescriptions[language][championSettings.vfxPreset]}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-text-secondary">{isGerman ? 'Reichweitenradius' : 'Range indicator radius'}</label>
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
                            {isGerman ? 'Cooldown-HUD' : 'Cooldown HUD'}: {championSettings.showCooldowns ? (isGerman ? 'An' : 'On') : (isGerman ? 'Aus' : 'Off')}
                        </button>
                        <button
                            onClick={() => updateChampionSettings({ soundsEnabled: !championSettings.soundsEnabled })}
                            className="rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-text-primary hover:border-primary/40"
                        >
                            {isGerman ? 'Champion-SFX' : 'Champion SFX'}: {championSettings.soundsEnabled ? (isGerman ? 'An' : 'On') : (isGerman ? 'Aus' : 'Off')}
                        </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                resetChampionPosition();
                                soundToast.success(isGerman ? 'Champion-Position zurückgesetzt.' : 'Champion position reset.');
                            }}
                        >
                            {isGerman ? 'Position zurücksetzen' : 'Reset position'}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                restoreChampionDefaults();
                                soundToast.success(isGerman ? 'Lucian-Standards wiederhergestellt.' : 'Lucian defaults restored.');
                            }}
                        >
                            {isGerman ? 'Lucian wiederherstellen' : 'Restore Lucian'}
                        </Button>
                    </div>

                    <div className="rounded-lg border border-border bg-background/40 p-4">
                        <p className="text-xs uppercase tracking-wider text-text-tertiary mb-2">{isGerman ? 'Champion-Statistiken' : 'Champion stats'}</p>
                        <p className="text-sm text-text-primary font-medium">
                            {isGerman ? 'Level' : 'Level'} {championStats.level} · XP {championStats.xp}/{championStats.nextLevelXp}
                        </p>
                    </div>
                </div>
            </section>

            {/* Datenschutz & Analytics Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    {copy.settings.privacy}
                </h2>

                {/* Email notifications toggle */}
                <div className="p-5 bg-surface border border-border rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                            <Bell className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-text-primary">{isGerman ? 'E-Mail-Benachrichtigungen' : 'Email notifications'}</p>
                                <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">
                                    {isGerman
                                        ? 'Prüfungs-Erinnerungen (3, 7 und 14 Tage vorher) sowie wöchentliche Fortschritts-Reports.'
                                        : 'Exam reminders (3, 7, and 14 days ahead) plus weekly progress reports.'}
                                </p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={emailNotifications}
                            onChange={() => void toggleEmailNotifications()}
                            ariaLabel={emailNotifications ? (isGerman ? 'E-Mail-Benachrichtigungen deaktivieren' : 'Disable email notifications') : (isGerman ? 'E-Mail-Benachrichtigungen aktivieren' : 'Enable email notifications')}
                        />
                    </div>

                    <div className="border-t border-border pt-4">
                        <p className="text-xs text-text-tertiary leading-relaxed">
                            {isGerman ? (
                                <>
                                    INNIS nutzt <span className="text-text-secondary font-medium">Vercel Analytics</span> für anonymisierte Nutzungsdaten
                                    (z.B. ob das Onboarding abgeschlossen wurde). Keine Inhalte, keine Cookies, keine IP-Speicherung.
                                </>
                            ) : (
                                <>
                                    INNIS uses <span className="text-text-secondary font-medium">Vercel Analytics</span> for anonymized usage data
                                    (for example, whether onboarding was completed). No content, no cookies, no IP storage.
                                </>
                            )}
                        </p>
                        <a
                            href="/privacy"
                            className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors mt-2"
                        >
                            <ExternalLink className="w-3 h-3" />
                            {isGerman ? 'Datenschutzerklärung lesen' : 'Read privacy policy'}
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
