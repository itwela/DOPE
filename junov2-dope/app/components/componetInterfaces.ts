import { Agent } from "../providers/AgentProvider";
import { Id } from "../../convex/_generated/dataModel";

interface Thread {
  _id: string;
  _creationTime: number;
  userId?: string;
  title?: string;
  summary?: string;
  status: "active" | "archived";
}

interface AgentCardProps {
  agent: Agent;
  currentAgent: Agent | null;
  onSelect: (agent: Agent) => void;
  onEdit: (agent: Agent, e: React.MouseEvent) => void;
  onOpenKnowledgeBase: (agent: Agent, e: React.MouseEvent) => void;
  recentThreads: Thread[];
  onSelectThread: (agent: Agent, threadId: string) => void;
  onDeleteThread: (threadId: string, e: React.MouseEvent, threadTitle?: string) => Promise<void>;
  onToggleExpanded: (agentId: string, e: React.MouseEvent) => void;
  currentThreadId: string | null;
  isExpanded: boolean;
  threadCount: number;
  startNewThread: () => void;
  isLoadingThreads: boolean;
}

interface KnowledgeBaseModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

interface KnowledgeBaseEntry {
  _id: Id<"knowledgeBaseEntries">;
  _creationTime: number;
  agentId: Id<"agents">;
  type: "file" | "text";
  title: string;
  content?: string;
  fileId?: Id<"_storage">;
  fileName?: string;
  fileType?: string;
  ragEntryId?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  preview: string;
}

type ModalMode = 'list' | 'add-text' | 'add-file' | 'add-transcript' | 'view';


export type { Thread, AgentCardProps, KnowledgeBaseModalProps, KnowledgeBaseEntry, ModalMode };
