// Resilient Supabase client with local storage persistence fallback
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const isRealSupabase = 
  typeof rawUrl === 'string' && 
  rawUrl.length > 0 && 
  !rawUrl.includes('placeholder-project') &&
  typeof rawKey === 'string' &&
  rawKey.length > 0 &&
  !rawKey.includes('placeholder-anon-key');

// Predefined Demo Users
export interface LocalUser {
  id: string;
  email: string;
  password?: string;
  user_metadata: {
    full_name?: string;
    phone?: string;
    role?: string;
    [key: string]: any;
  };
  app_metadata: Record<string, any>;
  aud: string;
  created_at: string;
}

const DEFAULT_DEMO_USERS: LocalUser[] = [
  {
    id: "usr-patient-001",
    email: "patient@rapidresq.com",
    password: "Password@123",
    user_metadata: {
      full_name: "Priya Sehrawat",
      phone: "+919876543210",
      role: "user"
    },
    app_metadata: { provider: "email" },
    aud: "authenticated",
    created_at: new Date().toISOString()
  },
  {
    id: "usr-doctor-001",
    email: "doctor@rapidresq.com",
    password: "Password@123",
    user_metadata: {
      full_name: "Dr. Ananya Sharma",
      phone: "+919876543211",
      role: "doctor"
    },
    app_metadata: { provider: "email" },
    aud: "authenticated",
    created_at: new Date().toISOString()
  },
  {
    id: "usr-hospital-001",
    email: "hospital@rapidresq.com",
    password: "Password@123",
    user_metadata: {
      full_name: "Apollo Emergency Admin",
      phone: "+919876543214",
      role: "hospital"
    },
    app_metadata: { provider: "email" },
    aud: "authenticated",
    created_at: new Date().toISOString()
  }
];

class LocalSupabaseAuth {
  private listeners: Array<(event: string, session: any) => void> = [];

  private getUsers(): LocalUser[] {
    try {
      const stored = localStorage.getItem('rapidresq_users');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading users from localStorage', e);
    }
    // Initialize with default demo users
    this.saveUsers(DEFAULT_DEMO_USERS);
    this.initDefaultProfiles();
    return DEFAULT_DEMO_USERS;
  }

  private saveUsers(users: LocalUser[]) {
    try {
      localStorage.setItem('rapidresq_users', JSON.stringify(users));
    } catch (e) {
      console.warn('Error saving users to localStorage', e);
    }
  }

  private initDefaultProfiles() {
    try {
      const existingProfiles = localStorage.getItem('rapidresq_table_profiles');
      if (!existingProfiles) {
        const profiles = DEFAULT_DEMO_USERS.map(u => ({
          id: `prof-${u.id}`,
          user_id: u.id,
          full_name: u.user_metadata.full_name,
          phone: u.user_metadata.phone,
          email: u.email,
          role: u.user_metadata.role || 'user',
          address: "Sector 44, New Delhi, India",
          blood_group: "O+",
          emergency_contact: "+919811002233",
          created_at: u.created_at,
          updated_at: u.created_at
        }));
        localStorage.setItem('rapidresq_table_profiles', JSON.stringify(profiles));
      }
    } catch (e) {
      console.warn('Error initializing profiles', e);
    }
  }

  private getStoredSession(): { user: LocalUser; access_token: string } | null {
    try {
      const stored = localStorage.getItem('rapidresq_auth_session');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading session from localStorage', e);
    }
    return null;
  }

  private setSession(session: { user: LocalUser; access_token: string } | null) {
    try {
      if (session) {
        localStorage.setItem('rapidresq_auth_session', JSON.stringify(session));
      } else {
        localStorage.removeItem('rapidresq_auth_session');
      }
    } catch (e) {
      console.warn('Error setting session in localStorage', e);
    }
    this.notifyAuthStateChange(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
  }

  private notifyAuthStateChange(event: string, session: any) {
    this.listeners.forEach(cb => {
      try {
        cb(event, session);
      } catch (err) {
        console.error('Auth state listener error', err);
      }
    });
  }

  async signUp({ email, password, options }: { email: string; password?: string; options?: { data?: Record<string, any>; emailRedirectTo?: string } }) {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    
    // Check if user already exists
    let existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      // Update password / metadata
      existing.password = password || existing.password;
      if (options?.data) {
        existing.user_metadata = { ...existing.user_metadata, ...options.data };
      }
      this.saveUsers(users);
    } else {
      existing = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        email: cleanEmail,
        password: password || "Password@123",
        user_metadata: {
          full_name: options?.data?.full_name || cleanEmail.split('@')[0],
          phone: options?.data?.phone || "",
          role: options?.data?.role || "user",
          ...options?.data
        },
        app_metadata: { provider: "email" },
        aud: "authenticated",
        created_at: new Date().toISOString()
      };
      users.push(existing);
      this.saveUsers(users);

      // Create profile record
      try {
        const profilesKey = 'rapidresq_table_profiles';
        const profilesRaw = localStorage.getItem(profilesKey);
        const profiles = profilesRaw ? JSON.parse(profilesRaw) : [];
        profiles.push({
          id: `prof-${existing.id}`,
          user_id: existing.id,
          full_name: existing.user_metadata.full_name,
          phone: existing.user_metadata.phone,
          email: existing.email,
          role: existing.user_metadata.role || 'user',
          address: "",
          blood_group: "",
          emergency_contact: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        localStorage.setItem(profilesKey, JSON.stringify(profiles));
      } catch (err) {
        console.warn('Error creating profile entry', err);
      }
    }

    const session = {
      user: existing,
      access_token: `mock-jwt-token-${existing.id}`
    };
    this.setSession(session);

    return {
      data: { user: existing, session },
      error: null
    };
  }

  async signInWithPassword({ email, password }: { email: string; password?: string }) {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    let user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // If demo user or auto-fallback
      user = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        email: cleanEmail,
        password: password || "Password@123",
        user_metadata: {
          full_name: cleanEmail.split('@')[0],
          phone: "+919876543210",
          role: "user"
        },
        app_metadata: { provider: "email" },
        aud: "authenticated",
        created_at: new Date().toISOString()
      };
      users.push(user);
      this.saveUsers(users);

      // Ensure profile exists
      try {
        const profilesKey = 'rapidresq_table_profiles';
        const profilesRaw = localStorage.getItem(profilesKey);
        const profiles = profilesRaw ? JSON.parse(profilesRaw) : [];
        profiles.push({
          id: `prof-${user.id}`,
          user_id: user.id,
          full_name: user.user_metadata.full_name,
          phone: user.user_metadata.phone,
          email: user.email,
          role: user.user_metadata.role || 'user',
          address: "",
          blood_group: "",
          emergency_contact: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        localStorage.setItem(profilesKey, JSON.stringify(profiles));
      } catch (err) {
        console.warn('Error creating profile entry', err);
      }
    }

    const session = {
      user,
      access_token: `mock-jwt-token-${user.id}`
    };
    this.setSession(session);

    return {
      data: { user, session },
      error: null
    };
  }

  async getUser() {
    const session = this.getStoredSession();
    return {
      data: { user: session?.user || null },
      error: null
    };
  }

  async getSession() {
    const session = this.getStoredSession();
    return {
      data: { session },
      error: null
    };
  }

  async signOut() {
    this.setSession(null);
    return { error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.push(callback);
    const session = this.getStoredSession();
    if (session) {
      setTimeout(() => callback('SIGNED_IN', session), 0);
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
          }
        }
      }
    };
  }

  async updateUser(attributes: { data?: Record<string, any>; email?: string; password?: string }) {
    const session = this.getStoredSession();
    if (!session || !session.user) {
      return { data: { user: null }, error: { message: "No active user session" } };
    }

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === session.user.id);
    if (userIndex !== -1) {
      if (attributes.data) {
        users[userIndex].user_metadata = {
          ...users[userIndex].user_metadata,
          ...attributes.data
        };
      }
      if (attributes.email) {
        users[userIndex].email = attributes.email;
      }
      if (attributes.password) {
        users[userIndex].password = attributes.password;
      }
      this.saveUsers(users);
      session.user = users[userIndex];
      this.setSession(session);
    }

    return { data: { user: session.user }, error: null };
  }

  async resetPasswordForEmail(_email: string) {
    return { data: {}, error: null };
  }
}

class LocalSupabaseQueryBuilder {
  private tableName: string;
  private filters: Array<(row: any) => boolean> = [];
  private orderConfig: { column: string; ascending?: boolean } | null = null;
  private limitCount: number | null = null;
  private isSingle = false;
  private isMaybeSingle = false;
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: any = null;
  private countMode: string | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private getStorageKey() {
    return `rapidresq_table_${this.tableName}`;
  }

  private getRows(): any[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn(`Error reading ${this.tableName} from localStorage`, e);
    }

    // Default seeds for specific tables
    if (this.tableName === 'profiles') {
      const defaultProfiles = DEFAULT_DEMO_USERS.map(u => ({
        id: `prof-${u.id}`,
        user_id: u.id,
        full_name: u.user_metadata.full_name,
        phone: u.user_metadata.phone,
        email: u.email,
        role: u.user_metadata.role || 'user',
        address: "Sector 44, New Delhi, India",
        blood_group: "O+",
        emergency_contact: "+919811002233",
        created_at: u.created_at,
        updated_at: u.created_at
      }));
      this.saveRows(defaultProfiles);
      return defaultProfiles;
    }

    if (this.tableName === 'hospitals') {
      const defaultHospitals = [
        {
          id: "hosp-1",
          name: "Apollo Emergency & Trauma Hospital",
          address: "Sector 26, Main Ring Road",
          latitude: 28.5355,
          longitude: 77.3910,
          phone: "+91-11-26925858",
          total_icu_beds: 45,
          available_icu_beds: 12,
          total_general_beds: 200,
          available_general_beds: 68,
          total_oxygen_beds: 80,
          available_oxygen_beds: 29,
          blood_units_available: { "O+": 25, "O-": 8, "A+": 18, "B+": 30, "AB+": 10 },
          active_ventilators: 18,
          rating: 4.8
        },
        {
          id: "hosp-2",
          name: "Max Super Speciality Hospital",
          address: "Saket Institutional Area, New Delhi",
          latitude: 28.5284,
          longitude: 77.2188,
          phone: "+91-11-26515050",
          total_icu_beds: 60,
          available_icu_beds: 19,
          total_general_beds: 350,
          available_general_beds: 114,
          total_oxygen_beds: 120,
          available_oxygen_beds: 42,
          blood_units_available: { "O+": 35, "O-": 12, "A+": 24, "B+": 40, "AB+": 15 },
          active_ventilators: 24,
          rating: 4.9
        }
      ];
      this.saveRows(defaultHospitals);
      return defaultHospitals;
    }

    if (this.tableName === 'blood_donors') {
      const defaultDonors = [
        {
          id: "donor-1",
          name: "Vikram Malhotra",
          blood_group: "O+",
          city: "New Delhi",
          phone: "+919811223344",
          last_donation: "2026-06-15",
          available: true
        },
        {
          id: "donor-2",
          name: "Kavita Rao",
          blood_group: "O-",
          city: "New Delhi",
          phone: "+919822334455",
          last_donation: "2026-05-10",
          available: true
        },
        {
          id: "donor-3",
          name: "Rohit Deshmukh",
          blood_group: "B+",
          city: "Gurugram",
          phone: "+919833445566",
          last_donation: "2026-07-01",
          available: true
        }
      ];
      this.saveRows(defaultDonors);
      return defaultDonors;
    }

    return [];
  }

  private saveRows(rows: any[]) {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(rows));
    } catch (e) {
      console.warn(`Error saving ${this.tableName} to localStorage`, e);
    }
  }

  select(columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated' }) {
    this.action = 'select';
    if (options?.count) {
      this.countMode = options.count;
    }
    return this;
  }

  insert(data: any | any[]) {
    this.action = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  upsert(data: any | any[]) {
    this.action = 'upsert';
    this.payload = data;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push(row => String(row[column]) === String(value));
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push(row => String(row[column]) !== String(value));
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push(row => values.map(String).includes(String(row[column])));
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderConfig = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  // Make the query builder awaitable
  async then(resolve: (value: any) => void, _reject?: (reason: any) => void) {
    let rows = this.getRows();
    let count: number | null = null;

    if (this.action === 'insert') {
      const itemsToInsert = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = itemsToInsert.map(item => ({
        id: item.id || `${this.tableName}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
        ...item
      }));
      rows = [...rows, ...inserted];
      this.saveRows(rows);
      const res = {
        data: Array.isArray(this.payload) ? inserted : inserted[0],
        error: null,
        count: inserted.length
      };
      resolve(res);
      return res;
    }

    if (this.action === 'upsert') {
      const itemsToUpsert = Array.isArray(this.payload) ? this.payload : [this.payload];
      const upserted: any[] = [];
      for (const item of itemsToUpsert) {
        const idx = rows.findIndex(r => (item.id && r.id === item.id) || (item.user_id && r.user_id === item.user_id));
        if (idx !== -1) {
          rows[idx] = { ...rows[idx], ...item, updated_at: new Date().toISOString() };
          upserted.push(rows[idx]);
        } else {
          const newItem = {
            id: item.id || `${this.tableName}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
            ...item
          };
          rows.push(newItem);
          upserted.push(newItem);
        }
      }
      this.saveRows(rows);
      const res = {
        data: Array.isArray(this.payload) ? upserted : upserted[0],
        error: null,
        count: upserted.length
      };
      resolve(res);
      return res;
    }

    if (this.action === 'update') {
      let matchedCount = 0;
      const updatedRows = rows.map(row => {
        const matches = this.filters.every(filter => filter(row));
        if (matches) {
          matchedCount++;
          return { ...row, ...this.payload, updated_at: new Date().toISOString() };
        }
        return row;
      });
      this.saveRows(updatedRows);
      const res = { data: this.payload, error: null, count: matchedCount };
      resolve(res);
      return res;
    }

    if (this.action === 'delete') {
      const remainingRows = rows.filter(row => !this.filters.every(filter => filter(row)));
      this.saveRows(remainingRows);
      const res = { data: null, error: null };
      resolve(res);
      return res;
    }

    // Default SELECT
    let result = rows.filter(row => this.filters.every(filter => filter(row)));

    if (this.countMode) {
      count = result.length;
    }

    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig;
      result.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (valA === valB) return 0;
        if (ascending) {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });
    }

    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }

    let finalData: any = result;
    if (this.isSingle) {
      finalData = result.length > 0 ? result[0] : null;
    } else if (this.isMaybeSingle) {
      finalData = result.length > 0 ? result[0] : null;
    }

    const response = {
      data: finalData,
      error: null,
      count: count !== null ? count : (Array.isArray(finalData) ? finalData.length : 1)
    };
    resolve(response);
    return response;
  }
}

class LocalSupabaseStorageBucket {
  private bucketName: string;

  constructor(bucketName: string) {
    this.bucketName = bucketName;
  }

  async upload(path: string, file: any) {
    try {
      const key = `rapidresq_storage_${this.bucketName}_${path}`;
      if (typeof file === 'string') {
        localStorage.setItem(key, file);
      } else if (file instanceof Blob || file instanceof File) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((res) => {
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(file);
        });
        localStorage.setItem(key, dataUrl);
      }
      return { data: { path }, error: null };
    } catch (e) {
      return { data: { path }, error: null };
    }
  }

  getPublicUrl(path: string) {
    const key = `rapidresq_storage_${this.bucketName}_${path}`;
    const stored = localStorage.getItem(key);
    return {
      data: {
        publicUrl: stored || `https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80`
      }
    };
  }

  async remove(_paths: string[]) {
    return { error: null };
  }
}

class LocalRealtimeChannel {
  name: string;
  private opts: any;
  private listeners: Array<{ type: string; filter?: any; callback: (payload: any) => void }> = [];
  private windowListener: ((e: Event) => void) | null = null;
  private presenceMap: Record<string, any[]> = {};

  constructor(name: string, opts?: any) {
    this.name = name;
    this.opts = opts || {};
  }

  on(type: string, filterOrCallback: any, maybeCallback?: any) {
    let filter = filterOrCallback;
    let callback = maybeCallback;
    if (typeof filterOrCallback === 'function') {
      callback = filterOrCallback;
      filter = {};
    }
    if (typeof callback === 'function') {
      this.listeners.push({ type, filter, callback });
    }
    return this;
  }

  subscribe(statusCallback?: (status: string) => void) {
    if (typeof window !== 'undefined') {
      this.windowListener = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (!detail || detail.channel !== this.name) return;

        for (const handler of this.listeners) {
          if (handler.type === detail.type) {
            // Check event name if specified
            if (handler.filter?.event && detail.event && handler.filter.event !== '*' && handler.filter.event !== detail.event) {
              continue;
            }
            try {
              handler.callback({
                event: detail.event,
                payload: detail.payload,
                new: detail.payload?.new,
                old: detail.payload?.old,
                eventType: detail.payload?.eventType || 'INSERT',
                key: detail.key
              });
            } catch (err) {
              console.warn('[LocalRealtimeChannel] Handler error:', err);
            }
          }
        }
      };

      window.addEventListener('rapidresq:realtime_channel', this.windowListener);
    }

    if (statusCallback) {
      setTimeout(() => statusCallback('SUBSCRIBED'), 0);
    }
    return this;
  }

  async unsubscribe() {
    if (this.windowListener && typeof window !== 'undefined') {
      window.removeEventListener('rapidresq:realtime_channel', this.windowListener);
      this.windowListener = null;
    }
    this.listeners = [];
    return 'ok';
  }

  async send(msg: { type: string; event?: string; payload?: any }) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('rapidresq:realtime_channel', {
        detail: {
          channel: this.name,
          type: msg.type || 'broadcast',
          event: msg.event,
          payload: msg.payload
        }
      });
      window.dispatchEvent(event);
    }
    return { error: null };
  }

  async track(state: any) {
    const key = this.opts?.config?.presence?.key || 'local_user';
    this.presenceMap[key] = [{ presence_ref: `ref_${Date.now()}`, ...state }];

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rapidresq:realtime_channel', {
        detail: {
          channel: this.name,
          type: 'presence',
          event: 'join',
          key,
          payload: state
        }
      }));
    }
    return 'ok';
  }

  async untrack() {
    const key = this.opts?.config?.presence?.key || 'local_user';
    delete this.presenceMap[key];

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rapidresq:realtime_channel', {
        detail: {
          channel: this.name,
          type: 'presence',
          event: 'leave',
          key,
          payload: {}
        }
      }));
    }
    return 'ok';
  }

  presenceState() {
    return this.presenceMap;
  }
}

class LocalSupabaseClient {
  auth = new LocalSupabaseAuth();
  
  from(tableName: string) {
    return new LocalSupabaseQueryBuilder(tableName);
  }

  channel(channelName: string, opts?: any) {
    return new LocalRealtimeChannel(channelName, opts);
  }

  removeChannel(channel: any) {
    if (channel && typeof channel.unsubscribe === 'function') {
      channel.unsubscribe();
    }
  }

  storage = {
    from: (bucketName: string) => new LocalSupabaseStorageBucket(bucketName)
  };

  functions = {
    invoke: async (name: string, { body }: { body?: any } = {}) => {
      console.log(`[LocalSupabase] Invoked function '${name}':`, body);
      return { data: { success: true, message: `Function ${name} simulated successfully` }, error: null };
    }
  };
}

export const supabase = isRealSupabase
  ? createClient<Database>(rawUrl, rawKey, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : (new LocalSupabaseClient() as any);
