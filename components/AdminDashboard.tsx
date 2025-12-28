
import React, { useState, useEffect } from 'react';
import { 
    getAppSettings, 
    saveAppSettings,
    fetchAllClientsFromSheet 
} from '../services/storageService';
import { AppSettings, ClientActivity } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'STATS' | 'CLIENTS' | 'SETTINGS'>('STATS');
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());
  const [clients, setClients] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeTab === 'CLIENTS' || activeTab === 'STATS') {
      loadClients();
    }
  }, [activeTab]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await fetchAllClientsFromSheet();
      setClients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = () => {
    saveAppSettings(settings);
    alert('Sozlamalar saqlandi!');
  };

  // Filter for valid users.
  const verifiedClients = clients.filter(c => 
    c.clientId && 
    (c.clientId.startsWith('TT') || c.clientId.startsWith('TOP') || c.clientId.startsWith('JEK') || c.clientId.startsWith('JK')) &&
    c.phone && 
    c.phone.replace(/\D/g, '').length >= 9
  );

  const filteredClients = verifiedClients.filter(c => 
    c.clientId.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5FA] flex flex-col animate-fade-in">
      {/* GLOBAL CSS TO REMOVE NUMBER INPUT SPINNERS */}
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-primary-dark tracking-tight uppercase italic">Admin Panel</h1>
            <p className="text-xs text-gray-500 font-bold uppercase mt-1">T TOP CARGO Management</p>
          </div>
          <button 
            onClick={onLogout}
            className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {(['STATS', 'CLIENTS', 'SETTINGS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
            >
              {tab === 'STATS' ? 'STATISTIKA' : tab === 'CLIENTS' ? 'MIJOZLAR' : 'SOZLAMALAR'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-5 pb-24 max-w-lg mx-auto w-full">
        {activeTab === 'STATS' && (
          <div className="space-y-4 animate-slide-up">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-[28px] shadow-soft border border-gray-100">
                <p className="text-[10px] text-gray-400 font-black uppercase mb-1 text-center">Tasdiqlangan Foydalanuvchilar</p>
                <h4 className="text-4xl font-black text-primary text-center">{verifiedClients.length}</h4>
                <p className="text-[9px] text-gray-400 mt-2 text-center leading-tight">Mavjud (Valid) hisoblar soni</p>
              </div>
              <div className="bg-white p-5 rounded-[28px] shadow-soft border border-gray-100">
                <p className="text-[10px] text-gray-400 font-black uppercase mb-1 text-center">Dollar Kursi</p>
                <h4 className="text-2xl font-black text-green-600 text-center">{settings.exchangeRate.toLocaleString()}</h4>
                <p className="text-[10px] text-gray-400 mt-1 text-center font-bold uppercase">UZS</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-soft border border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest">Tizim Ma'lumoti</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-500 font-medium">Jami Ro'yxatdagilar</span>
                  <span className="text-xs font-bold text-gray-800">{clients.length} ta</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-500 font-medium">Baza bilan aloqa</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-lg text-[10px] font-bold">FAOL</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'CLIENTS' && (
          <div className="space-y-4 animate-slide-up">
            <div className="bg-white p-4 rounded-[28px] shadow-soft border border-gray-100 flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="ID yoki Ism bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm font-medium"
              />
            </div>

            <div className="bg-white rounded-[32px] shadow-soft border border-gray-100 overflow-hidden">
              <div className="max-h-[65vh] overflow-y-auto no-scrollbar">
                {loading ? (
                  <div className="p-10 text-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div><p className="text-xs text-gray-400 mt-4 font-bold uppercase">Mijozlar o'qilmoqda...</p></div>
                ) : filteredClients.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 italic text-sm">Mijozlar topilmadi</div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">MIJOZ ID</th>
                        <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">HOLATI</th>
                        <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">MA'LUMOT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredClients.map((client) => (
                        <tr key={client.clientId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4 align-top">
                             <p className="font-mono font-bold text-primary text-xs">{client.clientId}</p>
                             <p className="text-[9px] text-gray-400 font-medium mt-0.5">{client.phone}</p>
                          </td>
                          <td className="px-5 py-4 align-top">
                             <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[9px] font-bold border border-green-100 whitespace-nowrap uppercase">Tasdiqlangan</span>
                          </td>
                          <td className="px-5 py-4 align-top">
                             <p className="font-bold text-gray-800 text-xs truncate max-w-[120px]">{client.name}</p>
                             <p className="text-[9px] text-gray-400 font-medium mt-0.5 italic">Mijoz Bazada Bor</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <p className="text-center text-[10px] text-gray-400 font-bold uppercase px-6">
                Faqat tasdiqlangan (valid) hisoblar ko'rsatilmoqda.
            </p>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="space-y-5 animate-slide-up">
             <div className="bg-white p-6 rounded-[32px] shadow-soft border border-gray-100">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Valyuta Kursi (1 USD = ? UZS)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={settings.exchangeRate}
                    onChange={(e) => setSettings({...settings, exchangeRate: Number(e.target.value)})}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xl font-black text-gray-900 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    placeholder="0"
                  />
                  <div className="absolute right-4 top-4 text-green-500 font-bold uppercase">UZS</div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-[32px] shadow-soft border border-gray-100 space-y-6">
                <div>
                  <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="text-lg">🚛</span> AVTO TARIFLARI ($)
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold ml-1">Standart / kg</span>
                      <input 
                        type="number" step="0.1"
                        value={settings.prices.avto.standard}
                        onChange={(e) => setSettings({...settings, prices: {...settings.prices, avto: {...settings.prices.avto, standard: Number(e.target.value)}}})}
                        className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold ml-1">Katta Hajm</span>
                      <input 
                        type="number" step="0.1"
                        value={settings.prices.avto.bulk}
                        onChange={(e) => setSettings({...settings, prices: {...settings.prices, avto: {...settings.prices.avto, bulk: Number(e.target.value)}}})}
                        className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="text-lg">✈️</span> AVIA TARIFLARI ($)
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold ml-1">Standart / kg</span>
                      <input 
                        type="number" step="0.1"
                        value={settings.prices.avia.standard}
                        onChange={(e) => setSettings({...settings, prices: {...settings.prices, avia: {...settings.prices.avia, standard: Number(e.target.value)}}})}
                        className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold ml-1">Katta Hajm</span>
                      <input 
                        type="number" step="0.1"
                        value={settings.prices.avia.bulk}
                        onChange={(e) => setSettings({...settings, prices: {...settings.prices, avia: {...settings.prices.avia, bulk: Number(e.target.value)}}})}
                        className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
             </div>

             <button 
                onClick={handleSaveSettings}
                className="w-full py-5 bg-primary text-white rounded-[28px] font-black text-lg shadow-glow shadow-primary/20 active:scale-95 transition-transform"
             >
               O'ZGARISHLARNI SAQLASH
             </button>
          </div>
        )}
      </div>

      <div className="p-6 text-center text-[10px] text-gray-400 font-black tracking-widest uppercase opacity-40">
        Admin Management Dashboard • T TOP CARGO
      </div>
    </div>
  );
};

export default AdminDashboard;