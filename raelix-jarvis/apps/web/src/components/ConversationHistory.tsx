import { Panel } from "./Panel";

interface ConversationItem {
  id: number;
  title: string;
  updated_at: string;
}

interface ConversationHistoryProps {
  conversations: ConversationItem[];
  activeConversationId?: number;
  onSelect: (conversationId: number) => void;
}

export const ConversationHistory = ({
  conversations,
  activeConversationId,
  onSelect,
}: ConversationHistoryProps) => {
  return (
    <Panel title="Conversation History" subtitle="Stored chat sessions from memory">
      <div className="max-h-72 space-y-2 overflow-auto">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            className={`w-full rounded-xl border p-3 text-left text-sm ${
              activeConversationId === conversation.id
                ? "border-neon/50 bg-slate-900"
                : "border-slate-700 bg-slate-900/70"
            }`}
            type="button"
            onClick={() => onSelect(conversation.id)}
          >
            <p className="font-medium">{conversation.title || `Conversation #${conversation.id}`}</p>
            <p className="text-xs text-slate-400">{new Date(conversation.updated_at).toLocaleString()}</p>
          </button>
        ))}
        {conversations.length === 0 ? <p className="text-sm text-slate-400">No conversations yet.</p> : null}
      </div>
    </Panel>
  );
};
