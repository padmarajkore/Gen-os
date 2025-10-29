import { openDB, IDBPDatabase } from 'idb';
import type { AppSchema } from '../types';

const DB_NAME = 'GenerativeOSDB';
const DB_VERSION = 3;

// Type definitions for our data structures
export interface AppRegistryData {
  appId: string;
  appName: string;
  schema: AppSchema;
  createdAt: number;
  lastUsed: number;
  usageCount: number;
  dataKeys: string[];
  tags: string[];
  parentAppId?: string;
}

export interface EmailData {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  timestamp: number;
  read: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam';
  attachments?: { name: string; url: string; type: string }[];
}

export interface CalendarEventData {
  id: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  location?: string;
  attendees?: string[];
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: number;
  };
  reminders?: { minutes: number }[];
  createdAt: number;
  updatedAt: number;
}

export interface NoteData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  folder?: string;
  pinned: boolean;
}

export interface ContactData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  avatar?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  createdAt: number;
  tags: string[];
  folder?: string;
  thumbnail?: string;
}

export interface SystemSettingData {
  key: string;
  value: any;
  updatedAt: number;
  description?: string;
}

export interface AppDataEntry {
  dataKey: string;
  appId: string;
  data: any;
  schema?: any;
  createdAt: number;
  updatedAt: number;
}

// Store names
const STORES = {
  KEY_VALUE: 'KeyValueStore',
  APP_REGISTRY: 'AppRegistry',
  EMAILS: 'Emails',
  CALENDAR_EVENTS: 'CalendarEvents',
  NOTES: 'Notes',
  CONTACTS: 'Contacts',
  FILES: 'Files',
  SYSTEM_SETTINGS: 'SystemSettings',
  APP_DATA: 'AppData'
} as const;

class EnhancedDatabaseService {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = this.initDatabase();
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Create legacy store for backward compatibility
        if (!db.objectStoreNames.contains(STORES.KEY_VALUE)) {
          db.createObjectStore(STORES.KEY_VALUE);
        }

        // Create App Registry store
        if (!db.objectStoreNames.contains(STORES.APP_REGISTRY)) {
          const appRegistry = db.createObjectStore(STORES.APP_REGISTRY, { keyPath: 'appId' });
          appRegistry.createIndex('by-name', 'appName');
          appRegistry.createIndex('by-created', 'createdAt');
          appRegistry.createIndex('by-last-used', 'lastUsed');
          appRegistry.createIndex('by-tags', 'tags', { multiEntry: true });
        }

        // Create structured data stores
        if (!db.objectStoreNames.contains(STORES.EMAILS)) {
          const emails = db.createObjectStore(STORES.EMAILS, { keyPath: 'id' });
          emails.createIndex('by-timestamp', 'timestamp');
          emails.createIndex('by-folder', 'folder');
          emails.createIndex('by-read', 'read');
        }

        if (!db.objectStoreNames.contains(STORES.CALENDAR_EVENTS)) {
          const events = db.createObjectStore(STORES.CALENDAR_EVENTS, { keyPath: 'id' });
          events.createIndex('by-start-time', 'startTime');
          events.createIndex('by-created', 'createdAt');
        }

        if (!db.objectStoreNames.contains(STORES.NOTES)) {
          const notes = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
          notes.createIndex('by-updated', 'updatedAt');
          notes.createIndex('by-tags', 'tags', { multiEntry: true });
          notes.createIndex('by-pinned', 'pinned');
        }

        if (!db.objectStoreNames.contains(STORES.CONTACTS)) {
          const contacts = db.createObjectStore(STORES.CONTACTS, { keyPath: 'id' });
          contacts.createIndex('by-name', ['firstName', 'lastName']);
          contacts.createIndex('by-email', 'email');
        }

        if (!db.objectStoreNames.contains(STORES.FILES)) {
          const files = db.createObjectStore(STORES.FILES, { keyPath: 'id' });
          files.createIndex('by-name', 'name');
          files.createIndex('by-type', 'type');
          files.createIndex('by-created', 'createdAt');
        }

        if (!db.objectStoreNames.contains(STORES.SYSTEM_SETTINGS)) {
          db.createObjectStore(STORES.SYSTEM_SETTINGS, { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains(STORES.APP_DATA)) {
          const appData = db.createObjectStore(STORES.APP_DATA, { keyPath: 'dataKey' });
          appData.createIndex('by-app', 'appId');
          appData.createIndex('by-updated', 'updatedAt');
        }
      },
    });
  }

  // Legacy methods for backward compatibility
  async get<T>(key: string): Promise<T | undefined> {
    return (await this.dbPromise).get(STORES.KEY_VALUE, key);
  }

  async set(key: string, value: any): Promise<void> {
    await (await this.dbPromise).put(STORES.KEY_VALUE, value, key);
  }

  async delete(key: string): Promise<void> {
    await (await this.dbPromise).delete(STORES.KEY_VALUE, key);
  }

  async keys(): Promise<string[]> {
    const keys = await (await this.dbPromise).getAllKeys(STORES.KEY_VALUE);
    return keys.map(key => String(key));
  }

  // App Registry methods
  async registerApp(appId: string, appName: string, schema: AppSchema, dataKeys: string[] = [], tags: string[] = []): Promise<void> {
    const db = await this.dbPromise;
    const now = Date.now();
    
    const existingApp = await db.get(STORES.APP_REGISTRY, appId);
    
    await db.put(STORES.APP_REGISTRY, {
      appId,
      appName,
      schema,
      createdAt: existingApp?.createdAt || now,
      lastUsed: now,
      usageCount: (existingApp?.usageCount || 0) + 1,
      dataKeys,
      tags
    });
  }

  async getApp(appId: string) {
    return (await this.dbPromise).get(STORES.APP_REGISTRY, appId);
  }

  async getAllApps() {
    return (await this.dbPromise).getAll(STORES.APP_REGISTRY);
  }

  async searchApps(query: string) {
    const db = await this.dbPromise;
    const allApps = await db.getAll(STORES.APP_REGISTRY);
    
    return allApps.filter(app => 
      app.appName.toLowerCase().includes(query.toLowerCase()) ||
      app.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }

  async getAppsByTag(tag: string) {
    return (await this.dbPromise).getAllFromIndex(STORES.APP_REGISTRY, 'by-tags', tag);
  }

  async getRecentApps(limit: number = 10) {
    const db = await this.dbPromise;
    const apps = await db.getAllFromIndex(STORES.APP_REGISTRY, 'by-last-used');
    return apps.reverse().slice(0, limit);
  }

  // Structured data methods
  async addEmail(email: Omit<EmailData, 'id'>) {
    const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await (await this.dbPromise).put(STORES.EMAILS, { ...email, id });
    return id;
  }

  async getEmails(folder?: string) {
    const db = await this.dbPromise;
    if (folder) {
      return db.getAllFromIndex(STORES.EMAILS, 'by-folder', folder);
    }
    return db.getAll(STORES.EMAILS);
  }

  async addCalendarEvent(event: Omit<CalendarEventData, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    await (await this.dbPromise).put(STORES.CALENDAR_EVENTS, { 
      ...event, 
      id, 
      createdAt: now, 
      updatedAt: now 
    });
    return id;
  }

  async getCalendarEvents(startDate?: number, endDate?: number) {
    const db = await this.dbPromise;
    const allEvents = await db.getAllFromIndex(STORES.CALENDAR_EVENTS, 'by-start-time');
    
    if (startDate && endDate) {
      return allEvents.filter(event => 
        event.startTime >= startDate && event.startTime <= endDate
      );
    }
    
    return allEvents;
  }

  async addNote(note: Omit<NoteData, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    await (await this.dbPromise).put(STORES.NOTES, { 
      ...note, 
      id, 
      createdAt: now, 
      updatedAt: now 
    });
    return id;
  }

  async getNotes() {
    return (await this.dbPromise).getAllFromIndex(STORES.NOTES, 'by-updated');
  }

  async addContact(contact: Omit<ContactData, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    await (await this.dbPromise).put(STORES.CONTACTS, { 
      ...contact, 
      id, 
      createdAt: now, 
      updatedAt: now 
    });
    return id;
  }

  async getContacts() {
    return (await this.dbPromise).getAll(STORES.CONTACTS);
  }

  async addFile(file: Omit<FileData, 'id' | 'createdAt'>) {
    const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await (await this.dbPromise).put(STORES.FILES, { 
      ...file, 
      id, 
      createdAt: Date.now() 
    });
    return id;
  }

  async getFiles(type?: string) {
    const db = await this.dbPromise;
    if (type) {
      return db.getAllFromIndex(STORES.FILES, 'by-type', type);
    }
    return db.getAll(STORES.FILES);
  }

  // System settings
  async setSetting(key: string, value: any, description?: string) {
    await (await this.dbPromise).put(STORES.SYSTEM_SETTINGS, {
      key,
      value,
      updatedAt: Date.now(),
      description
    });
  }

  async getSetting(key: string) {
    const setting = await (await this.dbPromise).get(STORES.SYSTEM_SETTINGS, key);
    return setting?.value;
  }

  async getAllSettings() {
    return (await this.dbPromise).getAll(STORES.SYSTEM_SETTINGS);
  }

  // App-specific data
  async setAppData(dataKey: string, appId: string, data: any, schema?: any) {
    await (await this.dbPromise).put(STORES.APP_DATA, {
      dataKey,
      appId,
      data,
      schema,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  async getAppData(dataKey: string) {
    const appData = await (await this.dbPromise).get(STORES.APP_DATA, dataKey);
    return appData?.data;
  }

  async getAppDataByAppId(appId: string) {
    return (await this.dbPromise).getAllFromIndex(STORES.APP_DATA, 'by-app', appId);
  }

  // Search and analytics
  async searchAllData(query: string) {
    const results = {
      apps: await this.searchApps(query),
      emails: [],
      notes: [],
      contacts: [],
      files: []
    };

    // Search in structured data
    const [emails, notes, contacts, files] = await Promise.all([
      this.getEmails(),
      this.getNotes(),
      this.getContacts(),
      this.getFiles()
    ]);

    const lowerQuery = query.toLowerCase();

    results.emails = emails.filter(email => 
      email.subject.toLowerCase().includes(lowerQuery) ||
      email.body.toLowerCase().includes(lowerQuery) ||
      email.from.toLowerCase().includes(lowerQuery)
    );

    results.notes = notes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );

    results.contacts = contacts.filter(contact =>
      contact.firstName.toLowerCase().includes(lowerQuery) ||
      contact.lastName.toLowerCase().includes(lowerQuery) ||
      contact.email?.toLowerCase().includes(lowerQuery) ||
      contact.company?.toLowerCase().includes(lowerQuery)
    );

    results.files = files.filter(file =>
      file.name.toLowerCase().includes(lowerQuery) ||
      file.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );

    return results;
  }

  async getUsageStats() {
    const apps = await this.getAllApps();
    const totalApps = apps.length;
    const totalUsage = apps.reduce((sum, app) => sum + app.usageCount, 0);
    const mostUsedApps = apps.sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
    
    const [emails, events, notes, contacts, files] = await Promise.all([
      this.getEmails(),
      this.getCalendarEvents(),
      this.getNotes(),
      this.getContacts(),
      this.getFiles()
    ]);

    return {
      totalApps,
      totalUsage,
      mostUsedApps,
      dataStats: {
        emails: emails.length,
        events: events.length,
        notes: notes.length,
        contacts: contacts.length,
        files: files.length
      }
    };
  }

  // Cleanup and maintenance
  async cleanup() {
    // Remove old unused data, optimize indexes, etc.
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Clean up old temporary files
    const files = await this.getFiles();
    const oldTempFiles = files.filter(file => 
      file.name.startsWith('temp_') && file.createdAt < thirtyDaysAgo
    );
    
    for (const file of oldTempFiles) {
      await (await this.dbPromise).delete(STORES.FILES, file.id);
    }
  }
}

export const enhancedDbService = new EnhancedDatabaseService();
