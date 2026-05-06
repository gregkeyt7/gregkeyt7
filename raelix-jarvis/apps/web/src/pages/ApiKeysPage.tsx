import { Panel } from "../components/Panel";

export const ApiKeysPage = () => {
  return (
    <Panel title="API Key Placeholders" subtitle="Keep secrets in backend .env, never in frontend code">
      <div className="grid gap-2 text-sm">
        {[
          "OPENAI_API_KEY=",
          "GEMINI_API_KEY=",
          "ANTHROPIC_API_KEY=",
          "OLLAMA_BASE_URL=http://localhost:11434",
          "GMAIL_CLIENT_ID=",
          "GMAIL_CLIENT_SECRET=",
          "TWILIO_ACCOUNT_SID=",
          "TWILIO_AUTH_TOKEN=",
          "TWILIO_PHONE_NUMBER=",
        ].map((value) => (
          <code key={value} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200">
            {value}
          </code>
        ))}
      </div>
    </Panel>
  );
};
