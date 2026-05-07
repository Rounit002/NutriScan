import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Check,
  Crown,
  Edit3,
  Globe2,
  HeartPulse,
  Languages,
  LifeBuoy,
  LogOut,
  Mail,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';

export const healthIssues = [
  'Acid Reflux / GERD',
  'Acne',
  'ADHD',
  'Allergic Rhinitis',
  'Anemia',
  'Anxiety',
  'Arthritis',
  'Asthma',
  'Autoimmune Disease',
  'Back Pain',
  'Bipolar Disorder',
  'Celiac Disease',
  'Chronic Bronchitis',
  'Chronic Kidney Disease',
  'Chronic Liver Disease',
  'Chronic Migraine',
  'Chronic Obstructive Pulmonary Disease (COPD)',
  'Chronic Pain',
  'Constipation',
  'Coronary Artery Disease',
  'Depression',
  'Diabetes',
  'Diabetes Type 1',
  'Diabetes Type 2',
  'Eczema',
  'Endometriosis',
  'Epilepsy',
  'Fatty Liver Disease',
  'Fibromyalgia',
  'Food Allergy',
  'Gallstones',
  'Gastritis',
  'Gestational Diabetes',
  'Gluten Sensitivity',
  'Gout',
  "Graves' Disease",
  'Hashimoto Thyroiditis',
  'Heart Disease',
  'High Blood Pressure',
  'High Cholesterol',
  'Hormonal Imbalance',
  'Hyperthyroidism',
  'Hypothyroidism',
  'IBS / Irritable Bowel Syndrome',
  'Insomnia',
  'Insulin Resistance',
  'Iron Deficiency',
  'Kidney Stones',
  'Lactose Intolerance',
  'Low Blood Pressure',
  'Metabolic Syndrome',
  'Migraine',
  'Obesity',
  'Osteoarthritis',
  'Osteoporosis',
  'PCOD',
  'PCOS',
  'Peptic Ulcer',
  'Prediabetes',
  'Psoriasis',
  'Rheumatoid Arthritis',
  'Sinusitis',
  'Sleep Apnea',
  'Stroke History',
  'Thyroid Disorder',
  'Ulcerative Colitis',
  'Vitamin B12 Deficiency',
  'Vitamin D Deficiency',
];

export const healthGoalsList = [
  'Lose Weight',
  'Maintain Weight',
  'Gain Healthy Weight',
  'Build Muscle',
  'Improve Strength',
  'Improve Endurance',
  'Increase Daily Steps',
  'Improve Heart Health',
  'Lower Blood Pressure',
  'Improve Cholesterol',
  'Manage Blood Sugar',
  'Improve Insulin Sensitivity',
  'Improve Digestion',
  'Reduce Bloating',
  'Improve Gut Health',
  'Eat More Protein',
  'Eat More Fiber',
  'Eat More Fruits and Vegetables',
  'Reduce Added Sugar',
  'Reduce Sodium',
  'Drink More Water',
  'Improve Sleep',
  'Reduce Stress',
  'Boost Energy',
  'Improve Mental Wellbeing',
  'Support Hormonal Balance',
  'Improve Skin Health',
  'Improve Immunity',
  'Recover After Workout',
  'Improve Bone Health',
  'Pregnancy Nutrition',
  'Postpartum Recovery',
  'Healthy Aging',
  'General Fitness',
  'Balanced Nutrition',
];

export const severityLevels = ['Low', 'Medium', 'High'];

export const normalizeCondition = (condition) => {
  if (typeof condition === 'string') {
    return { name: condition, severity: 'Medium' };
  }

  return {
    name: condition?.name || '',
    severity: severityLevels.includes(condition?.severity) ? condition.severity : 'Medium',
  };
};

function ProfileSection({ title, children }) {
  return (
    <section className="profile-menu-section">
      <h2>{title}</h2>
      <div className="profile-menu-group">{children}</div>
    </section>
  );
}

function ProfileAction({ label, icon: Icon, onClick, danger = false }) {
  return (
    <button
      className={`profile-menu-action${danger ? ' is-danger' : ''}`}
      type="button"
      onClick={onClick}
    >
      {Icon && <Icon size={17} />}
      <span>{label}</span>
      <ChevronRight size={16} />
    </button>
  );
}

function ProfileModal({ title, children, onClose }) {
  return (
    <div className="profile-modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="profile-modal-card">
        <div className="profile-modal-title">
          <strong>{title}</strong>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const personalFields = [
  { key: 'name', label: 'Name', type: 'text', source: 'user' },
  { key: 'height', label: 'Height', type: 'number', suffix: 'cm' },
  { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
  { key: 'weight', label: 'Weight', type: 'number', suffix: 'kg' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
];

function formatPersonalValue(field, value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (field.key === 'dateOfBirth') {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('en-GB').format(parsed);
  }
  return field.suffix ? `${value} ${field.suffix}` : value;
}

export function PersonalDetailsPage({
  userProfile,
  userAuth,
  authToken,
  onBack,
  onDetailsSaved,
  onNext,
  isOnboarding = false,
}) {
  const [details, setDetails] = useState(() => ({
    name: userAuth?.name || '',
    height: userProfile?.height || '',
    dateOfBirth: userProfile?.dateOfBirth || userProfile?.dob || '',
    weight: userProfile?.weight || '',
    gender: userProfile?.gender || '',
  }));
  const [editingKey, setEditingKey] = useState(null);
  const [draftValue, setDraftValue] = useState('');
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState('');

  const startEditing = (field) => {
    setError('');
    setEditingKey(field.key);
    setDraftValue(details[field.key] || '');
  };

  const cancelEditing = () => {
    setError('');
    setEditingKey(null);
    setDraftValue('');
  };

  const saveField = async (field) => {
    const nextDetails = { ...details, [field.key]: draftValue };
    const profilePatch = {};
    if (field.source !== 'user') {
      profilePatch[field.key] = draftValue;
    }

    setSavingKey(field.key);
    setError('');

    try {
      if (!authToken) throw new Error('Missing auth token');
      const response = await fetch('http://localhost:5000/auth/details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: field.key === 'name' ? draftValue : undefined,
          profile: profilePatch,
        }),
      });

      if (!response.ok) throw new Error('Save failed');
      const data = await response.json();
      setDetails(nextDetails);
      onDetailsSaved?.(data.user);
      cancelEditing();
    } catch (saveError) {
      console.error(saveError);
      setError('Could not save this detail. Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleKeyDown = (event, field) => {
    if (event.key === 'Enter') saveField(field);
    if (event.key === 'Escape') cancelEditing();
  };

  return (
    <div className="personal-details-page">
      <section className="personal-details-shell" aria-label="Personal details">
        <header className="personal-details-header">
          <button type="button" onClick={onBack} aria-label="Back to profile">
            <ArrowLeft size={20} />
          </button>
          <h1>Personal Details</h1>
          <span />
        </header>

        <section className="personal-details-card">
          {personalFields.map((field) => {
            const isEditing = editingKey === field.key;
            const value = details[field.key];

            return (
              <div className="personal-detail-row" key={field.key}>
                <label>{field.label}</label>
                <div className="personal-detail-control">
                  {isEditing ? (
                    <>
                      {field.type === 'select' ? (
                        <select
                          value={draftValue}
                          onChange={(event) => setDraftValue(event.target.value)}
                          autoFocus
                        >
                          <option value="">N/A</option>
                          {field.options.map((option) => (
                            <option value={option} key={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={draftValue}
                          onChange={(event) => setDraftValue(event.target.value)}
                          onKeyDown={(event) => handleKeyDown(event, field)}
                          autoFocus
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => saveField(field)}
                        disabled={savingKey === field.key}
                        aria-label={`Save ${field.label}`}
                      >
                        <Check size={15} />
                      </button>
                      <button type="button" onClick={cancelEditing} aria-label={`Cancel ${field.label}`}>
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <strong>{formatPersonalValue(field, value)}</strong>
                      <button type="button" onClick={() => startEditing(field)} aria-label={`Edit ${field.label}`}>
                        <Edit3 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {error && <p className="personal-details-error">{error}</p>}
      </section>
    </div>
  );
}

export function MedicalProfilePage({
  userProfile,
  authToken,
  onBack,
  onDetailsSaved,
  onNext,
  isOnboarding = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIssues, setSelectedIssues] = useState(() => (
    (userProfile?.conditions || [])
      .map(normalizeCondition)
      .filter((condition) => condition.name)
  ));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const selectedIssueNames = useMemo(() => selectedIssues.map((issue) => issue.name), [selectedIssues]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleIssues = useMemo(() => {
    return healthIssues
      .filter((issue) => issue.toLowerCase().includes(normalizedSearch))
      .sort((a, b) => {
        const aSelected = selectedIssueNames.includes(a);
        const bSelected = selectedIssueNames.includes(b);
        if (aSelected !== bSelected) return aSelected ? -1 : 1;

        if (normalizedSearch) {
          const aStarts = a.toLowerCase().startsWith(normalizedSearch);
          const bStarts = b.toLowerCase().startsWith(normalizedSearch);
          if (aStarts !== bStarts) return aStarts ? -1 : 1;
        }

        return a.localeCompare(b);
      });
  }, [normalizedSearch, selectedIssueNames]);

  const toggleIssue = (issue) => {
    setError('');
    setSelectedIssues((current) => (
      current.some((item) => item.name === issue)
        ? current.filter((item) => item.name !== issue)
        : [...current, { name: issue, severity: 'Medium' }]
    ));
  };

  const setIssueSeverity = (issue, severity) => {
    setError('');
    setSelectedIssues((current) => current.map((item) => (
      item.name === issue ? { ...item, severity } : item
    )));
  };

  const saveMedicalProfile = async () => {
    setIsSaving(true);
    setError('');

    try {
      if (!authToken) throw new Error('Missing auth token');
      const response = await fetch('http://localhost:5000/auth/details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          profile: { conditions: selectedIssues },
        }),
      });

      if (!response.ok) throw new Error('Save failed');
      const data = await response.json();
      onDetailsSaved?.(data.user);
      if (!isOnboarding) onBack();
    } catch (saveError) {
      console.error(saveError);
      setError('Could not save your medical profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="medical-profile-page">
      <section className="medical-profile-shell" aria-label="Medical profile">
        <header className="medical-profile-header">
          <button type="button" onClick={onBack} aria-label="Back to profile">
            <ArrowLeft size={20} />
          </button>
          <h1>Medical Profile</h1>
          <span />
        </header>

        <div className="medical-search-box">
          <Search size={18} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search"
            aria-label="Search health issues"
          />
        </div>

        {selectedIssues.length > 0 && (
          <section className="medical-summary-card" aria-label="Selected health issues">
            <div className="medical-summary-title">
              <span>Selected Conditions</span>
              <strong>{selectedIssues.length}</strong>
            </div>
            <div className="medical-selected-strip">
              {selectedIssues.map((issue) => (
                <button key={issue.name} type="button" onClick={() => toggleIssue(issue.name)}>
                  {issue.name}
                  <span>{issue.severity}</span>
                  <X size={13} />
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="medical-issue-list" aria-label="Health issue options">
          {visibleIssues.length ? visibleIssues.map((issue) => {
            const selectedIssue = selectedIssues.find((item) => item.name === issue);
            const isSelected = Boolean(selectedIssue);
            return (
              <div
                key={issue}
                className={`medical-issue-item${isSelected ? ' is-selected' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => toggleIssue(issue)}
                  aria-pressed={isSelected}
                >
                  <span>{issue}</span>
                  <strong>{isSelected ? 'Selected' : 'Select'}</strong>
                </button>

                {isSelected && (
                  <div className="medical-severity-control" aria-label={`${issue} severity`}>
                    {severityLevels.map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={selectedIssue.severity === level ? 'is-active' : ''}
                        onClick={() => setIssueSeverity(issue, level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="medical-empty-result">No matching health issue found.</div>
          )}
        </div>

        {error && <p className="medical-profile-error">{error}</p>}

        <button
          className="medical-save-button"
          type="button"
          onClick={saveMedicalProfile}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : isOnboarding ? 'Next Step' : `Save ${selectedIssues.length} Selected`}
        </button>
      </section>
    </div>
  );
}

export function HealthGoalsPage({
  userProfile,
  authToken,
  onBack,
  onDetailsSaved,
  onNext,
  isOnboarding = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGoals, setSelectedGoals] = useState(() => userProfile?.goals || []);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleGoals = useMemo(() => {
    return healthGoalsList
      .filter((goal) => goal.toLowerCase().includes(normalizedSearch))
      .sort((a, b) => {
        const aSelected = selectedGoals.includes(a);
        const bSelected = selectedGoals.includes(b);
        if (aSelected !== bSelected) return aSelected ? -1 : 1;

        if (normalizedSearch) {
          const aStarts = a.toLowerCase().startsWith(normalizedSearch);
          const bStarts = b.toLowerCase().startsWith(normalizedSearch);
          if (aStarts !== bStarts) return aStarts ? -1 : 1;
        }

        return a.localeCompare(b);
      });
  }, [normalizedSearch, selectedGoals]);

  const toggleGoal = (goal) => {
    setError('');
    setSelectedGoals((current) => (
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : [...current, goal]
    ));
  };

  const saveHealthGoals = async () => {
    setIsSaving(true);
    setError('');

    try {
      if (!authToken) throw new Error('Missing auth token');
      const response = await fetch('http://localhost:5000/auth/details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          profile: { goals: selectedGoals },
        }),
      });

      if (!response.ok) throw new Error('Save failed');
      const data = await response.json();
      onDetailsSaved?.(data.user);
      if (!isOnboarding) onBack();
    } catch (saveError) {
      console.error(saveError);
      setError('Could not save your health goals. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="health-goals-page">
      <section className="health-goals-shell" aria-label="Health goals">
        <header className="health-goals-header">
          <button type="button" onClick={onBack} aria-label="Back to profile">
            <ArrowLeft size={20} />
          </button>
          <h1>Health Goals</h1>
          <span />
        </header>

        <div className="health-goals-search-box">
          <Search size={18} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search"
            aria-label="Search health goals"
          />
        </div>

        {selectedGoals.length > 0 && (
          <section className="health-goals-summary-card" aria-label="Selected health goals">
            <div className="health-goals-summary-title">
              <span>Selected Goals</span>
              <strong>{selectedGoals.length}</strong>
            </div>
            <div className="health-goals-selected-strip">
              {selectedGoals.map((goal) => (
                <button key={goal} type="button" onClick={() => toggleGoal(goal)}>
                  {goal}
                  <X size={13} />
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="health-goals-list" aria-label="Health goal options">
          {visibleGoals.length ? visibleGoals.map((goal) => {
            const isSelected = selectedGoals.includes(goal);
            return (
              <button
                key={goal}
                className={isSelected ? 'is-selected' : ''}
                type="button"
                onClick={() => toggleGoal(goal)}
                aria-pressed={isSelected}
              >
                <span>{goal}</span>
                <strong>{isSelected ? 'Selected' : 'Select'}</strong>
              </button>
            );
          }) : (
            <div className="health-goals-empty-result">No matching health goal found.</div>
          )}
        </div>

        {error && <p className="health-goals-error">{error}</p>}

        <button
          className="health-goals-save-button"
          type="button"
          onClick={saveHealthGoals}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : isOnboarding ? 'Finish Setup' : `Save ${selectedGoals.length} Selected`}
        </button>
      </section>
    </div>
  );
}

export default function Profile({ userProfile, userAuth, authToken, onBack, onDelete, onLogout, onDetailsSaved, onNavigateFeatures, isDark, toggleTheme }) {
  const [modal, setModal] = useState(null);
  const [view, setView] = useState('menu');
  const [language, setLanguage] = useState(() => localStorage.getItem('fitscan_language') || 'English');

  const ageLabel = userProfile?.age ? `${userProfile.age}` : 'Age';
  const displayName = userAuth?.name || userProfile?.name || 'Name';
  const initials = useMemo(() => {
    return displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'FS';
  }, [displayName]);

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);
    localStorage.setItem('fitscan_language', nextLanguage);
  };

  const handleDelete = () => {
    if (window.confirm('Delete your profile data? This will reset your health profile.')) {
      onDelete();
    }
  };

  const mailSupport = () => {
    window.location.href = 'mailto:support@fitscan.app?subject=FitScan%20Support';
  };

  if (view === 'personal') {
    return (
      <PersonalDetailsPage
        userProfile={userProfile}
        userAuth={userAuth}
        authToken={authToken}
        onBack={() => setView('menu')}
        onDetailsSaved={onDetailsSaved}
      />
    );
  }

  if (view === 'medical') {
    return (
      <MedicalProfilePage
        userProfile={userProfile}
        authToken={authToken}
        onBack={() => setView('menu')}
        onDetailsSaved={onDetailsSaved}
      />
    );
  }

  if (view === 'goals') {
    return (
      <HealthGoalsPage
        userProfile={userProfile}
        authToken={authToken}
        onBack={() => setView('menu')}
        onDetailsSaved={onDetailsSaved}
      />
    );
  }

  return (
    <div className="profile-page">
      <section className="profile-phone-shell" aria-label="Profile">
        <header className="profile-topbar">
          <button type="button" onClick={onBack} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <h1>Profile</h1>
          <span />
        </header>

        <section className="profile-hero">
          <div className="profile-avatar" aria-label="Profile image">
            <span>{initials}</span>
          </div>
          <div className="profile-name-row">
            <strong>{displayName}</strong>
            <span>{ageLabel}</span>
          </div>
          <button className="profile-upgrade-button" type="button" onClick={() => setModal('upgrade')}>
            <Crown size={17} />
            <span>Upgrade</span>
          </button>
        </section>

        <ProfileSection title="Account">
          <ProfileAction label="Personal Detail" icon={User} onClick={() => setView('personal')} />
          <ProfileAction label={`Language: ${language}`} icon={Languages} onClick={() => setModal('language')} />
          <div className="profile-theme-toggle" onClick={toggleTheme} role="button" tabIndex={0} aria-label="Toggle dark mode">
            <Moon size={17} />
            <span>Dark Mode</span>
            <span className={`profile-theme-switch${isDark ? ' is-active' : ''}`} aria-hidden="true" />
          </div>
        </ProfileSection>

        <ProfileSection title="Goals & Tracking">
          <ProfileAction label="Edit Medical Profile" icon={HeartPulse} onClick={() => setView('medical')} />
          <ProfileAction label="Edit Health Goal" icon={Sparkles} onClick={() => setView('goals')} />
          <ProfileAction label="Upgrade to Family Plan" icon={Crown} onClick={() => setModal('family')} />
        </ProfileSection>

        <ProfileSection title="Support & Legal">
          <ProfileAction label="Request a Feature" icon={Globe2} onClick={onNavigateFeatures} />
          <ProfileAction label="Support Email" icon={Mail} onClick={mailSupport} />
          <ProfileAction label="Terms & Condition" icon={ShieldCheck} onClick={() => setModal('terms')} />
          <ProfileAction label="Privacy Policy" icon={LifeBuoy} onClick={() => setModal('privacy')} />
        </ProfileSection>

        <ProfileSection title="Account Action">
          <ProfileAction label="Logout" icon={LogOut} onClick={onLogout} />
          <ProfileAction label="Delete Account" icon={Trash2} onClick={handleDelete} danger />
        </ProfileSection>
      </section>

      {modal === 'upgrade' && (
        <ProfileModal title="Upgrade" onClose={() => setModal(null)}>
          <p>Unlock deeper insights, unlimited scan history, family tracking, and priority recommendations.</p>
          <button className="profile-modal-primary" type="button" onClick={() => setModal('family')}>View Family Plan</button>
        </ProfileModal>
      )}

      {modal === 'family' && (
        <ProfileModal title="Family Plan" onClose={() => setModal(null)}>
          <p>Add family members, compare health goals, and track everyone from one FitScan profile.</p>
          <button className="profile-modal-primary" type="button" onClick={() => setModal(null)}>Coming Soon</button>
        </ProfileModal>
      )}

      {modal === 'language' && (
        <ProfileModal title="Language" onClose={() => setModal(null)}>
          <div className="profile-language-list">
            {['English', 'Hindi', 'Spanish'].map((option) => (
              <button
                key={option}
                className={language === option ? 'is-selected' : ''}
                type="button"
                onClick={() => handleLanguageChange(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </ProfileModal>
      )}


      {modal === 'terms' && (
        <ProfileModal title="Terms & Condition" onClose={() => setModal(null)}>
          <p>FitScan provides nutrition insights to help your choices. It is not a substitute for professional medical advice.</p>
        </ProfileModal>
      )}

      {modal === 'privacy' && (
        <ProfileModal title="Privacy Policy" onClose={() => setModal(null)}>
          <p>Your profile and scan history are used to personalize recommendations and are protected by your account login.</p>
        </ProfileModal>
      )}
    </div>
  );
}
