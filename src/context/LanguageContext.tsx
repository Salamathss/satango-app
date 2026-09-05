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
  setLanguage: () => {},
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
