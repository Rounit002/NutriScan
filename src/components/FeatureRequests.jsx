import { useState, useEffect } from 'react';
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageSquarePlus, Clock, User } from 'lucide-react';

export default function FeatureRequests({ userAuth, authToken, onBack }) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/features', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch features');
      const data = await response.json();
      setFeatures(data);
    } catch (err) {
      console.error(err);
      setError('Could not load feature requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (featureId, currentVote, type) => {
    // If clicking the same vote type, we might want to remove the vote.
    const newVote = currentVote === type ? 'none' : type;
    
    // Optimistic update
    setFeatures(currents => currents.map(f => {
      if (f.id === featureId) {
        const updated = { ...f, voters: { ...f.voters, [userAuth.id]: newVote } };
        // Recalculate upvotes/downvotes
        let upvotes = 0;
        let downvotes = 0;
        for (const uid in updated.voters) {
          if (updated.voters[uid] === 'up') upvotes++;
          if (updated.voters[uid] === 'down') downvotes++;
        }
        return { ...updated, upvotes, downvotes };
      }
      return f;
    }));

    try {
      await fetch(`http://localhost:5000/features/${featureId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ vote: newVote })
      });
    } catch (err) {
      console.error('Failed to vote:', err);
      // Rollback on failure could be implemented here
      fetchFeatures(); 
    }
  };

  const handleSubmitNew = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription
        })
      });
      
      if (!response.ok) throw new Error('Failed to create feature');
      
      setNewTitle('');
      setNewDescription('');
      setShowNewForm(false);
      fetchFeatures(); // Reload list
    } catch (err) {
      console.error('Error submitting feature:', err);
      setError('Could not submit feature request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Utility to format date relatively
  const timeAgo = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - d) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="profile-page">
      <section className="profile-phone-shell" aria-label="Feature Requests">
        <header className="profile-topbar">
          <button type="button" onClick={onBack} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <h1>Feature Requests</h1>
          <span />
        </header>

        {showNewForm ? (
          <section className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
            <div className="bg-[var(--ns-surface)] p-6 rounded-[24px] shadow-sm flex flex-col gap-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--ns-text-high)' }}>Suggest a Feature</h2>
              <form onSubmit={handleSubmitNew} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--ns-text-medium)' }}>Title</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Add dark mode"
                    required
                    className="w-full bg-[var(--ns-bg)] border border-[var(--ns-outline-dim)] rounded-xl px-4 py-3 text-[var(--ns-text-high)] focus:outline-none focus:border-[var(--ns-primary)] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--ns-text-medium)' }}>Description</label>
                  <textarea 
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Explain what the feature does and why it would be useful..."
                    required
                    rows={4}
                    className="w-full bg-[var(--ns-bg)] border border-[var(--ns-outline-dim)] rounded-xl px-4 py-3 text-[var(--ns-text-high)] focus:outline-none focus:border-[var(--ns-primary)] transition-colors resize-none"
                  />
                </div>
                <div className="flex gap-3 mt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowNewForm(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-[var(--ns-surface-high)] text-[var(--ns-text-medium)] hover:bg-[var(--ns-outline-dim)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting || !newTitle.trim() || !newDescription.trim()}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white transition-opacity disabled:opacity-50"
                    style={{ background: 'var(--ns-primary)' }}
                  >
                    {submitting ? 'Submitting...' : 'Post Request'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        ) : (
          <>
            <div className="p-4 pb-0 flex justify-between items-center">
              <p className="text-sm font-medium" style={{ color: 'var(--ns-text-medium)' }}>
                Vote on ideas or suggest your own
              </p>
              <button 
                onClick={() => setShowNewForm(true)}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--ns-primary)] text-white rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
              >
                <MessageSquarePlus size={16} />
                <span>New</span>
              </button>
            </div>

            <section className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 rounded-full border-[3px] border-[var(--ns-surface-high)] border-t-[var(--ns-primary)] animate-spin"></div>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl text-center text-sm font-bold">
                  {error}
                </div>
              ) : features.length === 0 ? (
                <div className="text-center p-8 flex flex-col items-center gap-3 text-[var(--ns-text-medium)]">
                  <MessageSquarePlus size={48} opacity={0.3} />
                  <p>No feature requests yet.<br/>Be the first to suggest one!</p>
                </div>
              ) : (
                features.map(feature => {
                  const myVote = feature.voters && userAuth ? feature.voters[userAuth.id] : null;
                  
                  return (
                    <div key={feature.id} className="bg-[var(--ns-surface)] p-5 rounded-[24px] shadow-sm flex gap-4">
                      {/* Voting Column */}
                      <div className="flex flex-col items-center gap-2">
                        <button 
                          onClick={() => handleVote(feature.id, myVote, 'up')}
                          className={`p-2 rounded-full transition-colors ${myVote === 'up' ? 'bg-[var(--ns-primary)] text-white' : 'bg-[var(--ns-bg)] text-[var(--ns-text-medium)] hover:bg-[var(--ns-surface-high)]'}`}
                          aria-label="Upvote"
                        >
                          <ThumbsUp size={18} className={myVote === 'up' ? 'fill-current' : ''} />
                        </button>
                        <span className="font-black text-lg w-8 text-center" style={{ color: 'var(--ns-text-high)' }}>
                          {feature.upvotes - feature.downvotes}
                        </span>
                        <button 
                          onClick={() => handleVote(feature.id, myVote, 'down')}
                          className={`p-2 rounded-full transition-colors ${myVote === 'down' ? 'bg-red-500 text-white' : 'bg-[var(--ns-bg)] text-[var(--ns-text-medium)] hover:bg-[var(--ns-surface-high)]'}`}
                          aria-label="Downvote"
                        >
                          <ThumbsDown size={18} className={myVote === 'down' ? 'fill-current' : ''} />
                        </button>
                      </div>
                      
                      {/* Content Column */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <h3 className="font-bold text-lg mb-1 truncate" style={{ color: 'var(--ns-text-high)' }}>
                          {feature.title}
                        </h3>
                        <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--ns-text-medium)' }}>
                          {feature.description}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-auto pt-3 border-t border-[var(--ns-outline-dim)] text-xs font-medium" style={{ color: 'var(--ns-text-medium)' }}>
                          <div className="flex items-center gap-1.5">
                            <User size={14} />
                            <span className="truncate max-w-[100px]">{feature.author_name || 'Anonymous'}</span>
                          </div>
                          <div className="w-1 h-1 rounded-full bg-[var(--ns-outline)]"></div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>{timeAgo(feature.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </>
        )}
      </section>
    </div>
  );
}
