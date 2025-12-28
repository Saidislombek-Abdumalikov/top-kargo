
import { ParcelData, SavedTrack, AppSettings, UserProfile, ClientActivity } from '../types';

// --- GOOGLE SHEETS CONFIGURATION ---
export const CLIENTS_SHEET_URL = "https://docs.google.com/spreadsheets/d/1iebmmqkTFlJt7OOqdtmr8B48FvlWIcOv8EUtLrYlukc/export?format=csv"; 
export const REYS_DIRECTORY_URL = "https://docs.google.com/spreadsheets/d/1eCuVFuY7BsblAaETCYA7C8hIWM51sfZxJ759fuxoxeg/export?format=csv"; 
export const SETTINGS_SHEET_URL = "https://docs.google.com/spreadsheets/d/1M7J6v-vkVVtZpLqLsC9giRXKqkDL9NBZhLnY9SX_d94/export?format=csv";
export const ARRIVED_REYS_SHEET_URL = "https://docs.google.com/spreadsheets/d/11SUQmUGOrmcSNQ6VMqGcfA7lUg0rV3KvN_CKBagnM4Q/export?format=csv";

const DB_KEY_USER_TRACKS_PREFIX = 'ttop_kargo_user_tracks'; 
const DB_KEY_SETTINGS = 'ttop_kargo_settings';
const DB_KEY_USER_PROFILE = 'ttop_kargo_user_profile';

// --- CACHING SYSTEM ---
interface CacheEntry {
    data: string;
    timestamp: number;
}
const SHEET_CACHE: Record<string, CacheEntry> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export const clearDataCache = () => {
    Object.keys(SHEET_CACHE).forEach(key => delete SHEET_CACHE[key]);
};

const fetchWithCache = async (url: string): Promise<string | null> => {
    const now = Date.now();
    
    // Check Cache
    if (SHEET_CACHE[url] && (now - SHEET_CACHE[url].timestamp < CACHE_TTL)) {
        return SHEET_CACHE[url].data;
    }

    try {
        // Fetch fresh data
        const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}t=${now}`;
        const response = await fetch(fetchUrl);
        if (!response.ok) return null;
        
        const text = await response.text();
        
        // Update Cache
        SHEET_CACHE[url] = { data: text, timestamp: now };
        return text;
    } catch (e) {
        return null;
    }
};

const splitCsvRow = (row: string) => {
    if (!row) return [];
    const res = [];
    let current = '';
    let inQuote = false;
    for(let i=0; i<row.length; i++){
        const char = row[i];
        if(char === '"'){
            inQuote = !inQuote;
        } else if(char === ',' && !inQuote){
            res.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
            continue;
        }
        current += char;
    }
    res.push(current.trim().replace(/^"|"$/g, ''));
    return res;
};

const getCsvUrl = (url: string): string => {
    if (url.includes('output=csv') || url.includes('format=csv')) return url;
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
        return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
    }
    return url;
};

// --- Arrived Reys Logic ---
export const fetchArrivedReys = async (): Promise<{ avia: string[], avto: string[] }> => {
    try {
        const text = await fetchWithCache(ARRIVED_REYS_SHEET_URL);
        if (!text) return { avia: [], avto: [] };

        const rows = text.split('\n').map(r => splitCsvRow(r));
        
        const avia: string[] = [];
        const avto: string[] = [];

        for(let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row && row[0]) {
                const val = row[0].trim().replace(/^"|"$/g, '');
                if (val && !val.toLowerCase().includes('avia') && /\d/.test(val)) {
                    avia.push(val);
                }
            }
            if (row && row.length > 1 && row[1]) {
                const val = row[1].trim().replace(/^"|"$/g, '');
                if (val && !val.toLowerCase().includes('avto') && /\d/.test(val)) {
                    avto.push(val);
                }
            }
        }
        return { avia, avto };
    } catch (e) {
        return { avia: [], avto: [] };
    }
};

export const isReysArrived = (boxCode: string | undefined, arrivedData: { avia: string[], avto: string[] } | null): boolean => {
    if (!boxCode || !arrivedData) return false;
    const match = boxCode.match(/(\d+)/);
    if (!match) return false;
    const number = match[1];
    const lower = boxCode.toLowerCase();
    if (lower.includes('avia')) {
        return arrivedData.avia.includes(number);
    } else {
        return arrivedData.avto.includes(number);
    }
};

// --- User Profile & Admin Support ---
export const fetchAndVerifyClient = async (inputClientId: string, inputPhone: string): Promise<UserProfile> => {
    const cleanInputId = inputClientId.trim().toUpperCase().replace(/\s/g, '');
    const cleanInputPhone = inputPhone.replace(/\D/g, '').slice(-9);

    if (!CLIENTS_SHEET_URL) throw new Error("Tizim sozlanmagan.");
    
    try {
        const text = await fetchWithCache(CLIENTS_SHEET_URL);
        if (!text) throw new Error("Tarmoq xatosi");
        
        const trimmed = text.trim();
        if (trimmed.startsWith('<') || trimmed.includes('<!DOCTYPE')) {
             throw new Error("Baza bilan aloqa xatoligi (Access Denied).");
        }
        
        const rows = text.split('\n');

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cols = splitCsvRow(row);
            const idMatch = cols.some(c => c.toUpperCase().replace(/\s/g, '') === cleanInputId);

            if (idMatch) {
                const phoneMatch = cols.some(c => c.replace(/\D/g, '').endsWith(cleanInputPhone));
                if (phoneMatch) {
                    let name = "Mijoz";
                    const possibleName = cols.find(c => c.length > 2 && !c.includes(cleanInputPhone) && c.toUpperCase() !== cleanInputId);
                    if (possibleName) name = possibleName;
                    return { name, clientId: cleanInputId, phone: "+998 " + cleanInputPhone, registeredAt: Date.now() };
                }
            }
        }
        throw new Error("Bunday ID topilmadi yoki telefon raqam mos emas.");
    } catch (error: any) {
        throw new Error(error.message || "Xatolik.");
    }
};

export const fetchAllClientsFromSheet = async (): Promise<ClientActivity[]> => {
    if (!CLIENTS_SHEET_URL) return [];
    try {
        const text = await fetchWithCache(CLIENTS_SHEET_URL);
        if (!text) return [];

        const trimmed = text.trim();
        if (trimmed.startsWith('<') || trimmed.includes('<!DOCTYPE')) {
             return [];
        }

        const rows = text.split('\n');
        const results: ClientActivity[] = [];

        for (let i = 1; i < rows.length; i++) {
            const cols = splitCsvRow(rows[i]);
            if (cols.length < 2) continue;
            
            // Allow JEK, JK, TT, TOP prefixes
            const clientIdIdx = cols.findIndex(c => /^(TT|TOP|JK|JEK)/i.test(c.trim()));
            // Look for phone
            const phoneIdx = cols.findIndex(c => {
                const d = c.replace(/\D/g, '');
                return d.length >= 7 && d.length <= 15;
            });

            const clientId = clientIdIdx !== -1 ? cols[clientIdIdx] : (phoneIdx === 0 ? cols[1] : cols[0]);
            const phoneVal = phoneIdx !== -1 ? cols[phoneIdx] : "";
            const name = cols.find((c, idx) => idx !== clientIdIdx && idx !== phoneIdx && c.length > 2) || "Mijoz";
            
            if (clientId) {
                results.push({
                    id: String(i),
                    clientId,
                    name,
                    phone: phoneVal.startsWith('+') ? phoneVal : (phoneVal ? `+998 ${phoneVal.replace(/\D/g, '').slice(-9)}` : '')
                });
            }
        }
        return results;
    } catch (e) {
        return [];
    }
};

export const getUserProfile = (): UserProfile | null => {
  try { return JSON.parse(localStorage.getItem(DB_KEY_USER_PROFILE) || 'null'); } catch (e) { return null; }
};
export const saveUserProfile = (profile: UserProfile) => localStorage.setItem(DB_KEY_USER_PROFILE, JSON.stringify(profile));
export const logoutUser = () => localStorage.removeItem(DB_KEY_USER_PROFILE);

const DEFAULT_SETTINGS: AppSettings = {
  exchangeRate: 12200, 
  prices: { avto: { standard: 6.0, bulk: 7.5 }, avia: { standard: 9.5, bulk: 11.0 } }
};

export const getAppSettings = (): AppSettings => {
  try { return JSON.parse(localStorage.getItem(DB_KEY_SETTINGS) || 'null') || DEFAULT_SETTINGS; } catch (e) { return DEFAULT_SETTINGS; }
};

export const saveAppSettings = (settings: AppSettings) => localStorage.setItem(DB_KEY_SETTINGS, JSON.stringify(settings));

export const syncGlobalSettings = async (): Promise<void> => {
    if (!SETTINGS_SHEET_URL) return; 
    try {
        const text = await fetchWithCache(SETTINGS_SHEET_URL);
        if (!text || text.startsWith('<')) return; // Safety check
        
        const rows = text.split('\n').map(r => splitCsvRow(r));
        if (rows.length < 2) return;
        
        let headerIndex = -1;
        for (let i = 0; i < Math.min(rows.length, 5); i++) {
            const rowStr = rows[i].join(' ').toLowerCase();
            if (rowStr.includes('kurs') || (rowStr.includes('avia') && rowStr.includes('standart'))) {
                headerIndex = i;
                break;
            }
        }
        if (headerIndex === -1 || !rows[headerIndex + 1]) return;
        const headers = rows[headerIndex].map(h => h.toLowerCase().trim());
        const values = rows[headerIndex + 1];
        const newSettings = { ...getAppSettings() };
        let updated = false;

        headers.forEach((h, idx) => {
             const val = values[idx];
             if (!val) return;
             const num = parseFloat(val.replace(/[^0-9.,]/g, '').replace(',', '.'));
             if (isNaN(num)) return;
             if (h.includes('kurs')) { newSettings.exchangeRate = num; updated = true; }
             else if (h.includes('avia')) {
                 if (h.includes('standart')) { newSettings.prices.avia.standard = num; updated = true; }
                 else if (h.includes('bulk')) { newSettings.prices.avia.bulk = num; updated = true; }
             } else if (h.includes('avto')) {
                 if (h.includes('standart')) { newSettings.prices.avto.standard = num; updated = true; }
                 else if (h.includes('bulk')) { newSettings.prices.avto.bulk = num; updated = true; }
             }
        });
        if (updated) saveAppSettings(newSettings);
    } catch (e) {}
};

const parseReysRow = (rowStr: string, reysName: string, searchId: string): ParcelData | null => {
    const cols = splitCsvRow(rowStr);
    if (cols.length < 3) return null;
    if (!cols[2] || !cols[2].toUpperCase().includes(searchId)) return null; 

    const id = cols[2];
    const date = cols[1] || new Date().toLocaleDateString();
    const weightVal = parseFloat(cols[6]?.replace(',', '.').replace(/[^\d.]/g, '') || "0") || 0;
    const isAvia = reysName.toLowerCase().includes('avia');
    const settings = getAppSettings();
    const rate = isAvia ? settings.prices.avia.standard : settings.prices.avto.standard;

    return {
        id: id,
        sender: cols[3] || "Yuk",
        receiver: cols[7] || "Mijoz",
        weight: weightVal.toString(),
        boxCode: reysName,
        price: weightVal * rate,
        history: [{
            date: date,
            time: "12:00",
            status: `Yo'lga chiqdi (${reysName})`,
            location: isAvia ? 'Guangzhou Aeroport' : 'Guangzhou Ombori',
            completed: false
        }]
    };
};

const promiseAny = <T>(promises: Promise<T>[]): Promise<T> => {
    return new Promise((resolve, reject) => {
        let rejectedCount = 0;
        if (promises.length === 0) {
            reject(new Error("No promises"));
            return;
        }
        promises.forEach(p => {
            Promise.resolve(p).then(resolve).catch(() => {
                rejectedCount++;
                if (rejectedCount === promises.length) {
                    reject(new Error("All promises rejected"));
                }
            });
        });
    });
};

export const findParcel = async (id: string): Promise<ParcelData | null> => {
  if (!id) return null;
  const cleanId = id.toUpperCase().trim().replace(/\s/g, '');
  
  if (REYS_DIRECTORY_URL) {
      try {
        const dirText = await fetchWithCache(REYS_DIRECTORY_URL);
        if (dirText && !dirText.startsWith('<')) {
            const dirRows = dirText.split('\n');
            const tasks: { name: string, url: string }[] = [];

            for (const row of dirRows) {
                const cols = splitCsvRow(row);
                if (cols.length >= 2 && cols[1].includes('http')) {
                    tasks.push({
                        name: cols[0],
                        url: getCsvUrl(cols[1])
                    });
                }
            }

            const searchPromises = tasks.map(async (task) => {
                const text = await fetchWithCache(task.url);
                if (!text || text.startsWith('<')) throw new Error('Invalid sheet');

                if (text.indexOf(cleanId) === -1) {
                     throw new Error('Not found in this sheet');
                }

                const lines = text.split('\n');
                for (const line of lines) {
                    if (line.includes(cleanId)) {
                        const parsed = parseReysRow(line, task.name, cleanId);
                        if (parsed) return parsed;
                    }
                }
                
                throw new Error('Not found after parsing');
            });

            try {
                return await promiseAny(searchPromises);
            } catch (e) {
                return null;
            }
        }
      } catch (e) {
          console.error("Search error:", e);
      }
  }
  return null;
};

const getUserTracksKey = () => {
    const profile = getUserProfile();
    return profile ? `${DB_KEY_USER_TRACKS_PREFIX}_${profile.clientId}` : DB_KEY_USER_TRACKS_PREFIX;
};

export const getUserTracks = (): SavedTrack[] => {
  try { return JSON.parse(localStorage.getItem(getUserTracksKey()) || '[]'); } catch (e) { return []; }
};

export const saveUserTrack = (id: string) => {
  const cleanId = id.trim().toUpperCase().replace(/\s/g, '');
  if (!cleanId) return;
  const tracks = getUserTracks();
  if (tracks.some(t => t.id === cleanId)) return;
  const updated = [{ id: cleanId, addedAt: Date.now() }, ...tracks];
  localStorage.setItem(getUserTracksKey(), JSON.stringify(updated));
};

export const removeUserTrack = (id: string) => {
  const cleanId = id.trim().toUpperCase().replace(/\s/g, '');
  const updated = getUserTracks().filter(t => t.id !== cleanId);
  localStorage.setItem(getUserTracksKey(), JSON.stringify(updated));
};

export const updateGlobalTrackingData = () => {};

export const convertExcelRowToParcel = (row: any): ParcelData | null => {
  try {
    const keys = Object.keys(row);
    const idKey = keys.find(k => /track|id|code|追踪/i.test(k)) || "";
    const id = String(row[idKey] || "").trim();
    if (!id) return null;
    return {
        id, 
        sender: row['Sender'] || 'Imported', 
        receiver: row['Receiver'] || 'Imported',
        weight: String(row['Weight'] || '0'),
        history: [{ date: new Date().toLocaleDateString(), time: "", status: 'Imported', location: 'Warehouse', completed: false }]
    };
  } catch (e) { return null; }
};
