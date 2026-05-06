import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type {
  AgentDefinition,
  Conversation,
  LiveSession,
  LiveSessionType,
  MemoryItem,
  Message,
  TaskItem,
  ToolLog,
  UserRole,
} from "@raelix/shared";

export interface MemoryStore {
  initialize(agentCatalog: Pick<AgentDefinition, "name" | "description">[]): Promise<void>;
  ensureUser(name: string, role: UserRole): Promise<{ id: number; name: string; role: UserRole }>;
  createConversation(userId: number, title: string): Promise<number>;
  addMessage(conversationId: number, role: "user" | "assistant" | "system", content: string, agentName?: string): Promise<void>;
  listConversations(limit?: number): Promise<Conversation[]>;
  listMessages(conversationId: number, limit?: number): Promise<Message[]>;
  addMemory(userId: number, key: string, value: string, category: string): Promise<void>;
  listMemories(userId: number, limit?: number): Promise<MemoryItem[]>;
  createTask(userId: number, title: string, dueDate: string | null): Promise<TaskItem>;
  listTasks(userId: number, limit?: number): Promise<TaskItem[]>;
  logToolCall(params: {
    userId: number;
    agentName: string;
    toolName: string;
    status: "success" | "failure";
    input: string;
    output: string;
  }): Promise<void>;
  listToolLogs(userId: number, limit?: number): Promise<ToolLog[]>;
  listAgents(): Promise<Array<{ id: number; name: string; description: string; active: number }>>;

  upsertLearningProfile(userId: number, subject: string, level: string, notes: string): Promise<void>;
  createStudySession(userId: number, subject: string, plan: string): Promise<number>;
  createTradeJournalEntry(userId: number, entry: string): Promise<number>;
  createWatchedAsset(userId: number, symbol: string, assetType: string, notes: string): Promise<number>;
  createTaxLienProperty(userId: number, propertyRef: string, county: string, notes: string): Promise<number>;
  createRecipe(userId: number, recipeName: string, steps: string): Promise<number>;

  startLiveSession(userId: number, sessionType: LiveSessionType, notes?: string): Promise<LiveSession>;
  getActiveLiveSession(userId: number): Promise<LiveSession | null>;
  advanceLiveSessionStep(userId: number, notes?: string): Promise<LiveSession | null>;
  stopLiveSession(userId: number, notes?: string): Promise<LiveSession | null>;
}

const now = () => new Date().toISOString();

const resolveDbPath = (dbPath: string): string => {
  const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
  const dir = path.dirname(absolutePath);
  mkdirSync(dir, { recursive: true });
  return absolutePath;
};

export class SqliteMemoryStore implements MemoryStore {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(resolveDbPath(dbPath));
    this.db.pragma("journal_mode = WAL");
  }

  async initialize(agentCatalog: Pick<AgentDefinition, "name" | "description">[]): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        agent_name TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id)
      );

      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        due_date TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tool_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        agent_name TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        status TEXT NOT NULL,
        input TEXT NOT NULL,
        output TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS learning_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        level TEXT NOT NULL,
        notes TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, subject)
      );

      CREATE TABLE IF NOT EXISTS study_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        plan TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trade_journal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        entry TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS watched_assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        notes TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tax_lien_properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        property_ref TEXT NOT NULL,
        county TEXT NOT NULL,
        notes TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS live_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_type TEXT NOT NULL,
        status TEXT NOT NULL,
        current_step INTEGER NOT NULL,
        notes TEXT,
        started_at TEXT NOT NULL,
        ended_at TEXT
      );

      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        recipe_name TEXT NOT NULL,
        steps TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    const insertAgent = this.db.prepare(
      "INSERT INTO agents(name, description, active, created_at) VALUES(@name, @description, 1, @created_at) ON CONFLICT(name) DO UPDATE SET description = excluded.description",
    );

    const timestamp = now();
    const transaction = this.db.transaction((catalog: Pick<AgentDefinition, "name" | "description">[]) => {
      for (const item of catalog) {
        insertAgent.run({ name: item.name, description: item.description, created_at: timestamp });
      }
    });

    transaction(agentCatalog);
  }

  async ensureUser(name: string, role: UserRole): Promise<{ id: number; name: string; role: UserRole }> {
    const existing = this.db
      .prepare("SELECT id, name, role FROM users WHERE name = ? LIMIT 1")
      .get(name) as { id: number; name: string; role: UserRole } | undefined;

    if (existing) {
      return existing;
    }

    const result = this.db.prepare("INSERT INTO users(name, role, created_at) VALUES(?, ?, ?)").run(name, role, now());

    return { id: Number(result.lastInsertRowid), name, role };
  }

  async createConversation(userId: number, title: string): Promise<number> {
    const result = this.db
      .prepare("INSERT INTO conversations(user_id, title, created_at, updated_at) VALUES(?, ?, ?, ?)")
      .run(userId, title, now(), now());
    return Number(result.lastInsertRowid);
  }

  async addMessage(
    conversationId: number,
    role: "user" | "assistant" | "system",
    content: string,
    agentName?: string,
  ): Promise<void> {
    this.db
      .prepare("INSERT INTO messages(conversation_id, role, content, agent_name, created_at) VALUES(?, ?, ?, ?, ?)")
      .run(conversationId, role, content, agentName ?? null, now());

    this.db.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(now(), conversationId);
  }

  async listConversations(limit = 20): Promise<Conversation[]> {
    return this.db
      .prepare("SELECT * FROM conversations ORDER BY updated_at DESC LIMIT ?")
      .all(limit) as Conversation[];
  }

  async listMessages(conversationId: number, limit = 100): Promise<Message[]> {
    return this.db
      .prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC LIMIT ?")
      .all(conversationId, limit) as Message[];
  }

  async addMemory(userId: number, key: string, value: string, category: string): Promise<void> {
    this.db
      .prepare("INSERT INTO memories(user_id, key, value, category, created_at) VALUES(?, ?, ?, ?, ?)")
      .run(userId, key, value, category, now());
  }

  async listMemories(userId: number, limit = 20): Promise<MemoryItem[]> {
    return this.db
      .prepare("SELECT * FROM memories WHERE user_id = ? ORDER BY id DESC LIMIT ?")
      .all(userId, limit) as MemoryItem[];
  }

  async createTask(userId: number, title: string, dueDate: string | null): Promise<TaskItem> {
    const result = this.db
      .prepare("INSERT INTO tasks(user_id, title, due_date, status, created_at) VALUES(?, ?, ?, 'open', ?)")
      .run(userId, title, dueDate, now());

    return this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(Number(result.lastInsertRowid)) as TaskItem;
  }

  async listTasks(userId: number, limit = 20): Promise<TaskItem[]> {
    return this.db
      .prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC LIMIT ?")
      .all(userId, limit) as TaskItem[];
  }

  async logToolCall(params: {
    userId: number;
    agentName: string;
    toolName: string;
    status: "success" | "failure";
    input: string;
    output: string;
  }): Promise<void> {
    this.db
      .prepare(
        "INSERT INTO tool_logs(user_id, agent_name, tool_name, status, input, output, created_at) VALUES(@userId, @agentName, @toolName, @status, @input, @output, @created_at)",
      )
      .run({ ...params, created_at: now() });
  }

  async listToolLogs(userId: number, limit = 30): Promise<ToolLog[]> {
    return this.db
      .prepare("SELECT * FROM tool_logs WHERE user_id = ? ORDER BY id DESC LIMIT ?")
      .all(userId, limit) as ToolLog[];
  }

  async listAgents(): Promise<Array<{ id: number; name: string; description: string; active: number }>> {
    return this.db.prepare("SELECT * FROM agents ORDER BY name ASC").all() as Array<{
      id: number;
      name: string;
      description: string;
      active: number;
    }>;
  }

  async upsertLearningProfile(userId: number, subject: string, level: string, notes: string): Promise<void> {
    this.db
      .prepare(
        "INSERT INTO learning_profiles(user_id, subject, level, notes, updated_at) VALUES(?, ?, ?, ?, ?) ON CONFLICT(user_id, subject) DO UPDATE SET level = excluded.level, notes = excluded.notes, updated_at = excluded.updated_at",
      )
      .run(userId, subject, level, notes, now());
  }

  async createStudySession(userId: number, subject: string, plan: string): Promise<number> {
    const result = this.db
      .prepare("INSERT INTO study_sessions(user_id, subject, plan, status, created_at) VALUES(?, ?, ?, 'open', ?)")
      .run(userId, subject, plan, now());
    return Number(result.lastInsertRowid);
  }

  async createTradeJournalEntry(userId: number, entry: string): Promise<number> {
    const result = this.db.prepare("INSERT INTO trade_journal(user_id, entry, created_at) VALUES(?, ?, ?)").run(userId, entry, now());
    return Number(result.lastInsertRowid);
  }

  async createWatchedAsset(userId: number, symbol: string, assetType: string, notes: string): Promise<number> {
    const result = this.db
      .prepare("INSERT INTO watched_assets(user_id, symbol, asset_type, notes, created_at) VALUES(?, ?, ?, ?, ?)")
      .run(userId, symbol, assetType, notes, now());
    return Number(result.lastInsertRowid);
  }

  async createTaxLienProperty(userId: number, propertyRef: string, county: string, notes: string): Promise<number> {
    const result = this.db
      .prepare("INSERT INTO tax_lien_properties(user_id, property_ref, county, notes, created_at) VALUES(?, ?, ?, ?, ?)")
      .run(userId, propertyRef, county, notes, now());
    return Number(result.lastInsertRowid);
  }

  async createRecipe(userId: number, recipeName: string, steps: string): Promise<number> {
    const result = this.db
      .prepare("INSERT INTO recipes(user_id, recipe_name, steps, created_at) VALUES(?, ?, ?, ?)")
      .run(userId, recipeName, steps, now());
    return Number(result.lastInsertRowid);
  }

  async startLiveSession(userId: number, sessionType: LiveSessionType, notes?: string): Promise<LiveSession> {
    this.db
      .prepare("UPDATE live_sessions SET status = 'ended', ended_at = ? WHERE user_id = ? AND status = 'active'")
      .run(now(), userId);

    const result = this.db
      .prepare(
        "INSERT INTO live_sessions(user_id, session_type, status, current_step, notes, started_at, ended_at) VALUES(?, ?, 'active', 1, ?, ?, NULL)",
      )
      .run(userId, sessionType, notes ?? null, now());

    return this.db.prepare("SELECT * FROM live_sessions WHERE id = ?").get(Number(result.lastInsertRowid)) as LiveSession;
  }

  async getActiveLiveSession(userId: number): Promise<LiveSession | null> {
    const result = this.db
      .prepare("SELECT * FROM live_sessions WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1")
      .get(userId) as LiveSession | undefined;
    return result ?? null;
  }

  async advanceLiveSessionStep(userId: number, notes?: string): Promise<LiveSession | null> {
    const current = await this.getActiveLiveSession(userId);
    if (!current) {
      return null;
    }

    this.db
      .prepare("UPDATE live_sessions SET current_step = ?, notes = COALESCE(?, notes) WHERE id = ?")
      .run(current.current_step + 1, notes ?? null, current.id);

    return (await this.getActiveLiveSession(userId)) as LiveSession;
  }

  async stopLiveSession(userId: number, notes?: string): Promise<LiveSession | null> {
    const current = await this.getActiveLiveSession(userId);
    if (!current) {
      return null;
    }

    const endTime = now();
    this.db
      .prepare("UPDATE live_sessions SET status = 'ended', ended_at = ?, notes = COALESCE(?, notes) WHERE id = ?")
      .run(endTime, notes ?? null, current.id);

    return this.db.prepare("SELECT * FROM live_sessions WHERE id = ?").get(current.id) as LiveSession;
  }
}
