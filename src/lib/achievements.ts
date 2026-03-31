export type AchievementTier = 'easy' | 'medium' | 'hard'

export type AchievementDef = {
  id: string
  emoji: string
  label: string
  desc: string
  tier: AchievementTier
}

export const ALL_ACHIEVEMENTS: AchievementDef[] = [
  // ── Лёгкие ──────────────────────────────────────────────────────────────
  { id: 'first-task',      emoji: '🎯', label: 'Первый шаг',       desc: 'Выполни первую задачу',                        tier: 'easy' },
  { id: 'tasks-5',         emoji: '✅', label: 'Пятёрка',           desc: 'Выполни 5 задач',                              tier: 'easy' },
  { id: 'tasks-10',        emoji: '📋', label: 'Десятка',           desc: 'Выполни 10 задач',                             tier: 'easy' },
  { id: 'tasks-20',        emoji: '🗒️', label: 'Двадцатка',         desc: 'Выполни 20 задач',                             tier: 'easy' },
  { id: 'tasks-30',        emoji: '📌', label: 'Тридцатка',         desc: 'Выполни 30 задач',                             tier: 'easy' },
  { id: 'streak-3',        emoji: '🌱', label: '3 дня подряд',      desc: 'Стрик 3 дня',                                  tier: 'easy' },
  { id: 'streak-7',        emoji: '🔥', label: 'Неделя',            desc: 'Стрик 7 дней',                                 tier: 'easy' },
  { id: 'streak-14',       emoji: '🌊', label: 'Две недели',        desc: 'Стрик 14 дней подряд',                         tier: 'easy' },
  { id: 'total-100',       emoji: '⚡', label: '100 XP',            desc: 'Набери 100 очков опыта',                       tier: 'easy' },
  { id: 'total-250',       emoji: '✨', label: '250 XP',            desc: 'Набери 250 очков опыта',                       tier: 'easy' },
  { id: 'total-500',       emoji: '💫', label: '500 XP',            desc: 'Набери 500 очков опыта',                       tier: 'easy' },
  { id: 'journal-1',       emoji: '📝', label: 'Дневник открыт',    desc: 'Напиши первую запись в дневнике',              tier: 'easy' },
  { id: 'journal-5',       emoji: '📖', label: 'Пять историй',      desc: '5 записей в дневнике',                         tier: 'easy' },
  { id: 'journal-10',      emoji: '📚', label: 'Дневниковед',       desc: '10 записей в дневнике',                        tier: 'easy' },
  { id: 'category-first',  emoji: '🗂️', label: 'Организатор',       desc: 'Создай первую категорию активностей',          tier: 'easy' },
  { id: 'pool-first',      emoji: '🃏', label: 'Первая карта',      desc: 'Добавь первую активность в пул',               tier: 'easy' },
  { id: 'pool-3',          emoji: '🎴', label: 'Мини-пул',          desc: '3 активности в пуле',                          tier: 'easy' },
  { id: 'pool-5',          emoji: '🃏', label: 'Коллекционер',      desc: '5 активностей в пуле',                         tier: 'easy' },
  { id: 'schedule-setup',  emoji: '📅', label: 'Плановик',          desc: 'Настрой рабочее расписание',                   tier: 'easy' },
  { id: 'chat-first',      emoji: '💬', label: 'Первый контакт',    desc: 'Напиши помощнику хотя бы одно сообщение',      tier: 'easy' },
  { id: 'longest-7',       emoji: '🏅', label: 'Рекорд: неделя',   desc: 'Рекордный стрик 7+ дней',                      tier: 'easy' },
  { id: 'xp-sport-100',    emoji: '🏃', label: 'Начатлет',          desc: '100 XP в категории Спорт',                     tier: 'easy' },
  { id: 'xp-study-100',    emoji: '📖', label: 'Первые знания',     desc: '100 XP в категории Учёба',                     tier: 'easy' },
  { id: 'categories-3',    emoji: '🌈', label: '3 категории',       desc: 'Создай 3 разные категории активностей',        tier: 'easy' },
  { id: 'journal-profile', emoji: '🧠', label: 'Самоанализ',        desc: 'Создай первый психологический профиль',        tier: 'easy' },
  // ── Средние ─────────────────────────────────────────────────────────────
  { id: 'tasks-50',        emoji: '📦', label: '50 задач',          desc: 'Выполни 50 задач',                             tier: 'medium' },
  { id: 'tasks-75',        emoji: '🎖️', label: '75 задач',          desc: 'Выполни 75 задач',                             tier: 'medium' },
  { id: 'tasks-100',       emoji: '🏆', label: 'Сотня',             desc: 'Выполни 100 задач',                            tier: 'medium' },
  { id: 'tasks-150',       emoji: '🥇', label: '150 задач',         desc: 'Выполни 150 задач',                            tier: 'medium' },
  { id: 'streak-21',       emoji: '🔥', label: '21 день',           desc: 'Стрик 21 день — привычка сформирована',        tier: 'medium' },
  { id: 'streak-30',       emoji: '🌙', label: 'Месяц',             desc: 'Стрик 30 дней подряд',                         tier: 'medium' },
  { id: 'streak-60',       emoji: '🌟', label: '60 дней',           desc: 'Стрик 60 дней подряд',                         tier: 'medium' },
  { id: 'total-1000',      emoji: '⚡', label: '1000 XP',           desc: 'Набери 1000 очков опыта',                      tier: 'medium' },
  { id: 'total-2000',      emoji: '🔋', label: '2000 XP',           desc: 'Набери 2000 очков опыта',                      tier: 'medium' },
  { id: 'total-5000',      emoji: '💎', label: '5000 XP',           desc: 'Набери 5000 очков опыта',                      tier: 'medium' },
  { id: 'journal-25',      emoji: '📖', label: 'Летописец',         desc: '25 записей в дневнике',                        tier: 'medium' },
  { id: 'journal-50',      emoji: '📚', label: 'Писатель',          desc: '50 записей в дневнике',                        tier: 'medium' },
  { id: 'pool-10',         emoji: '🗃️', label: 'Арсенал',           desc: '10 активностей в пуле',                        tier: 'medium' },
  { id: 'pool-20',         emoji: '🗂️', label: 'Библиотека',        desc: '20 активностей в пуле',                        tier: 'medium' },
  { id: 'xp-sport-500',    emoji: '💪', label: 'Атлет',             desc: '500 XP в категории Спорт',                     tier: 'medium' },
  { id: 'xp-study-500',    emoji: '🎓', label: 'Студент',           desc: '500 XP в категории Учёба',                     tier: 'medium' },
  { id: 'xp-finance-200',  emoji: '💰', label: 'Инвестор',          desc: '200 XP в категории Финансы',                   tier: 'medium' },
  { id: 'categories-5',    emoji: '🌍', label: '5 категорий',       desc: 'Создай 5 разных категорий',                    tier: 'medium' },
  { id: 'longest-30',      emoji: '🏆', label: 'Рекорд: месяц',    desc: 'Рекордный стрик 30+ дней',                     tier: 'medium' },
  { id: 'chat-10',         emoji: '🤖', label: 'Завсегдатай',       desc: '10+ сообщений помощнику',                      tier: 'medium' },
  // ── Тяжёлые ─────────────────────────────────────────────────────────────
  { id: 'streak-100',      emoji: '🔥', label: '100 дней',          desc: 'Стрик 100 дней подряд',                        tier: 'hard' },
  { id: 'streak-200',      emoji: '🌋', label: '200 дней',          desc: 'Стрик 200 дней подряд',                        tier: 'hard' },
  { id: 'streak-365',      emoji: '👑', label: 'Целый год',         desc: 'Стрик 365 дней подряд',                        tier: 'hard' },
  { id: 'tasks-250',       emoji: '🎯', label: '250 задач',         desc: 'Выполни 250 задач',                            tier: 'hard' },
  { id: 'tasks-500',       emoji: '🏭', label: '500 задач',         desc: 'Выполни 500 задач',                            tier: 'hard' },
  { id: 'tasks-1000',      emoji: '🚀', label: '1000 задач',        desc: 'Выполни 1000 задач — настоящий марафон',       tier: 'hard' },
  { id: 'total-10000',     emoji: '🌟', label: '10 000 XP',         desc: 'Набери 10 000 очков опыта',                    tier: 'hard' },
  { id: 'total-20000',     emoji: '🌠', label: '20 000 XP',         desc: 'Набери 20 000 очков опыта',                    tier: 'hard' },
  { id: 'total-50000',     emoji: '👑', label: '50 000 XP',         desc: 'Набери 50 000 очков — легенда',                tier: 'hard' },
  { id: 'all-tracks',      emoji: '🎖️', label: 'Мастер на все',     desc: 'Набери XP в 5+ разных категориях',             tier: 'hard' },
  { id: 'longest-100',     emoji: '🏆', label: 'Рекорд: 100',      desc: 'Рекордный стрик 100+ дней',                    tier: 'hard' },
  { id: 'journal-100',     emoji: '📜', label: 'Хронист',           desc: '100 записей в дневнике',                       tier: 'hard' },
  { id: 'pool-50',         emoji: '🗄️', label: 'Мегапул',           desc: '50 активностей в пуле',                        tier: 'hard' },
  { id: 'categories-8',    emoji: '🌐', label: 'Всесторонний',      desc: 'Создай 8 и более категорий',                   tier: 'hard' },
  { id: 'xp-all-1000',     emoji: '🔮', label: 'Полимат',           desc: 'Набери 1000+ XP в трёх разных категориях',     tier: 'hard' },
]

export const ACHIEVEMENT_MAP = Object.fromEntries(ALL_ACHIEVEMENTS.map(a => [a.id, a]))

export const TIER_COLORS: Record<AchievementTier, { color: string; bg: string; border: string }> = {
  easy:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
}
