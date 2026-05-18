import { useState, useEffect } from 'react';
import Home from './components/Home';
import Results from './components/Results';
import Profile from './components/Profile';
import History from './components/History';
import Compare from './components/Compare';
import LoadingState from './components/LoadingState';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import BarcodeScanner from './components/BarcodeScanner';
import StreakLeaderboard from './components/StreakLeaderboard';
import FeatureRequests from './components/FeatureRequests';
import FoodDatabase from './components/FoodDatabase';
import Trends from './components/Trends';
import { analyzeFoodImage, analyzeFoodText } from './geminiService';
import { useTheme } from './components/ThemeToggle';

export default function App() {
  const { isDark, toggle: toggleTheme } = useTheme();
  // If a token exists, start in 'restoring' state instead of 'login' to avoid flash
  const hasToken = Boolean(localStorage.getItem('nutriscan_token'));
  const [currentView, setCurrentView] = useState(hasToken ? 'restoring' : 'login');
  const [userAuth, setUserAuth] = useState(null);
  const [authToken, setToken] = useState(() => {
    const saved = localStorage.getItem('nutriscan_token');
    return saved && saved !== "undefined" ? saved : null;
  });
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('nutriscan_profile');
      return saved && saved !== "undefined" ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [pendingSignUp, setPendingSignUp] = useState(null);
  useEffect(() => {
    if (authToken && !userAuth) {
      fetchUserData();
    } else if (!authToken && currentView !== 'signup') {
      setCurrentView('login');
    }
  }, [authToken]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:5000/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserAuth(data.user);
        setUserProfile(data.user.profile);
        localStorage.setItem('nutriscan_profile', JSON.stringify(data.user.profile));
        setCurrentView(data.user.profile ? 'dashboard' : 'onboarding');
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      handleLogout();
    }
  };

  const handleLogin = (user, token, deletionCancelled = false) => {
    setUserAuth(user);
    setToken(token);
    setUserProfile(user.profile);
    localStorage.setItem('nutriscan_token', token);
    localStorage.setItem('nutriscan_profile', JSON.stringify(user.profile));
    setCurrentView(user.profile ? 'dashboard' : 'onboarding');

    if (deletionCancelled) {
      setTimeout(() => {
        alert("Welcome back! Your account deletion request has been cancelled, and your data is safe.");
      }, 500);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserAuth(null);
    setUserProfile(null);
    setPendingSignUp(null);
    localStorage.removeItem('nutriscan_token');
    localStorage.removeItem('nutriscan_profile');
    setCurrentView('login');
  };

  const handleSignUpPending = (data) => {
    setPendingSignUp(data);
    setCurrentView('onboarding');
  };

  const handleOnboardingComplete = async (profile) => {
    setUserProfile(profile);
    localStorage.setItem('nutriscan_profile', JSON.stringify(profile));

    if (authToken) {
      try {
        await fetch('http://localhost:5000/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ profile })
        });
      } catch (err) {
        console.error('Failed to save profile to server:', err);
      }
    }
    setCurrentView('dashboard');
  };

  const refreshStreak = async () => {
    if (!authToken) return;
    try {
      const response = await fetch('http://localhost:5000/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserAuth(data.user);
      }
    } catch (err) {
      console.error('Failed to refresh streak:', err);
    }
  };

  const handleResetProfile = () => {
    setUserProfile(null);
    localStorage.removeItem('nutriscan_profile');
    setCurrentView('onboarding');
  };

  const handleUserDetailsUpdated = (updatedUser) => {
    if (!updatedUser) return;
    setUserAuth(updatedUser);
    setUserProfile(updatedUser.profile);
    localStorage.setItem('nutriscan_profile', JSON.stringify(updatedUser.profile));
  };

  const handleImageSelected = async (imageBase64) => {
    setCurrentView('loading');
    setError(null);
    try {
      const result = await analyzeFoodImage(imageBase64, userProfile, authToken);
      setAnalysisResult(result);
      setCurrentView('results');

      if (authToken) {
        // Send the full imageBase64 for Cloudinary storage
        const saveResponse = await fetch('http://localhost:5000/scans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            productName: result.productName,
            brand: result.brand,
            score: result.score,
            verdict: JSON.stringify(result.verdict),
            explanation: '',
            ingredients: JSON.stringify(result.ingredientsAnalysis),
            alternatives: result.alternatives,
            sideEffects: result.sideEffects,
            imageUrl: imageBase64, // Use full image for Cloudinary
            productData: {
              product_name: result.productName,
              brands: result.brand,
              ingredients_text: result.ingredientsAnalysis?.map((item) => item.name).join(', ') || '',
              serving_size: result.nutrition?.serving_size || result.nutriments?.serving_size || null,
              serving_quantity: result.nutrition?.serving_quantity || result.nutriments?.serving_quantity || null,
              nutriments: result.nutriments || result.nutrition || null
            }
          })
        });
        if (saveResponse.ok) {
          const savedScan = await saveResponse.json();
          setAnalysisResult(prev => prev ? { ...prev, scanId: savedScan.id, servings: savedScan.servings || 1 } : prev);
        }
        refreshStreak();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Analysis failed. Gemini might be busy. Try again!");
      setCurrentView('home');
    }
  };

  const handleBarcodeScanned = async (barcode) => {
    setCurrentView('loading');
    setError(null);
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1) {
        // Use the product image from Open Food Facts if available
        const productImageUrl = data.product?.image_front_small_url
          || data.product?.image_front_url
          || data.product?.image_url
          || null;

        const result = await analyzeFoodText(data.product, userProfile);
        const enrichedResult = {
          ...result,
          nutriments: result.nutriments || result.nutrition || data.product?.nutriments || null,
          nutrition: result.nutrition || result.nutriments || data.product?.nutriments || null,
          rawProductData: data.product,
        };
        setAnalysisResult(enrichedResult);
        setCurrentView('results');

        if (authToken) {
          const saveResponse = await fetch('http://localhost:5000/scans', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              productName: enrichedResult.productName,
              brand: enrichedResult.brand,
              score: enrichedResult.score,
              verdict: JSON.stringify(enrichedResult.verdict),
              explanation: '',
              ingredients: JSON.stringify(enrichedResult.ingredientsAnalysis),
              alternatives: enrichedResult.alternatives,
              sideEffects: enrichedResult.sideEffects,
              imageUrl: productImageUrl,
              productData: data.product
            })
          });
          if (saveResponse.ok) {
            const savedScan = await saveResponse.json();
            setAnalysisResult(prev => prev ? { ...prev, scanId: savedScan.id, servings: savedScan.servings || 1 } : prev);
          }
          refreshStreak();
        }
      } else {
        throw new Error("Product not found.");
      }
    } catch (err) {
      console.error(err);
      const msg = err.message?.includes('Rate limited') || err.message?.includes('wait')
        ? err.message
        : "Product scan failed. Try a photo instead!";
      setError(msg);
      setCurrentView('home');
    }
  };

  const handleDatabaseProductSelected = async (product) => {
    setCurrentView('loading');
    setError(null);
    try {
      // Use the product image from Open Food Facts raw data if available
      const productImageUrl = product?.image_front_small_url
        || product?.image_front_url
        || product?.image_url
        || null;

      const productData = product.rawProductData || product;
      const result = await analyzeFoodText(productData, userProfile);
      const enrichedResult = {
        ...result,
        nutriments: result.nutriments || result.nutrition || productData?.nutriments || null,
        nutrition: result.nutrition || result.nutriments || productData?.nutriments || null,
        rawProductData: productData,
      };
      setAnalysisResult(enrichedResult);
      setCurrentView('results');

      if (authToken) {
        const saveResponse = await fetch('http://localhost:5000/scans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            productName: enrichedResult.productName,
            brand: enrichedResult.brand,
            score: enrichedResult.score,
            verdict: JSON.stringify(enrichedResult.verdict),
            explanation: '',
            ingredients: JSON.stringify(enrichedResult.ingredientsAnalysis),
            alternatives: enrichedResult.alternatives,
            sideEffects: enrichedResult.sideEffects,
            imageUrl: productImageUrl,
            productData
          })
        });
        if (saveResponse.ok) {
          const savedScan = await saveResponse.json();
          setAnalysisResult(prev => prev ? { ...prev, scanId: savedScan.id, servings: savedScan.servings || 1 } : prev);
        }
        refreshStreak();
      }
    } catch (err) {
      console.error(err);
      const msg = err.message?.includes('Rate limited') || err.message?.includes('wait')
        ? err.message
        : "Product analysis failed. Try another product!";
      setError(msg);
      setCurrentView('foodDatabase');
    }
  };

  const handleBackToHome = () => {
    setAnalysisResult(null);
    setCurrentView('dashboard');
  };

  return (
    <main id="root" className="animate-fade-in-up">
      {error && (
        <div className="fixed top-6 left-6 right-6 z-[200] animate-streak-pop">
          <div className="bg-error/90 backdrop-blur-xl text-white p-4 rounded-2xl text-xs font-black uppercase tracking-widest flex justify-between items-center shadow-2xl">
            <span>{error}</span>
            <button className="bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Splash screen while restoring session */}
      {currentView === 'restoring' && (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 animate-fade-in-up"
          style={{ background: 'var(--ns-surface)' }}>
          <div className="w-20 h-20 rounded-[24px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#006c49,#10B981)', boxShadow: '0 12px 40px rgba(0,108,73,0.3)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="white"><path d="M17 8C8 10 5.9 16.17 3.82 19.17C5 21 7 21 8 21C8 21 10 18 12 16C16 15 19 13 20 9L17 8Z" /><path d="M8.5 11.5C10.5 8.5 15 6 19 7C19 7 19 11 16 13C13 15 10 15 8 17C8 17 6.5 13.5 8.5 11.5Z" opacity="0.6" /></svg>
          </div>
          <div className="w-8 h-8 rounded-full animate-spin"
            style={{ border: '3px solid var(--ns-surface-high)', borderTopColor: 'var(--ns-primary)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--ns-outline)', fontFamily: 'var(--font-main)' }}>Loading NutriScan...</p>
        </div>
      )}

      {currentView === 'login' && <Login onLogin={handleLogin} onNavigateSignup={() => setCurrentView('signup')} />}
      {currentView === 'signup' && <SignUp onLogin={handleLogin} onNavigateLogin={() => setCurrentView('login')} onSignUpPending={handleSignUpPending} />}

      {currentView === 'onboarding' && (
        <Onboarding
          onComplete={handleOnboardingComplete}
          initialProfile={userProfile}
          authToken={authToken}
          pendingSignUp={pendingSignUp}
          onLogin={handleLogin}
          onBack={() => {
            if (pendingSignUp) {
              setPendingSignUp(null);
              setCurrentView('signup');
            } else if (userProfile) {
              setCurrentView('profile');
            } else {
              handleLogout();
            }
          }}
        />
      )}

      {currentView === 'dashboard' && (
        <Dashboard
          userAuth={userAuth}
          userProfile={userProfile}
          authToken={authToken}
          onNavigate={(view) => setCurrentView(view)}
          onViewDetail={(result) => {
            setAnalysisResult(result);
            setCurrentView('results');
          }}
          isDark={isDark}
          toggleTheme={toggleTheme}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'streak' && (
        <StreakLeaderboard
          userAuth={userAuth}
          authToken={authToken}
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {currentView === 'trends' && (
        <Trends
          authToken={authToken}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}

      {currentView === 'profile' && (
        <Profile
          userProfile={userProfile}
          userAuth={userAuth}
          authToken={authToken}
          onBack={() => setCurrentView('dashboard')}
          onDelete={handleLogout}
          onLogout={handleLogout}
          onDetailsSaved={handleUserDetailsUpdated}
          onNavigateFeatures={() => setCurrentView('features')}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
      )}

      {currentView === 'features' && (
        <FeatureRequests
          userAuth={userAuth}
          authToken={authToken}
          onBack={() => setCurrentView('profile')}
        />
      )}

      {currentView === 'history' && (
        <History
          authToken={authToken}
          onBack={() => setCurrentView('dashboard')}
          onViewDetail={(result) => {
            setAnalysisResult(result);
            setCurrentView('results');
          }}
        />
      )}

      {currentView === 'compare' && (
        <Compare
          authToken={authToken}
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {currentView === 'foodDatabase' && (
        <FoodDatabase
          authToken={authToken}
          onBack={() => setCurrentView('dashboard')}
          onSelectProduct={handleDatabaseProductSelected}
        />
      )}

      {currentView === 'home' && (
        <Home
          onImageSelected={handleImageSelected}
          onNavigateProfile={() => setCurrentView('profile')}
          onBack={() => setCurrentView('dashboard')}
          onNavigateBarcode={() => setCurrentView('barcode')}
        />
      )}

      {currentView === 'barcode' && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onBack={() => setCurrentView('home')}
        />
      )}

      {currentView === 'loading' && <LoadingState />}

      {currentView === 'results' && analysisResult && (
        <Results
          result={analysisResult}
          onBack={handleBackToHome}
          authToken={authToken}
          onServingsChanged={(scanId, newServings) => {
            setAnalysisResult(prev => prev ? { ...prev, servings: newServings } : prev);
          }}
        />
      )}
    </main>
  );
}
