// src/context/LanguageContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Language = "ru" | "en";

export const translations = {
  en: {
    // Navigation & Tabs
    home: "Home",
    vocab: "Vocab",
    exams: "Exams",
    analytics: "Analytics",
    shop: "Shop",
    calculator: "Calculator",
    profile: "Profile",
    admin: "Admin",

    // Header & Greeting
    digitalSatPrep: "Digital SAT Prep",
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    goodNight: "Good night",
    learner: "Learner",
    examHall: "Exam Hall",
    examHallDesc: "Full SAT & sectional mock tests",
    reviewMistakes: "Review My Mistakes",
    errorsPending: "error(s) pending · No hearts lost",
    learningPath: "Your Learning Path",

    // Settings & Profile
    settings: "Settings",
    appearance: "Appearance",
    theme: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    language: "Language",
    russian: "Русский (RU)",
    english: "English (EN)",
    signOut: "Sign out",
    hearts: "Hearts",
    streak: "Streak",
    gems: "Gems",
    xp: "XP",
    level: "Level",
    administrator: "Administrator",
    student: "Student",
    weakAreas: "Weak Areas",

    // Daily Chest & Rewards
    dailyChest: "Daily Gem Chest",
    dailyChestDesc: "Log in daily to claim free gems",
    claimedToday: "Claimed Today",
    claimReward: "Claim Reward",
    claimedNotice: "Next reward available tomorrow",
    dayLabel: "Day",

    // Calculator
    calculatorTitle: "Digital SAT Score Calculator",
    calculatorDesc: "Convert your raw scores into scaled section scores (200–800) and estimate your total out of 1600.",
    rawInputs: "Raw Section Scores",
    readingWriting: "Reading & Writing",
    math: "Math",
    targetScore: "Target Total Score",
    totalScaledScore: "Total Scaled Score",
    gapToTarget: "Gap to Target",
    atOrAboveTarget: "at or above target",
    belowTarget: "points below target",
    onTrackMessage: "You're on track for your target score! Solidify with full-length mock exams.",
    needPracticeMessage: "Focus on your weaker section in practice modules to close the gap.",
    calculatorNote: "Calculated using official College Board concordance approximation curve.",
    rawCorrect: "correct answers",
    presetTarget: "Target",
    practiceWeakest: "Practice Weak Areas",
    takeDiagnosticMock: "Take Mock Exam",

    // Dashboard Quests & Quick Hub
    dailyQuests: "Daily Objectives",
    questCompleteLesson: "Complete 1 practice quiz",
    questClaimChest: "Open daily diamond chest",
    questReviewMistakes: "Review mistakes in ledger",
    allQuestsDone: "All objectives completed!",
    quickActions: "Quick Launch",
    battleArena: "1v1 SAT Battle",
    vocabCard: "Word of the Day",
    targetGoal: "Target SAT",

    // Common UI
    close: "Close",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    back: "Back",
    continue: "Continue",
  },
  ru: {
    // Navigation & Tabs
    home: "Главная",
    vocab: "Словарь",
    exams: "Тесты",
    analytics: "Аналитика",
    shop: "Магазин",
    calculator: "Калькулятор",
    profile: "Профиль",
    admin: "Админ",

    // Header & Greeting
    digitalSatPrep: "Digital SAT Подготовка",
    goodMorning: "Доброе утро",
    goodAfternoon: "Добрый день",
    goodEvening: "Добрый вечер",
    goodNight: "Доброй ночи",
    learner: "Ученик",
    examHall: "Экзаменационный центр",
    examHallDesc: "Полные & секционные SAT пробники",
    reviewMistakes: "Работа над ошибками",
    errorsPending: "ошибок на разбор · Жизни не тратятся",
    learningPath: "Твой план обучения",

    // Settings & Profile
    settings: "Настройки",
    appearance: "Оформление",
    theme: "Тема",
    darkMode: "Тёмная тема",
    lightMode: "Светлая тема",
    language: "Язык интерфейса",
    russian: "Русский (RU)",
    english: "English (EN)",
    signOut: "Выйти",
    hearts: "Жизни",
    streak: "Серия",
    gems: "Гемы",
    xp: "Опыт",
    level: "Уровень",
    administrator: "Администратор",
    student: "Студент",
    weakAreas: "Слабые темы",

    // Daily Chest & Rewards
    dailyChest: "Ежедневный сундук алмазов",
    dailyChestDesc: "Заходи каждый день за бесплатными кристаллами",
    claimedToday: "Собрано сегодня",
    claimReward: "Забрать награду",
    claimedNotice: "Следующая награда будет доступна завтра",
    dayLabel: "День",

    // Calculator
    calculatorTitle: "Калькулятор баллов Digital SAT",
    calculatorDesc: "Переведи количество правильных ответов в баллы шкалы 200–800 и рассчитай общий результат из 1600.",
    rawInputs: "Первичные баллы (правильные ответы)",
    readingWriting: "Reading & Writing (Чтение и письмо)",
    math: "Math (Математика)",
    targetScore: "Целевой балл",
    totalScaledScore: "Итоговый балл",
    gapToTarget: "Разрыв до цели",
    atOrAboveTarget: "выше или равно цели",
    belowTarget: "баллов до цели",
    onTrackMessage: "Отличный результат! Ты достигаешь своей цели. Закрепи на полноценных пробниках.",
    needPracticeMessage: "Сделай упор на более слабую секцию в модулях практики, чтобы закрыть разрыв.",
    calculatorNote: "Расчёт основан на аппроксимации официальной шкалы конкорданса College Board.",
    rawCorrect: "правильных ответов",
    presetTarget: "Цель",
    practiceWeakest: "Тренировать слабые темы",
    takeDiagnosticMock: "Сдать пробный экзамен",

    // Dashboard Quests & Quick Hub
    dailyQuests: "Дневные цели",
    questCompleteLesson: "Пройти 1 урок практики",
    questClaimChest: "Открыть ежедневный сундук",
    questReviewMistakes: "Разобрать ошибки в карцере",
    allQuestsDone: "Все цели на сегодня выполнены!",
    quickActions: "Быстрый доступ",
    battleArena: "1v1 SAT Дуэль",
    vocabCard: "Слово дня",
    targetGoal: "Цель SAT",

    // Common UI
    close: "Закрыть",
    save: "Сохранить",
    cancel: "Отмена",
    confirm: "Подтвердить",
    back: "Назад",
    continue: "Продолжить",
  },
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "ru",
  setLanguage: () => { },
  t: (key: TranslationKey) => translations.ru[key] || key,
});

const LANG_KEY = "satango_language";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_KEY) as Language;
    if (saved === "ru" || saved === "en") return saved;
    return "ru";
  });

  useEffect(() => {
    localStorage.setItem(LANG_KEY, language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
