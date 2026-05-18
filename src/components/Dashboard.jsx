import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Apple,
  BarChart2,
  Camera,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  Home as HomeIcon,
  Search,
  Scale,
  Info,
  User,
  Utensils,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { getServingNutrition } from '../utils/nutrition';

function ScoreDial({ score }) {
  const normalized = Math.max(0, Math.min(score, 10));
  const circumference = 2 * Math.PI * 42;
  const dash = (normalized / 10) * circumference;
  const color = normalized >= 8 ? '#4B6F44' : normalized >= 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="fitscan-score-dial" aria-label={`Average score ${normalized} out of 10`}>
      <svg viewBox="0 0 104 104" role="img">
        <circle cx="52" cy="52" r="42" className="fitscan-score-track" />
        <circle
          cx="52"
          cy="52"
          r="42"
          className="fitscan-score-value"
          stroke={color}
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="fitscan-score-copy">
        <strong>{normalized ? normalized.toFixed(1) : '--'}</strong>
        <span>Score</span>
      </div>
    </div>
  );
}

function MacroRow({ label, value, max, color }) {
  const percent = value > 0 ? Math.max(8, Math.min((value / max) * 100, 100)) : 0;

  return (
    <div className="fitscan-macro-row">
      <div className="fitscan-macro-label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="fitscan-macro-track">
        <span style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}

function BottomNav({ onNavigate }) {
  const { t } = useTranslation();

  return (
    <nav className="fitscan-home-nav" aria-label="Primary navigation">
      <div className="fitscan-nav-pill">
        <button className="is-active" type="button" aria-label="Home" title={t('home')}>
          <HomeIcon size={24} />
          <span>{t('home')}</span>
        </button>
        <button type="button" onClick={() => onNavigate('compare')} aria-label="Comparison" title={t('compare')}>
          <BarChart2 size={24} />
          <span>{t('compare')}</span>
        </button>
        <button type="button" onClick={() => onNavigate('profile')} aria-label="Profile" title={t('profile')}>
          <User size={24} />
          <span>{t('profile')}</span>
        </button>
      </div>
      <button className="fitscan-nav-scan" type="button" onClick={() => onNavigate('home')} aria-label="Scan product" title={t('scan')}>
        <Camera size={28} />
        <span>{t('scan')}</span>
      </button>
    </nav>
  );
}

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toMonthKey = (date) => toDateKey(date).slice(0, 7);

const parseScanDate = (scan) => {
  const rawDate = scan.created_at || scan.createdAt || scan.date;
  const parsed = rawDate ? new Date(rawDate) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
};

const startOfWeek = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
};

const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const monthKeyToDate = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
};

const safeJsonValue = (value, fallback = null) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const numberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNutrientValue = (value, decimals = 0) => {
  const parsed = numberOrNull(value);
  if (parsed === null) return '--';
  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(decimals);
};

const firstNumericValue = (...values) => {
  for (const value of values) {
    const parsed = numberOrNull(value);
    if (parsed !== null) return parsed;
  }
  return null;
};

const getScanNutriments = (scan) => {
  const rawProductData = safeJsonValue(scan.raw_product_data, null) || safeJsonValue(scan.product_data, null);
  const direct = safeJsonValue(scan.nutriments, null) || safeJsonValue(scan.nutrition, null);
  return direct || rawProductData?.nutriments || rawProductData?.nutrition || rawProductData?.nutrientLevels || {};
};

const getScanProductData = (scan) => (
  safeJsonValue(scan.raw_product_data, null) || safeJsonValue(scan.product_data, null) || {}
);

const parseServingGrams = (productData, nutriments) => {
  const directServing = firstNumericValue(
    productData?.serving_quantity,
    nutriments?.serving_quantity,
    nutriments?.serving_size
  );
  if (directServing !== null) return directServing;

  const servingText = String(productData?.serving_size || nutriments?.serving_size || '');
  const match = servingText.match(/(\d+(?:\.\d+)?)\s*(g|gram|grams|ml|millilitre|milliliter|millilitres|milliliters)\b/i);
  return match ? Number(match[1]) : null;
};

const getServingAmount = ({ nutriments, servingKeys, per100Keys, servingGrams, multiplier = 1 }) => {
  const servingValue = firstNumericValue(...servingKeys.map((key) => nutriments?.[key]));
  if (servingValue !== null) return servingValue * multiplier;

  const per100Value = firstNumericValue(...per100Keys.map((key) => nutriments?.[key]));
  if (per100Value === null || servingGrams === null) return null;

  return (per100Value * servingGrams * multiplier) / 100;
};

const getServingSodiumMg = (nutriments, servingGrams) => {
  const sodiumMgServing = firstNumericValue(nutriments?.sodium_mg_serving, nutriments?.sodium_mg, nutriments?.sodium_mg_value);
  if (sodiumMgServing !== null) return sodiumMgServing;

  const sodiumServingGrams = firstNumericValue(nutriments?.sodium_serving, nutriments?.sodium_value);
  if (sodiumServingGrams !== null) return sodiumServingGrams * 1000;

  const sodiumMg100g = firstNumericValue(nutriments?.sodium_mg_100g);
  if (sodiumMg100g !== null && servingGrams !== null) return (sodiumMg100g * servingGrams) / 100;

  const sodium100gGrams = firstNumericValue(nutriments?.sodium_100g, nutriments?.sodium);
  if (sodium100gGrams !== null && servingGrams !== null) return (sodium100gGrams * servingGrams * 1000) / 100;

  const saltServingGrams = firstNumericValue(nutriments?.salt_serving);
  if (saltServingGrams !== null) return saltServingGrams * 400;

  const salt100gGrams = firstNumericValue(nutriments?.salt_100g, nutriments?.salt);
  if (salt100gGrams !== null && servingGrams !== null) return (salt100gGrams * servingGrams * 400) / 100;

  return null;
};

const getRecentNutrientChips = (scan, servings = 1) => {
  const nutriments = getScanNutriments(scan);
  const productData = getScanProductData(scan);
  const servingGrams = parseServingGrams(productData, nutriments);
  const sodiumMg = getServingSodiumMg(nutriments, servingGrams);
  const multiplier = Number.isFinite(Number(servings)) ? Number(servings) : 1;

  return [
    {
      icon: '🔥',
      label: 'Calories',
      value: `${formatNutrientValue((getServingAmount({
        nutriments,
        servingKeys: ['energy-kcal_serving', 'energy_kcal_serving', 'energy-kcal_value', 'energy_kcal_value', 'calories_serving', 'caloriesServing'],
        per100Keys: ['energy-kcal_100g', 'energy-kcal', 'energy_kcal_100g', 'energy_kcal', 'calories'],
        servingGrams,
      }) ?? 0) * multiplier)} kcal`,
    },
    {
      icon: '💪',
      label: 'Protein',
      value: `${formatNutrientValue(((getServingAmount({
        nutriments,
        servingKeys: ['proteins_serving', 'protein_serving', 'proteins_value', 'protein_value', 'proteinServing'],
        per100Keys: ['proteins_100g', 'protein_100g', 'protein', 'proteins'],
        servingGrams,
      }) ?? 0) * multiplier), 1)}g`,
    },
    {
      icon: '🌾',
      label: 'Carbs',
      value: `${formatNutrientValue(((getServingAmount({
        nutriments,
        servingKeys: ['carbohydrates_serving', 'carbs_serving', 'carbohydrates_value', 'carbs_value', 'carbohydratesServing', 'carbsServing'],
        per100Keys: ['carbohydrates_100g', 'carbs_100g', 'carbs', 'carbohydrates'],
        servingGrams,
      }) ?? 0) * multiplier), 1)}g`,
    },
    { icon: '🧂', label: 'Sodium', value: `${formatNutrientValue((sodiumMg ?? 0) * multiplier)}mg` },
    {
      icon: '🫙',
      label: 'Fats',
      value: `${formatNutrientValue(((getServingAmount({
        nutriments,
        servingKeys: ['fat_serving', 'fats_serving', 'fat_value', 'fats_value', 'fatServing', 'fatsServing'],
        per100Keys: ['fat_100g', 'fats_100g', 'fat', 'fats'],
        servingGrams,
      }) ?? 0) * multiplier), 1)}g`,
    },
  ];
};

function WeekSelector({
  selectedDate,
  selectedMonth,
  selectedDayCount,
  selectedMonthCount,
  weekStart,
  onChangeMonth,
  onSelectDate,
  onShiftWeek,
}) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const selectedKey = toDateKey(selectedDate);
  const selectedMonthName = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(monthKeyToDate(selectedMonth));

  return (
    <section className="fitscan-week-card" aria-label="Filter scans by date">
      <div className="fitscan-week-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong>{selectedMonthName}</strong>
          <label style={{ position: 'relative', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: 'var(--ns-primary)', transition: 'color 160ms' }}>
            <CalendarDays size={16} />
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => onChangeMonth(event.target.value)}
              aria-label="Select month"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: 0,
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                padding: 0,
                border: 'none',
                overflow: 'hidden'
              }}
            />
          </label>
        </div>
        <span>{selectedMonthCount} scans this month</span>
      </div>

      <div className="fitscan-date-navigation-wrapper">
        <button 
          type="button" 
          onClick={() => onShiftWeek(-1)} 
          aria-label="Previous week"
          className="fitscan-nav-arrow-btn"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="fitscan-week-strip" role="list" aria-label="Week days">
          {days.map((date) => {
            const dayKey = toDateKey(date);
            const isSelected = dayKey === selectedKey;
            const isOutsideMonth = toMonthKey(date) !== selectedMonth;

            return (
              <button
                key={dayKey}
                type="button"
                className={`${isSelected ? 'is-selected' : ''}${isOutsideMonth ? ' is-muted' : ''}`}
                onClick={() => onSelectDate(date)}
                aria-pressed={isSelected}
              >
                <span>{new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date)}</span>
                <strong>{date.getDate()}</strong>
              </button>
            );
          })}
        </div>

        <button 
          type="button" 
          onClick={() => onShiftWeek(1)} 
          aria-label="Next week"
          className="fitscan-nav-arrow-btn"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <p className="fitscan-selected-day">
        {new Intl.DateTimeFormat('en-IN', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        }).format(selectedDate)}
        <span>{selectedDayCount} scans</span>
      </p>
    </section>
  );
}

function BMICard({ userProfile, onNavigate }) {
  const { t } = useTranslation();
  const height = parseFloat(userProfile?.height); // in cm
  const weight = parseFloat(userProfile?.weight); // in kg
  const age = userProfile?.age;
  const gender = userProfile?.gender;

  const hasData = height > 0 && weight > 0;

  let bmi = 0;
  let category = '';
  let color = '#94a3b8';
  let position = 0; // 0 to 100 for the indicator

  if (hasData) {
    const heightInMeters = height / 100;
    bmi = weight / (heightInMeters * heightInMeters);

    if (bmi < 18.5) {
      category = t('underweight');
      color = '#3b82f6'; // Blue
      position = Math.min(Math.max((bmi / 18.5) * 25, 5), 25);
    } else if (bmi < 25) {
      category = t('normal');
      color = '#4B6F44'; // Green
      position = 25 + ((bmi - 18.5) / 6.5) * 25;
    } else if (bmi < 30) {
      category = t('overweight');
      color = '#f59e0b'; // Orange
      position = 50 + ((bmi - 25) / 5) * 25;
    } else {
      category = t('obese');
      color = '#ef4444'; // Red
      position = 75 + Math.min(((bmi - 30) / 10) * 25, 20);
    }
  }

  return (
    <section className="fitscan-bmi-card">
      <div className="fitscan-section-heading">
        <div>
          <span>{t('health_metrics')}</span>
          <strong>{t('body_mass_index')}</strong>
        </div>
        <Scale size={18} className="fitscan-bmi-icon" />
      </div>

      {!hasData ? (
        <div className="fitscan-bmi-empty">
          <Info size={20} />
          <p>{t('complete_profile_bmi')}</p>
          <button type="button" onClick={() => onNavigate('profile')}>
            {t('complete_profile')}
          </button>
        </div>
      ) : (
        <div className="fitscan-bmi-content">
          <div className="fitscan-bmi-main">
            <div className="fitscan-bmi-value" style={{ color }}>
              {bmi.toFixed(1)}
            </div>
            <div className="fitscan-bmi-label">
              <div className="fitscan-bmi-status-group">
                <span>{t('current_status')}</span>
                <strong style={{ color }}>{category}</strong>
              </div>
              <div className="fitscan-bmi-stats-pills">
                {age && <span className="fitscan-bmi-pill">{age}Y</span>}
                {gender && <span className="fitscan-bmi-pill">{gender}</span>}
                <span className="fitscan-bmi-pill">{weight}kg</span>
              </div>
            </div>
          </div>

          <div className="fitscan-bmi-scale-container">
            <div className="fitscan-bmi-scale-bar">
              <span className="segment-blue" />
              <span className="segment-green" />
              <span className="segment-orange" />
              <span className="segment-red" />
              <div
                className="fitscan-bmi-pointer"
                style={{ left: `${position}%`, backgroundColor: color }}
              />
            </div>
            <div className="fitscan-bmi-scale-labels">
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Dashboard({ userAuth, userProfile, authToken, onNavigate, onViewDetail, isDark, toggleTheme }) {
  const { t } = useTranslation();
  const quotaUsed = Number(userAuth?.scansUsed ?? userAuth?.scanCount ?? userAuth?.scans_used ?? 0);
  const quotaLimit = userAuth?.isPremium ? '∞' : Number(userAuth?.scanLimit ?? userAuth?.scan_limit ?? 20);
  const quotaPercent = userAuth?.isPremium ? 100 : Math.max(0, Math.min((quotaUsed / quotaLimit) * 100, 100));

  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthKey(new Date()));
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const handleScanClick = (scan) => {
    const parseJson = (val, fallback) => {
      if (!val) return fallback;
      if (typeof val !== 'string') return val;
      try { return JSON.parse(val); } catch { return fallback; }
    };

    onViewDetail?.({
      scanId: scan.id,
      servings: scan.servings || 1,
      productName: scan.product_name || 'Product',
      brand: scan.brand || 'Unknown Brand',
      score: scan.score,
      verdict: parseJson(scan.verdict, []),
      ingredientsAnalysis: parseJson(scan.ingredients, []),
      alternatives: parseJson(scan.alternatives, []),
      sideEffects: parseJson(scan.side_effects, []),
      image_url: scan.image_url,
      barcode: scan.product_data?.barcode || scan.product_data?.code || '',
      recorded_at: scan.created_at,
      nutriments: scan.nutriments,
      rawProductData: scan.raw_product_data || scan.product_data
    });
  };

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/scans`,
          { credentials: 'include' }
        );
        if (!response.ok) throw new Error('Failed to fetch scan history');
        const scans = await response.json();
        if (isMounted) {
          setHistory([...scans].sort((a, b) => {
            const bDate = parseScanDate(b)?.getTime() || 0;
            const aDate = parseScanDate(a)?.getTime() || 0;
            return bDate - aDate;
          }));
        }
      } catch (error) {
        console.error(error);
        if (isMounted) setHistory([]);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedDayScans = useMemo(() => {
    const selectedKey = toDateKey(selectedDate);
    return history.filter((scan) => {
      const scanDate = parseScanDate(scan);
      return scanDate && toDateKey(scanDate) === selectedKey;
    });
  }, [history, selectedDate]);

  const selectedMonthScans = useMemo(() => {
    return history.filter((scan) => {
      const scanDate = parseScanDate(scan);
      return scanDate && toMonthKey(scanDate) === selectedMonth;
    });
  }, [history, selectedMonth]);

  const handleMonthChange = (monthKey) => {
    if (!monthKey) return;
    const monthDate = monthKeyToDate(monthKey);
    setSelectedMonth(monthKey);
    setSelectedDate(monthDate);
    setWeekStart(startOfWeek(monthDate));
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setSelectedMonth(toMonthKey(date));
  };

  const handleShiftWeek = (direction) => {
    const nextWeekStart = addDays(weekStart, direction * 7);
    const nextSelectedDate = addDays(selectedDate, direction * 7);
    setWeekStart(nextWeekStart);
    setSelectedDate(nextSelectedDate);
    setSelectedMonth(toMonthKey(nextSelectedDate));
  };

  const selectedDayLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(selectedDate);
  const recentScans = selectedDayScans.slice(0, 3);
  const latestScanLabel = recentScans[0]
    ? `${recentScans[0].product_name || 'Product'} - ${recentScans[0].brand || 'Unknown brand'}`
    : `${selectedDayScans.length} scans on ${selectedDayLabel}`;
  const avgScore = selectedDayScans.length
    ? Math.round((selectedDayScans.reduce((sum, scan) => sum + Number(scan.score || 0), 0) / selectedDayScans.length) * 10) / 10
    : 0;

  const dailyNutrition = selectedDayScans.reduce((totals, scan) => {
    const nutrition = getServingNutrition(scan, scan.servings || 1);
    return {
      calories: totals.calories + (nutrition.calories || 0),
      protein: totals.protein + (nutrition.protein || 0),
      carbs: totals.carbs + (nutrition.carbs || 0),
    };
  }, { calories: 0, protein: 0, carbs: 0 });

  const macros = [
    { label: 'Calories', value: Math.round(dailyNutrition.calories), max: 2100, color: '#4B6F44' },
    { label: 'Protein', value: Math.round(dailyNutrition.protein), max: 140, color: '#2563eb' },
    { label: 'Carbs', value: Math.round(dailyNutrition.carbs), max: 260, color: '#f97316' },
  ];

  return (
    <div className="fitscan-home-page page-transition">
      <style>{`
        .fitscan-desktop-sidebar {
          display: none;
          flex-direction: column;
          width: 260px;
          background: #ffffff;
          border-right: 1.5px solid var(--ns-border-light);
          padding: 24px 18px;
          min-height: 100vh;
          position: sticky;
          top: 0;
          flex-shrink: 0;
        }
        
        .fitscan-logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 12px;
          margin-bottom: 32px;
        }
        
        .fitscan-logo-section span {
          font-family: var(--font-headline, 'Sora', sans-serif);
          font-weight: 800;
          font-size: 1.25rem;
          color: #0f172a;
          letter-spacing: -0.03em;
        }

        .fitscan-logo-section span em {
          color: #10b981;
          font-style: normal;
        }
        
        .fitscan-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          color: #475569;
          font-weight: 700;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        
        .nav-item:hover, .nav-item.active {
          background: #f0fdf4;
          color: #047857;
        }

        .nav-item svg {
          color: inherit;
        }

        .fitscan-main-dashboard {
          flex: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 100vh;
          position: relative;
        }

        .fitscan-dashboard-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        .fitscan-column {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        @media (min-width: 1024px) {
          .fitscan-desktop-sidebar {
            display: flex;
          }
          .fitscan-home-page {
            padding: 0 !important;
            background: #f8fafc !important;
            display: flex;
            flex-direction: row;
          }
          .fitscan-main-dashboard {
            padding: 32px;
          }
          .fitscan-dashboard-grid {
            display: grid;
            grid-template-columns: 1fr 1.1fr;
            gap: 32px;
            align-items: start;
            max-width: 1100px;
          }
        }
      `}</style>

      {/* Left Sidebar Panel - Desktop Only */}
      <aside className="fitscan-desktop-sidebar">
        <div className="fitscan-logo-section">
          <Apple size={22} className="text-emerald-500" />
          <span>Fit<em>Scan</em></span>
        </div>
        <nav className="fitscan-sidebar-nav">
          <button className="nav-item active" onClick={() => onNavigate('dashboard')}>
            <HomeIcon size={18} />
            <span>{t('home')}</span>
          </button>
          <button className="nav-item" onClick={() => onNavigate('compare')}>
            <BarChart2 size={18} />
            <span>{t('compare')}</span>
          </button>
          <button className="nav-item" onClick={() => onNavigate('trends')}>
            <Activity size={18} />
            <span>{t('health_progress')}</span>
          </button>
          <button className="nav-item" onClick={() => onNavigate('streak')}>
            <Flame size={18} />
            <span>{t('leaderboard')}</span>
          </button>
          <button className="nav-item" onClick={() => onNavigate('profile')}>
            <User size={18} />
            <span>{t('profile')}</span>
          </button>
        </nav>
        <div className="mt-auto">
          <BMICard userProfile={userProfile} onNavigate={onNavigate} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="fitscan-main-dashboard">
        {/* Top bar (Mobile only) */}
        <header className="fitscan-home-topbar lg:hidden">
          <button className="fitscan-logo-pill" type="button" onClick={() => onNavigate('dashboard')}>
            <Apple size={18} />
            <span>FitScan</span>
          </button>
          <div className="fitscan-top-actions">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <button
              className="fitscan-streak-pill"
              type="button"
              onClick={() => onNavigate('trends')}
              aria-label="View health trends and graphs"
              style={{
                background: 'var(--ns-surface-low)',
                border: '1.5px solid var(--ns-border-light)',
                borderRadius: '13px',
                width: '38px',
                height: '38px',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--ns-on-surface)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Activity size={17} />
            </button>
            <button
              className="fitscan-streak-pill"
              type="button"
              onClick={() => onNavigate('streak')}
            >
              <Flame size={16} />
              <span>{userAuth?.streak || 0}d</span>
            </button>
          </div>
        </header>

        {/* Mobile Scan Quota Card */}
        <div className="px-4 mt-4 mb-2 lg:hidden">
          <div 
            className="rounded-lg p-3.5 flex items-center justify-between gap-4 transition-all duration-300"
            style={{
              background: 'var(--ns-card-bg)',
              border: '1px solid var(--ns-border-light)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-md flex items-center justify-center text-emerald-600 dark:text-emerald-400"
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                }}
              >
                <Search size={16} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 mb-0.5">
                  {userAuth?.isPremium ? t('premium_plan', 'Premium Plan') : t('free_plan', 'Free Plan')}
                </div>
                <div className="text-sm font-black flex items-center gap-1.5" style={{ color: 'var(--ns-on-surface)' }}>
                  {userAuth?.isPremium ? (
                    <span>{t('unlimited_scans', 'Unlimited Scans')}</span>
                  ) : (
                    <>
                      <span>{quotaUsed}</span>
                      <span className="text-neutral-400 dark:text-neutral-500 font-bold">/</span>
                      <span className="text-neutral-400 dark:text-neutral-500 font-bold">{quotaLimit}</span>
                      <span className="text-xs font-semibold normal-case font-main" style={{ color: 'var(--ns-on-surface-var)' }}>scans used</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {!userAuth?.isPremium ? (
              <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                <div 
                  className="w-24 h-1.5 rounded-full overflow-hidden"
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                  }}
                >
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${quotaPercent}%`,
                      background: 'linear-gradient(90deg, #10b981, #34d399)',
                    }} 
                  />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--ns-on-surface-var)' }}>
                  {100 - Math.round(quotaPercent)}% {t('remaining', 'Remaining')}
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-black tracking-wider uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {t('premium_quota', 'Premium')}
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Responsive Columns Grid */}
        <div className="fitscan-dashboard-grid mt-4 lg:mt-0">
          {/* Column 1: Daily Summary & Week Selector */}
          <div className="fitscan-column">
            <WeekSelector
              selectedDate={selectedDate}
              selectedMonth={selectedMonth}
              selectedDayCount={selectedDayScans.length}
              selectedMonthCount={selectedMonthScans.length}
              weekStart={weekStart}
              onChangeMonth={handleMonthChange}
              onSelectDate={handleSelectDate}
              onShiftWeek={handleShiftWeek}
            />

            <section className="fitscan-score-card" aria-label="Daily nutrition summary">
              <ScoreDial score={avgScore} />
              <div className="fitscan-macro-panel">
                {macros.map((macro) => (
                  <MacroRow key={macro.label} {...macro} />
                ))}
              </div>
            </section>

            {/* Desktop Only BMI Widget display */}
            <div className="hidden lg:block">
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Health Profile</h3>
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-1">
                    {userProfile?.name || 'User'} ({userProfile?.dietType || 'No Specific Diet'})
                  </p>
                </div>
                <button 
                  onClick={() => onNavigate('profile')}
                  className="text-xs text-emerald-500 font-bold hover:underline"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Actions & Recent Scans */}
          <div className="fitscan-column">
            <div className="hidden lg:flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Quick Actions</h2>
              <div className="flex items-center gap-3">
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
                <button
                  className="fitscan-streak-pill"
                  type="button"
                  onClick={() => onNavigate('streak')}
                >
                  <Flame size={16} />
                  <span>{userAuth?.streak || 0}d</span>
                </button>
              </div>
            </div>

            <section className="fitscan-action-card" aria-label="Main actions">
              <button type="button" onClick={() => onNavigate('home')}>
                <span className="fitscan-action-icon is-scan">
                  <Camera size={24} />
                </span>
                <span>{t('scan_product')}</span>
              </button>
              <button type="button" onClick={() => onNavigate('foodDatabase')}>
                <span className="fitscan-action-icon is-food">
                  <Search size={24} />
                </span>
                <span>{t('food_database')}</span>
              </button>
            </section>

            <section className="fitscan-recent-card">
              <div className="fitscan-section-heading">
                <div>
                  <span>{t('recent_scans')}</span>
                  <strong>{latestScanLabel}</strong>
                </div>
                <button type="button" onClick={() => onNavigate('history')}>{t('view_all')}</button>
              </div>

              {isLoadingHistory ? (
                <div className="fitscan-empty-state">
                  <span className="spinner animate-spin" />
                  <span className="ml-2">{t('loading_scans')}</span>
                </div>
              ) : recentScans.length ? (
                <div className="fitscan-recent-list">
                  {recentScans.map((scan) => (
                    <button
                      key={scan.id}
                      type="button"
                      onClick={() => handleScanClick(scan)}
                      aria-label={`View details for ${scan.product_name}`}
                    >
                      {scan.image_url ? (
                        <span className="fitscan-food-thumb">
                          <img
                            src={scan.image_url}
                            alt={scan.product_name || 'Product'}
                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'grid'; }}
                          />
                          <span className="fitscan-food-mark" style={{ display: 'none' }}>
                            <Camera size={17} />
                          </span>
                        </span>
                      ) : (
                        <span className="fitscan-food-mark">
                          <Utensils size={17} />
                        </span>
                      )}
                      <span className="fitscan-recent-copy">
                        <strong>{scan.product_name || 'Product'}</strong>
                        <small>{scan.brand || 'Unknown brand'}</small>
                        <span className="fitscan-nutrient-row" aria-label="Key nutrition facts per serving">
                          {getRecentNutrientChips(scan, scan.servings || 1).map((nutrient) => (
                            <span className="fitscan-nutrient-chip" key={nutrient.label}>
                              <span aria-hidden="true">{nutrient.icon}</span>
                              <b>{nutrient.value}</b>
                            </span>
                          ))}
                        </span>
                      </span>
                      <div className="fitscan-recent-meta">
                        <em>{scan.score || '--'}</em>
                        <ChevronRight size={14} className="fitscan-recent-arrow" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="fitscan-empty-state">
                  <Camera size={18} />
                  <span>{t('no_scans')}</span>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Mobile bottom nav / profile display */}
        <div className="lg:hidden">
          <BMICard userProfile={userProfile} onNavigate={onNavigate} />
          <BottomNav onNavigate={onNavigate} />
        </div>
      </main>
    </div>
  );
}
