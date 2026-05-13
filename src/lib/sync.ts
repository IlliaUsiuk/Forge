import { supabase } from './supabase'
import { useStore } from './store'
import { computeAchievements } from './store'

// Keys to exclude from cloud sync (session-only or derived)
const EXCLUDE_KEYS = new Set(['password'])

// Load user data from Supabase and hydrate the store
export async function loadUserData(userId: string) {
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Load error:', error)
    return false
  }

  if (!data?.data || typeof data.data !== 'object') {
    // New user — create an empty row so future saves work
    await supabase.from('user_data').upsert({ id: userId, data: {} }, { onConflict: 'id' })
    return false
  }

  const stored = data.data as Record<string, unknown>
  const patch: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(stored)) {
    if (!EXCLUDE_KEYS.has(k)) patch[k] = v
  }

  // Remove legacy auto-generated recurring tasks (hardcoded personal tasks from old system)
  const LEGACY_TRACKS = new Set(['ai', 'design', 'selfdevelopment', 'mediabuy', 'english', 'polish', 'gym'])
  if (Array.isArray(patch.tasks)) {
    patch.tasks = (patch.tasks as Record<string, unknown>[]).filter(
      t => !(t.isRecurring === true && LEGACY_TRACKS.has(t.track as string))
    )
  }

  useStore.setState(patch)

  // Sync apiKey to localStorage so it survives sessions even if Supabase JSON is stale
  if (typeof window !== 'undefined' && typeof patch.apiKey === 'string' && patch.apiKey) {
    localStorage.setItem('forge-api-key', patch.apiKey)
  }

  // Silently re-compute achievements from loaded state (fixes missing saves)
  const s = useStore.getState()
  const synced = computeAchievements(s, s.achievements)
  if (synced.length !== s.achievements.length) {
    useStore.setState({ achievements: synced })
  }

  // Create weekly backup in background (don't await)
  createBackupIfNeeded(userId)

  return true
}

// Save current store state to Supabase (debounced by caller)
export async function saveUserData(userId: string) {
  const state = useStore.getState()
  const data: Record<string, unknown> = {}

  const keys: (keyof typeof state)[] = [
    'userName', 'avatarUrl', 'apiKey',
    'tasks', 'workDays', 'dayJobs',
    'streak', 'trackXP', 'onboardingDone',
    'chatHistory', 'dailyXP', 'achievements',
    'journalEntries', 'journalProfiles',
    'categories', 'templateTasks', 'scheduleSettings',
    'plans',
  ]

  for (const key of keys) {
    data[key] = state[key]
  }

  const { error } = await supabase
    .from('user_data')
    .upsert({ id: userId, data }, { onConflict: 'id' })

  if (error) console.error('Save error:', error.code, error.message, error.details, error.hint)
}

// Create a weekly backup snapshot, keep last 8
export async function createBackupIfNeeded(userId: string) {
  const BACKUP_INTERVAL_DAYS = 7
  const MAX_BACKUPS = 8
  const LAST_BACKUP_KEY = `forge-last-backup-${userId}`

  const lastBackup = localStorage.getItem(LAST_BACKUP_KEY)
  const now = Date.now()
  if (lastBackup && now - Number(lastBackup) < BACKUP_INTERVAL_DAYS * 86400_000) return

  const state = useStore.getState()

  // Don't backup empty/fresh state — must have some meaningful data
  const hasData = state.tasks.length > 0 || state.journalEntries.length > 0 || state.categories.length > 0
  if (!hasData) return

  const data: Record<string, unknown> = {}
  const keys: (keyof typeof state)[] = [
    'userName', 'avatarUrl', 'tasks', 'workDays', 'dayJobs',
    'streak', 'trackXP', 'dailyXP', 'achievements',
    'journalEntries', 'journalProfiles',
    'categories', 'templateTasks', 'scheduleSettings',
  ]
  for (const key of keys) data[key] = state[key]

  const { error } = await supabase
    .from('user_data_backups')
    .insert({ user_id: userId, data })

  if (error) { console.error('Backup error:', error.message, error.code, error.details); return }

  // Delete oldest backups beyond MAX_BACKUPS
  const { data: backups } = await supabase
    .from('user_data_backups')
    .select('id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (backups && backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS).map(b => b.id)
    await supabase.from('user_data_backups').delete().in('id', toDelete)
  }

  localStorage.setItem(LAST_BACKUP_KEY, String(now))
}

// Reset store to clean defaults (called on login to prevent cross-user data leakage)
export function clearLocalStore() {
  useStore.setState({
    userName: '',
    avatarUrl: '',
    apiKey: '',
    tasks: [],
    workDays: [],
    dayJobs: [],
    streak: { current: 0, longest: 0, lastActiveDate: '', freezeUsedMonth: null },
    trackXP: {},
    onboardingDone: false,
    chatHistory: [],
    dailyXP: {},
    achievements: [],
    journalEntries: [],
    journalProfiles: {},
    categories: [],
    templateTasks: [],
    scheduleSettings: { wakeTime: '07:00', commuteToWorkMin: 30, prepMin: 60, departBufMin: 10 },
    plans: [],
  })
}

// Sign out and clear local store state
export async function signOut() {
  await supabase.auth.signOut()
  // Reset store to defaults
  useStore.setState({
    userName: '',
    avatarUrl: '',
    apiKey: '',
    tasks: [],
    workDays: [],
    dayJobs: [],
    streak: { current: 0, longest: 0, lastActiveDate: '', freezeUsedMonth: null },
    trackXP: {},
    onboardingDone: false,
    chatHistory: [],
    dailyXP: {},
    achievements: [],
    journalEntries: [],
    journalProfiles: {},
    categories: [],
    templateTasks: [],
    scheduleSettings: { wakeTime: '07:00', commuteToWorkMin: 30, prepMin: 60, departBufMin: 10 },
    plans: [],
  })
}
