import { useEffect, useMemo, useState } from 'react';
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
  LogOut,
  Search,
  Scale,
  Info,
  User,
  Utensils,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

function ScoreDial({ score }) {
  const normalized = Math.max(0, Math.min(score, 10));
  const circumference = 2 * Math.PI * 42;
  const dash = (normalized / 10) * circumference;
  const color = normalized >= 8 ? '#10b981' : normalized >= 5 ? '#f59e0b' : '#ef4444';

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
  return (
    <nav className="fitscan-home-nav" aria-label="Primary navigation">
      <button className="is-active" type="button" aria-label="Home">
        <HomeIcon size={18} />
        <span>Home</span>
      </button>
      <button type="button" onClick={() => onNavigate('home')} aria-label="Scan product">
        <Camera size={18} />
        <span>Scan</span>
      </button>
      <button type="button" onClick={() => onNavigate('compare')} aria-label="Comparison">
        <BarChart2 size={18} />
        <span>Compare</span>
      </button>
      <button type="button" onClick={() => onNavigate('profile')} aria-label="Profile">
        <User size={18} />
        <span>Profile</span>
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
      <div className="fitscan-week-toolbar">
        <button type="button" onClick={() => onShiftWeek(-1)} aria-label="Previous week">
          <ChevronLeft size={18} />
        </button>
        <label>
          <CalendarDays size={15} aria-hidden="true" />
          <span>Month {selectedMonthName}</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => onChangeMonth(event.target.value)}
            aria-label="Select month"
          />
        </label>
        <button type="button" onClick={() => onShiftWeek(1)} aria-label="Next week">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="fitscan-week-meta">
        <strong>{selectedMonthName}</strong>
        <span>{selectedMonthCount} scans this month</span>
      </div>

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
      category = 'Underweight';
      color = '#3b82f6'; // Blue
      position = Math.min(Math.max((bmi / 18.5) * 25, 5), 25);
    } else if (bmi < 25) {
      category = 'Normal';
      color = '#10b981'; // Green
      position = 25 + ((bmi - 18.5) / 6.5) * 25;
    } else if (bmi < 30) {
      category = 'Overweight';
      color = '#f59e0b'; // Orange
      position = 50 + ((bmi - 25) / 5) * 25;
    } else {
      category = 'Obese';
      color = '#ef4444'; // Red
      position = 75 + Math.min(((bmi - 30) / 10) * 25, 20);
    }
  }

  return (
    <section className="fitscan-bmi-card">
      <div className="fitscan-section-heading">
        <div>
          <span>Health Metrics</span>
          <strong>Body Mass Index</strong>
        </div>
        <Scale size={18} className="fitscan-bmi-icon" />
      </div>

      {!hasData ? (
        <div className="fitscan-bmi-empty">
          <Info size={20} />
          <p>Complete your profile with height and weight to see your BMI.</p>
          <button type="button" onClick={() => onNavigate('profile')}>
            Complete Profile
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
                <span>Current Status</span>
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

export default function Dashboard({ userAuth, userProfile, authToken, onNavigate, onLogout, isDark, toggleTheme }) {
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthKey(new Date()));
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      if (!authToken) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/scans', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
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
  }, [authToken]);

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

  const macros = [
    { label: 'Calories', value: Math.min(selectedDayScans.length * 260, 2100), max: 2100, color: '#10b981' },
    { label: 'Protein', value: Math.min(selectedDayScans.length * 17, 140), max: 140, color: '#2563eb' },
    { label: 'Carbs', value: Math.min(selectedDayScans.length * 31, 260), max: 260, color: '#f97316' },
  ];

  return (
    <div className="fitscan-home-page">
      <section className="fitscan-phone-shell" aria-label="FitScan home dashboard">
        <header className="fitscan-home-topbar">
          <button className="fitscan-logo-pill" type="button" onClick={() => onNavigate('dashboard')}>
            <Apple size={18} />
            <span>FitScan</span>
          </button>
          <div className="fitscan-top-actions">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <button
              className="fitscan-streak-pill"
              type="button"
              onClick={() => onNavigate('streak')}
              aria-label={`${userAuth?.streak || 0} day streak. Open streak leaderboard.`}
            >
              <Flame size={16} />
              <span>{userAuth?.streak || 0}d</span>
            </button>
            <button className="fitscan-icon-button" type="button" onClick={onLogout} aria-label="Log out">
              <LogOut size={16} />
            </button>
          </div>
        </header>

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

        <section className="fitscan-action-card" aria-label="Main actions">
          <button type="button" onClick={() => onNavigate('home')}>
            <span className="fitscan-action-icon is-scan">
              <Camera size={24} />
            </span>
            <span>Scan Product</span>
          </button>
          <button type="button" onClick={() => onNavigate('foodDatabase')}>
            <span className="fitscan-action-icon is-food">
              <Search size={24} />
            </span>
            <span>Food Database</span>
          </button>
        </section>

        <section className="fitscan-recent-card">
          <div className="fitscan-section-heading">
            <div>
              <span>Recent Scans</span>
              <strong>{latestScanLabel}</strong>
            </div>
            <button type="button" onClick={() => onNavigate('history')}>View all</button>
          </div>

          {isLoadingHistory ? (
            <div className="fitscan-empty-state">
              <Activity size={18} />
              <span>Loading scans...</span>
            </div>
          ) : recentScans.length ? (
            <div className="fitscan-recent-list">
              {recentScans.map((scan) => (
                <button key={scan.id} type="button" onClick={() => onNavigate('history')}>
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
                  <span>
                    <strong>{scan.product_name || 'Product'}</strong>
                    <small>{scan.brand || 'Unknown brand'}</small>
                  </span>
                  <em>{scan.score || '--'}</em>
                </button>
              ))}
            </div>
          ) : (
            <div className="fitscan-empty-state">
              <Camera size={18} />
              <span>No scans yet. Start with your first product.</span>
            </div>
          )}
        </section>
        
        <BMICard userProfile={userProfile} onNavigate={onNavigate} />

        <BottomNav onNavigate={onNavigate} />
      </section>
    </div>
  );
}
