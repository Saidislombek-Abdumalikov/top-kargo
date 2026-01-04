import { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import TabHome from './components/TabHome';
import TabCalculator from './components/TabCalculator';
import TabProfile from './components/TabProfile';
import TabMyParcels from './components/TabMyParcels';
import TabSupport from './components/TabSupport';
import Registration from './components/Registration';
import AdminDashboard from './components/AdminDashboard';
import AddTrackModal from './components/AddTrackModal';
import { Tab } from './types';
import { getUserProfile, logoutUser, syncGlobalSettings } from './services/storageService';
import { getSupabase } from './supabaseClient';

// --- SUPABASE CONFIGURATION ---
// We use the shared client from supabaseClient.ts
const supabase = getSupabase();
// ------------------------------

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Used to track session duration
  const sessionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    // 1. Check for Admin URL (e.g. website.com/#admin)
    if (window.location.hash === '#admin') {
      setIsAdminMode(true);
    }

    // 2. Initialize Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      try {
        tg.enableClosingConfirmation();
      } catch (e) {
        console.log('Closing confirmation not supported');
      }
    }

    // 3. Check Local Registration
    const profile = getUserProfile();
    if (profile && profile.clientId && profile.phone) {
      setIsRegistered(true);
    }
    
    syncGlobalSettings();

    // 4. --- START SUPABASE TRACKING ---
    const initTracking = async () => {
      if (!supabase) return;

      const tg = (window as any).Telegram?.WebApp;
      if (!tg) return;

      const user = tg.initDataUnsafe?.user;
      if (!user) return; // Only track if we have a valid Telegram user

      // A. Real-time Presence (Shows "Online Now" on your Admin Dashboard)
      const channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: user.id.toString(),
          },
        },
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

      // B. Log to Database (Users & Activity Logs)
      try {
        // Upsert User (Update last_active if exists, Create if new)
        await supabase.from('users').upsert({
          telegram_id: user.id,
          first_name: user.first_name,
          username: user.username,
          last_active: new Date().toISOString()
        });

        // Log the login event
        await supabase.from('activity_logs').insert({
          telegram_id: user.id,
          event_type: 'login',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Tracking error:", error);
      }
    };

    initTracking();
    // ----------------------------------

    // 5. Handle Session End (Optional: Log when they close the app)
    const handleUnload = () => {
       const tg = (window as any).Telegram?.WebApp;
       const user = tg?.initDataUnsafe?.user;
       if(user && supabase) {
         const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
         supabase.from('activity_logs').insert({
            telegram_id: user.id,
            event_type: 'session_end',
            session_duration: duration,
            timestamp: new Date().toISOString()
         }).then(() => {});
       }
    };
    window.addEventListener("unload", handleUnload);
    return () => window.removeEventListener("unload", handleUnload);

  }, []);

  const handleLogout = () => {
      logoutUser();
      setIsRegistered(false);
      setActiveTab(Tab.HOME);
  };

  const handleTrackAdded = () => {
      setRefreshKey(prev => prev + 1);
      setActiveTab(Tab.MY_PARCELS);
  };

  if (isAdminMode) {
      return <AdminDashboard onLogout={() => {
        setIsAdminMode(false);
        // Clean URL hash
        if (window.location.hash === '#admin') {
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }
      }} />;
  }

  if (!isRegistered) {
    return (
      <Registration 
        onRegister={() => setIsRegistered(true)} 
        onAdminLogin={() => {
          setIsAdminMode(true);
        }} 
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case Tab.HOME: return <TabHome onNavigate={setActiveTab} />;
      case Tab.MY_PARCELS: return <TabMyParcels refreshTrigger={refreshKey} />;
      case Tab.CALCULATOR: return <TabCalculator />;
      case Tab.SUPPORT: return <TabSupport />;
      case Tab.PROFILE: return <TabProfile onLogout={handleLogout} />;
      default: return <TabHome onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen pb-safe-bottom">
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/20 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <main className="relative z-10 max-w-md mx-auto min-h-screen px-5 pt-6 pb-24 safe-area-top h-full">
        {renderContent()}
      </main>

      {isAddModalOpen && (
          <AddTrackModal 
            onClose={() => setIsAddModalOpen(false)} 
            onAdded={handleTrackAdded}
          />
      )}

      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAddClick={() => setIsAddModalOpen(true)}
      />
    </div>
  );
}

export default App;
