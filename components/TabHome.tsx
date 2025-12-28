
import React, { useState, useEffect } from 'react';
import { Tab } from '../types';
import { getUserProfile, getAppSettings, getUserTracks, findParcel, fetchArrivedReys, isReysArrived } from '../services/storageService';

interface TabHomeProps {
  onNavigate: (tab: Tab) => void;
}

const TabHome: React.FC<TabHomeProps> = ({ onNavigate }) => {
  const [infoModal, setInfoModal] = useState<'AVTO' | 'AVIA' | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  
  // Dashboard State
  const [activeStats, setActiveStats] = useState({ arrived: 0, transit: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const user = getUserProfile();
  const settings = getAppSettings();
  const clientId = user?.clientId || '0000';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Mijoz';

  useEffect(() => {
    if (infoModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    }
  }, [infoModal]);

  // Load basic stats for dashboard
  useEffect(() => {
      const loadDashboard = async () => {
          setLoadingStats(true);
          const tracks = getUserTracks();
          if (tracks.length === 0) {
              setLoadingStats(false);
              return;
          }

          let arrivedCount = 0;
          let transitCount = 0;
          const arrivedData = await fetchArrivedReys();

          // Quick check of statuses
          await Promise.all(tracks.map(async (t) => {
              const p = await findParcel(t.id);
              if (p) {
                  // Check if arrived based on Reys list OR history
                  if (
                      p.history[0].status.includes('Toshkentga yetib keldi') ||
                      (p.boxCode && isReysArrived(p.boxCode, arrivedData))
                  ) {
                      arrivedCount++;
                  } else {
                      transitCount++;
                  }
              }
          }));

          setActiveStats({ arrived: arrivedCount, transit: transitCount });
          setLoadingStats(false);
      };
      loadDashboard();
  }, []);

  const closeModal = () => {
      setIsClosing(true);
      setTimeout(() => {
          setInfoModal(null);
          setIsClosing(false);
      }, 300);
  };

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      
      {/* Header Section */}
      <div className="flex justify-between items-center px-1">
        <div>
          <p className="text-text-secondary text-sm font-medium">Xush kelibsiz,</p>
          <h1 className="text-3xl font-black text-text tracking-tight">{firstName} 👋</h1>
        </div>
        <button 
          onClick={() => onNavigate(Tab.PROFILE)}
          className="w-12 h-12 bg-white rounded-full shadow-soft flex items-center justify-center text-primary font-bold text-lg border border-gray-100 active:scale-95 transition-transform"
        >
          {firstName.charAt(0)}
        </button>
      </div>

      {/* Address Card (Static ID Display) */}
      <div 
        className="w-full relative overflow-hidden bg-gradient-to-br from-[#48006b] to-[#280e35] rounded-[32px] p-8 text-white shadow-lg shadow-purple-900/30 group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/20 rounded-full -ml-8 -mb-8 blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                <span className="font-bold text-lg">T</span>
              </div>
              <span className="font-medium tracking-wide text-white/90">T TOP ID</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-2">Mening ID Raqamim</p>
            <p className="text-4xl font-mono font-black tracking-widest text-shadow-sm">{clientId.replace(/^(TT|TOP|JEK|JK)/, '')}</p>
          </div>
        </div>
      </div>

      {/* Live Status Widget */}
      <div>
        <h3 className="text-text font-black text-lg mb-4 px-1">Yuklar Holati</h3>
        <div 
            onClick={() => onNavigate(Tab.MY_PARCELS)}
            className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
        >
            <div className="flex gap-6">
                <div className="flex flex-col">
                    <span className="text-3xl font-black text-green-500">
                        {loadingStats ? '-' : activeStats.arrived}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Kelgan</span>
                </div>
                <div className="w-px bg-gray-100"></div>
                <div className="flex flex-col">
                    <span className="text-3xl font-black text-primary">
                        {loadingStats ? '-' : activeStats.transit}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Yo'lda</span>
                </div>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4">
          <a 
            href="https://t.me/topcargo_uz"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-start gap-4 active:scale-95 transition-all hover:bg-gray-50 hover:shadow-md"
          >
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <div className="text-left">
              <p className="font-bold text-text text-base">Admin</p>
              <p className="text-xs text-text-secondary font-medium">Yordam so'rash</p>
            </div>
          </a>

          <div 
             onClick={() => onNavigate(Tab.CALCULATOR)}
             className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-start gap-4 active:scale-95 transition-all hover:bg-gray-50 hover:shadow-md cursor-pointer"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <div className="text-left">
              <p className="font-bold text-text text-base">Hisoblash</p>
              <p className="text-xs text-text-secondary font-medium">Narx kalkulyatori</p>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setInfoModal('AVIA')}
          className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-4 active:scale-95 transition-transform"
        >
           <div className="w-1.5 h-10 bg-primary rounded-full"></div>
           <div className="text-left">
              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wide">Avia Muddat</p>
              <p className="text-xl font-black text-text">3-5 Kun</p>
           </div>
        </button>
        <button 
          onClick={() => setInfoModal('AVTO')}
          className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-4 active:scale-95 transition-transform"
        >
           <div className="w-1.5 h-10 bg-green-500 rounded-full"></div>
           <div className="text-left">
              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wide">Avto Muddat</p>
              <p className="text-xl font-black text-text">14-18 Kun</p>
           </div>
        </button>
      </div>

      {/* Info Modal */}
      {infoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={closeModal}></div>
              <div className={`bg-white w-full max-sm rounded-[32px] p-8 shadow-2xl z-10 relative overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-90 opacity-0' : 'scale-100 opacity-100 animate-slide-up'}`}>
                  <button 
                    onClick={closeModal}
                    className="absolute top-4 right-4 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>

                  <div className="text-center mb-8">
                      <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-5 shadow-sm ${infoModal === 'AVIA' ? 'bg-purple-50 text-primary' : 'bg-green-50 text-green-500'}`}>
                          {infoModal === 'AVIA' ? '✈️' : '🚛'}
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">{infoModal === 'AVIA' ? 'AVIA Xizmati' : 'AVTO Xizmati'}</h3>
                      <p className="text-sm text-gray-500 mt-1">Yetkazib berish shartlari va narxlar</p>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">Muddat</p>
                              <p className="text-xs text-gray-400 italic mt-0.5">{infoModal === 'AVIA' ? 'Ombordan' : 'Yo\'lga chiqqandan'}</p>
                          </div>
                          <p className="text-xl font-black text-gray-900">{infoModal === 'AVIA' ? '3-5 kun' : '14-18 kun'}</p>
                      </div>

                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-3">Tariflar (1 kg uchun)</p>
                          <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold text-gray-600">Standart</span>
                                  <span className="text-lg font-black text-primary">
                                      ${infoModal === 'AVIA' ? settings.prices.avia.standard : settings.prices.avto.standard}
                                  </span>
                              </div>
                              <div className="w-full h-px bg-gray-200"></div>
                              <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold text-gray-600">Katta hajm (Bulk)</span>
                                  <span className="text-lg font-black text-orange-500">
                                      ${infoModal === 'AVIA' ? settings.prices.avia.bulk : settings.prices.avto.bulk}
                                  </span>
                              </div>
                          </div>
                      </div>
                  </div>

                  <button 
                    onClick={closeModal}
                    className="w-full mt-8 py-4 bg-primary-dark text-white rounded-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-gray-200"
                  >
                    Tushunarli
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};

export default TabHome;
