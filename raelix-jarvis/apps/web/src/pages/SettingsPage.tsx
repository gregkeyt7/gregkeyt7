import { Panel } from "../components/Panel";
import type { BootstrapPayload } from "../lib/types";

const modeDescriptions: Record<string, string> = {
  family: "Gentle and supportive family-first assistance.",
  kids: "Child-safe and creative responses for bedtime stories.",
  business: "Priority on productivity, strategy, and execution.",
  developer: "Focused on coding support, architecture, and automation.",
};

const roleDescriptions: Record<string, string> = {
  admin: "Full control across all systems and tools.",
  family: "Trusted family member with day-to-day capabilities.",
  child: "Restricted mode with family-safe responses.",
  guest: "Limited access for visitors and demos.",
};

interface SettingsPageProps {
  bootstrap: BootstrapPayload | null;
  mode: string;
  role: string;
  userName: string;
  onModeChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onUserNameChange: (value: string) => void;
  onReload: () => void;
}

export const SettingsPage = ({
  bootstrap,
  mode,
  role,
  userName,
  onModeChange,
  onRoleChange,
  onUserNameChange,
  onReload,
}: SettingsPageProps) => {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Mode Controls" subtitle="Family mode, kids mode, business mode, developer mode">
        <div className="grid gap-2">
          <label className="text-sm text-slate-300">Mode</label>
          <select
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={mode}
            onChange={(event) => onModeChange(event.target.value)}
          >
            {bootstrap?.availableModes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400">{modeDescriptions[mode]}</p>

          <label className="mt-2 text-sm text-slate-300">Role</label>
          <select
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={role}
            onChange={(event) => onRoleChange(event.target.value)}
          >
            {bootstrap?.availableRoles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400">{roleDescriptions[role]}</p>

          <label className="mt-2 text-sm text-slate-300">Display Name</label>
          <input
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={userName}
            onChange={(event) => onUserNameChange(event.target.value)}
          />

          <button className="mt-2 rounded-xl bg-glow px-4 py-2 text-sm font-semibold" onClick={onReload} type="button">
            Reload Profile Context
          </button>
        </div>
      </Panel>

      <Panel title="Provider Status" subtitle="AI and communication readiness checks">
        <div className="space-y-2">
          {bootstrap?.providers.map((provider) => (
            <div key={provider.name} className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm">
              <p className="font-medium">{provider.name}</p>
              <p className="text-xs text-slate-400">{provider.reason}</p>
            </div>
          ))}
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm">
            Gmail integration: {bootstrap?.communication.gmailReady ? "Configured" : "Placeholder only"}
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm">
            Twilio integration: {bootstrap?.communication.twilioReady ? "Configured" : "Placeholder only"}
          </div>
        </div>
      </Panel>
    </div>
  );
};
