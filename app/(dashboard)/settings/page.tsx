'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
    User,
    Mail,
    LogOut,
    Database,
    Trash2,
    MessageSquare,
    ShieldCheck,
    ExternalLink,
    Bell,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAppLanguage } from '@/components/providers/LanguageProvider';
import { updateProfileAction } from '@/app/actions/profile';
import { fetchDemoDataIdsAction } from '@/app/actions/profile';
import { useSoundToast } from '@/lib/hooks/useSoundToast';
import { hasDemoData, removeDemoData } from '@/app/onboarding/demoSeedService';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { usePowerHotkeys, type SummonerSpellAction } from '@/components/providers/PowerHotkeysProvider';
import SettingsSectionSkeleton from '@/components/features/settings/SettingsSectionSkeleton';

const AppearanceSettingsSection = dynamic(
    () => import('@/components/features/settings/AppearanceSettingsSection'),
    { loading: () => <SettingsSectionSkeleton titleWidth="w-36" rows={2} /> },
);

const SoundSettingsSection = dynamic(
    () => import('@/components/features/settings/SoundSettingsSection'),
    { loading: () => <SettingsSectionSkeleton titleWidth="w-28" rows={2} /> },
);

const ChampionSettingsSection = dynamic(
    () => import('@/components/features/settings/ChampionSettingsSection'),
    { loading: () => <SettingsSectionSkeleton titleWidth="w-40" rows={3} /> },
);

export default function SettingsPage() {
    const { user, signOut, refreshUser } = useAuth();
    const { language, setLanguage, copy } = useAppLanguage();
    const { summonerSpells, setSummonerSpell } = usePowerHotkeys();
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

            <AppearanceSettingsSection />

            <SoundSettingsSection />

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

            <ChampionSettingsSection />

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
