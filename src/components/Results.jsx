import { useRef, useState } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle, Info, XCircle, Share2, Leaf, TrendingUp } from 'lucide-react';
import { toPng } from 'html-to-image';

function HealthRingLarge({ score }) {
  const radius = 68;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score / 10, 0), 1);
  const dash = circ * pct;
  const color = score >= 8 ? '#10B981' : score >= 6 ? '#22c55e' : score >= 4 ? '#fd761a' : '#ba1a1a';

  return (
    <div className="health-score-ring result-score-ring" aria-label={`Average score ${score} out of 10`}>
      <svg width="168" height="168" viewBox="0 0 168 168">
        <circle cx="84" cy="84" r={radius} fill="none" stroke="var(--ns-surface-high)" strokeWidth="14" />
        <circle
          cx="84"
          cy="84"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 8px ${color}55)` }}
        />
      </svg>
      <div className="result-score-copy">
        <span>{score}</span>
        <em>/10</em>
        <strong style={{ color }}>Health Score</strong>
      </div>
    </div>
  );
}

export default function Results({ result, onBack }) {
  const summaryRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeTab, setActiveTab] = useState('truth');

  if (!result) return null;

  const getVerdict = (score) => {
    if (score >= 8) return { status: 'SAFE TO CONSUME', sub: 'A genuinely healthy choice', icon: CheckCircle, color: '#006c49', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)' };
    if (score >= 6) return { status: 'MOSTLY SAFE', sub: 'Decent, with minor concerns', icon: CheckCircle, color: '#16a34a', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)' };
    if (score >= 4) return { status: 'USE CAUTION', sub: 'Consume in moderation only', icon: AlertTriangle, color: '#b45309', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)' };
    if (score >= 2) return { status: 'HIGH RISK', sub: 'Significant health concerns', icon: AlertTriangle, color: '#9d4300', bg: 'rgba(253,118,26,0.08)', border: 'rgba(253,118,26,0.3)' };
    return { status: 'AVOID', sub: 'Serious health risk detected', icon: XCircle, color: '#ba1a1a', bg: 'rgba(186,26,26,0.06)', border: 'rgba(186,26,26,0.25)' };
  };

  const verdict = getVerdict(result.score);

  const handleShare = async () => {
    if (!summaryRef.current) return;
    setIsCapturing(true);
    try {
      await new Promise(r => setTimeout(r, 300));
      const dataUrl = await toPng(summaryRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
      const filename = `nutriscan_${result.productName.toLowerCase().replace(/[\s\W]+/g, '_')}.png`;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'NutriScan Health Audit', text: `Results for ${result.productName}` });
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert('Result card downloaded!');
      }
    } catch (err) {
      console.error(err);
      alert('Sharing failed. Try a screenshot.');
    } finally {
      setIsCapturing(false);
    }
  };

  const parseVerdict = (items) => {
    if (typeof items === 'string') {
      const t = items.trim();
      if (t.startsWith('[') || t.startsWith('{')) {
        try {
          return JSON.parse(t.replace(/^\{/, '[').replace(/\}$/, ']'));
        } catch {
          return t
            .replace(/^\{/, '')
            .replace(/^\[/, '')
            .replace(/\}$/, '')
            .replace(/\]$/, '')
            .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
            .map(s => s.trim().replace(/^"/, '').replace(/"$/, ''));
        }
      }
    }
    return items;
  };

  const verdictItems = parseVerdict(activeTab === 'truth' ? result.verdict : (result.sideEffects || []));

  return (
    <div className="result-page animate-fade-in-up">
      <header className="result-header">
        <button onClick={onBack} className="result-back-button" aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h1>Nutrition Analysis</h1>
        <div className="result-header-spacer" />
      </header>

      <main className="result-content">
        <div ref={summaryRef} id="summary-card" className="result-summary-card ns-card">
          <div className="result-product-copy">
            <p>{result.brand || 'Unknown Brand'}</p>
            <h2>{result.productName}</h2>
          </div>

          <HealthRingLarge score={result.score} />

          <div className="result-verdict-banner" style={{ background: verdict.bg, border: `1.5px solid ${verdict.border}` }}>
            <div>
              <verdict.icon size={20} style={{ color: verdict.color }} strokeWidth={2.5} />
              <span style={{ color: verdict.color }}>{verdict.status}</span>
            </div>
            <p>{verdict.sub}</p>
          </div>

          <div className="result-ai-label">
            <Leaf size={13} />
            <span>Scanned with NutriScan AI</span>
          </div>
        </div>

        <button onClick={handleShare} disabled={isCapturing} className="result-primary-button btn-primary" style={{ opacity: isCapturing ? 0.6 : 1 }}>
          {isCapturing ? (
            <><span className="result-button-spinner" /> Generating...</>
          ) : (
            <><Share2 size={18} /> Share Result</>
          )}
        </button>

        <div className="result-tabs">
          <button
            onClick={() => setActiveTab('truth')}
            className={activeTab === 'truth' ? 'is-active' : ''}
            style={{ color: activeTab === 'truth' ? 'var(--ns-primary)' : 'var(--ns-outline)' }}
          >
            The Full Truth
          </button>
          <button
            onClick={() => setActiveTab('effects')}
            className={activeTab === 'effects' ? 'is-active is-danger' : ''}
            style={{ color: activeTab === 'effects' ? 'var(--ns-error)' : 'var(--ns-outline)' }}
          >
            Side Effects
          </button>
        </div>

        <div className="result-facts-card ns-card">
          {activeTab === 'effects' && (!verdictItems || verdictItems.length === 0) ? (
            <div className="result-empty-facts">
              <CheckCircle size={24} style={{ color: 'var(--ns-primary)' }} />
              <p>No significant side effects detected based on your profile.</p>
            </div>
          ) : Array.isArray(verdictItems) ? verdictItems.map((point, idx) => {
            const isEffects = activeTab === 'effects';
            const isGood = !isEffects && point.toLowerCase().startsWith('good:');
            const isBad = !isEffects && point.toLowerCase().startsWith('bad:');
            const label = isGood ? point.replace(/^good:\s*/i, '') : isBad ? point.replace(/^bad:\s*/i, '') : point;
            const dotColor = isEffects ? '#ba1a1a' : isGood ? '#10B981' : isBad ? '#ba1a1a' : 'var(--ns-outline)';
            const bg = isEffects ? 'rgba(186,26,26,0.06)' : isGood ? 'rgba(16,185,129,0.07)' : isBad ? 'rgba(186,26,26,0.06)' : 'var(--ns-surface-low)';

            return (
              <div key={idx} className="result-fact-item" style={{ background: bg }}>
                {isEffects ? <AlertTriangle size={16} style={{ color: dotColor }} />
                  : isGood ? <CheckCircle size={16} style={{ color: dotColor }} />
                    : isBad ? <XCircle size={16} style={{ color: dotColor }} />
                      : <div className="result-dot" style={{ background: dotColor }} />}
                <span>{label}</span>
              </div>
            );
          }) : (
            <div className="result-fact-item">
              <div className="result-dot" style={{ background: 'var(--ns-outline)' }} />
              <p>{result.verdict || ''}</p>
            </div>
          )}
        </div>

        {result.ingredientsAnalysis && result.ingredientsAnalysis.length > 0 && (
          <section className="result-section">
            <div className="result-section-heading">
              <Info size={16} />
              <h3>Ingredient Audit</h3>
            </div>
            <div className="result-section-list">
              {result.ingredientsAnalysis
                .sort((a, b) => ({ beneficial: 0, harmful: 1, neutral: 2 }[a.impact?.toLowerCase() ?? ''] ?? 3) - ({ beneficial: 0, harmful: 1, neutral: 2 }[b.impact?.toLowerCase() ?? ''] ?? 3))
                .map((item, idx) => {
                  const isHarmful = item.impact?.toLowerCase() === 'harmful';
                  const isBeneficial = item.impact?.toLowerCase() === 'beneficial';
                  const accent = isHarmful ? '#ba1a1a' : isBeneficial ? '#006c49' : '#6c7a71';
                  const bg = isHarmful ? 'rgba(186,26,26,0.06)' : isBeneficial ? 'rgba(16,185,129,0.06)' : 'rgba(108,122,113,0.06)';
                  const Icon = isHarmful ? AlertTriangle : isBeneficial ? CheckCircle : Info;

                  return (
                    <div key={idx} className="result-audit-card ns-card">
                      <div className="result-accent-bar" style={{ background: accent }} />
                      <div className="result-audit-body">
                        <div className="result-audit-title-row">
                          <span>{item.name}</span>
                          <div className="result-status-badge" style={{ background: bg, border: `1px solid ${accent}33` }}>
                            <Icon size={13} style={{ color: accent }} strokeWidth={2.5} />
                            <span style={{ color: accent }}>{item.impact}</span>
                          </div>
                        </div>
                        <p>{item.reason}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {result.alternatives && result.alternatives.length > 0 && (
          <section className="result-section">
            <div className="result-section-heading is-alternative">
              <TrendingUp size={16} />
              <h3>Healthier Alternatives</h3>
            </div>
            <div className="result-section-list">
              {result.alternatives.map((alt, idx) => (
                <div key={idx} className="result-audit-card ns-card">
                  <div className="result-accent-bar is-alternative" />
                  <div className="result-audit-body">
                    <p className="result-alt-name">{alt.name}</p>
                    <p>{alt.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <button onClick={onBack} className="result-primary-button result-bottom-button btn-primary">
          Scan Another Product
        </button>
      </main>
    </div>
  );
}
