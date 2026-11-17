import React, { useState } from 'react';
import { Category } from '../../types';
import { formatCurrency } from '../../services/currency';
import {
  draftSmartTarget,
  evaluateTargetPriorities,
  validateAdvisoryTone,
  SmartTargetDraft,
} from '../../services/goalCopilot';
import { storage } from '../../services/storage';
import { Send, Bot, Sparkles, CheckCircle2, Shield } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  draftTarget?: SmartTargetDraft | null;
  actionChips?: string[];
  timestamp: number;
}

interface GoalCopilotChatProps {
  categories: Category[];
  currentMonthKey: string;
  onTargetCreated?: () => void;
}

export const GoalCopilotChat: React.FC<GoalCopilotChatProps> = ({
  categories,
  currentMonthKey,
  onTargetCreated,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Hallo! Ich bin dein KI-Finanzbegleiter. Ich helfe dir dabei, persönliche Sparziele greifbar zu machen, Ausgabenpotenziale zu prüfen und Ziele ohne Druck zu priorisieren. Was möchtest du heute angehen?',
      actionChips: [
        'Neues Sparziel für Urlaub planen',
        'Sparziel für Gravelbike anlegen',
        'Sparziele nach Dringlichkeit prüfen',
        'Geschützte Lebensqualität verwalten',
      ],
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      respondToMessage(text);
      setIsTyping(false);
    }, 400);
  };

  const respondToMessage = (userText: string) => {
    const lower = userText.toLowerCase();

    // 1. Goal Refinement / Planning a new goal
    if (
      lower.includes('ziel') ||
      lower.includes('urlaub') ||
      lower.includes('bike') ||
      lower.includes('rad') ||
      lower.includes('anlegen') ||
      lower.includes('sparen für')
    ) {
      const draft = draftSmartTarget(userText, currentMonthKey);
      let reply = '';
      if (draft) {
        reply = `Klingt nach einem wunderbaren Vorhaben! Ich habe dein Ziel nach der SMART-Methode strukturiert: **${draft.categoryName}** mit **${formatCurrency(draft.amountCents)}** bis zum **${draft.dueDate}**.\n\nDas entspricht einer monatlichen Sparrate von **${formatCurrency(draft.monthlyQuotaCents)}**. Möchtest du dieses Ziel direkt in deinem Budget anlegen?`;
      } else {
        reply = 'Gerne helfe ich dir, dieses Vorhaben zu planen! Welchen Betrag peilst du ungefähr an und bis zu welchem Monat möchtest du dein Ziel erreicht haben?';
      }

      // Verify tone compliance
      validateAdvisoryTone(reply);

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          draftTarget: draft,
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    // 2. Goal Prioritization
    if (
      lower.includes('priorit') ||
      lower.includes('dringlich') ||
      lower.includes('konflikt') ||
      lower.includes('übersteigen') ||
      lower.includes('reihenfolge')
    ) {
      const evalResult = evaluateTargetPriorities(categories, 35000, currentMonthKey);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: evalResult.supportiveAdviceMarkdown,
          actionChips: [
            'Notgroschen Vorrang geben',
            'Zieldaten um 2 Monate strecken',
          ],
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    // 3. Protected Categories
    if (lower.includes('geschützt') || lower.includes('lebensqualität') || lower.includes('schutz')) {
      const protectedCats = categories.filter((c) => c.isProtected);
      let reply = '';
      if (protectedCats.length === 0) {
        reply = 'Aktuell hast du noch keine Kategorie als „Geschützte Lebensqualität“ markiert. Du kannst jeden Ausgabenbereich im Detailbereich mit dem Schild-Symbol schützen – dann schlägt die KI hier niemals Kürzungen vor.';
      } else {
        reply = `Folgende ${protectedCats.length} Kategorien sind aktuell als **geschützte Lebensqualität** markiert und vor Sparhebeln geschützt:\n\n` +
          protectedCats.map((c) => `• 🛡️ **${c.name}**`).join('\n') +
          '\n\nDeine Lebensqualität hat stets Vorrang.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    // Default supportive response
    const defaultReply = 'Ich unterstütze dich gerne bei der Ausgabenoptimierung und deinen Sparzielen. Du kannst mir jederzeit formlos deine Pläne beschreiben (z.B. „Ich brauche 1.500 € für eine Weiterbildung“) oder Fragen zu deinen aktuellen Hebeln stellen.';
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: defaultReply,
        actionChips: [
          'Sparziel für Sommerurlaub anlegen',
          'Sparziele priorisieren',
        ],
        timestamp: Date.now(),
      },
    ]);
  };

  const handleCreateTargetFromDraft = (draft: SmartTargetDraft) => {
    // 1. Create or find category
    let existingCat = categories.find(
      (c) => c.name.toLowerCase() === draft.categoryName.toLowerCase()
    );

    if (!existingCat) {
      // Find a group like 'Wünsche & Freizeit' or first group
      const groups = storage.getCategoryGroups();
      const targetGroup = groups.find((g) => g.name.includes('Wünsche')) || groups[0];
      if (targetGroup) {
        existingCat = storage.addCategory(targetGroup.id, draft.categoryName);
      }
    }

    if (existingCat) {
      storage.setCategoryTarget(existingCat.id, {
        targetType: draft.targetType,
        amountCents: draft.amountCents,
        dueDate: draft.dueDate,
        rolloverAction: 'set_aside',
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-confirm-${Date.now()}`,
          sender: 'assistant',
          text: `✅ Ziel **${draft.categoryName}** (${formatCurrency(draft.amountCents)}) wurde erfolgreich in deinem Budget angelegt! Du findest es ab sofort in der Monatsplanung.`,
          timestamp: Date.now(),
        },
      ]);

      if (onTargetCreated) onTargetCreated();
    }
  };

  return (
    <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl p-5 flex flex-col h-[520px] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--nothing-border)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] flex items-center justify-center text-[#D71921]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--nothing-text)]">
                ZIEL-COPILOT
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1e612a] dark:bg-[#ADEBB3]" />
            </div>
            <span className="font-mono text-[9px] text-[var(--nothing-muted)] uppercase tracking-wider block">
              Beratend & Unterstützend • Keine Bevormundung
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--nothing-muted)] bg-[var(--nothing-subsurface)] px-2.5 py-1 rounded-full border border-[var(--nothing-border)]">
          <Shield className="w-3 h-3 text-[#1e612a] dark:text-[#ADEBB3]" />
          <span>Lokal & Privat</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-[var(--nothing-text)] text-[var(--nothing-bg)] rounded-br-xs font-medium'
                  : 'bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] rounded-bl-xs'
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>

              {/* Draft Target Proposal Card */}
              {msg.draftTarget && (
                <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl p-3 space-y-2 mt-2 text-[var(--nothing-text)]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)]">
                      Ziel-Vorschlag (SMART)
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#ADEBB3]/15 text-[#1e612a] dark:text-[#ADEBB3] border border-[#ADEBB3]/30">
                      Bereit
                    </span>
                  </div>
                  <div className="font-mono font-bold text-xs">{msg.draftTarget.categoryName}</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="text-[var(--nothing-muted)] block text-[9px]">Zielsumme</span>
                      <span className="font-bold tabular-nums">
                        {formatCurrency(msg.draftTarget.amountCents)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--nothing-muted)] block text-[9px]">Monatliche Sparrate</span>
                      <span className="font-bold tabular-nums text-[#1e612a] dark:text-[#ADEBB3]">
                        {formatCurrency(msg.draftTarget.monthlyQuotaCents)}/M
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCreateTargetFromDraft(msg.draftTarget!)}
                    className="w-full py-2 bg-[#D71921] hover:opacity-90 text-white rounded-full font-mono text-[10px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-opacity cursor-pointer mt-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ziel im Budget anlegen</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Action Chips */}
            {msg.actionChips && msg.actionChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                {msg.actionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-mono text-[var(--nothing-text)] bg-[var(--nothing-subsurface)] hover:bg-[var(--nothing-border)] border border-[var(--nothing-border)] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-[#D71921]" />
                    <span>{chip}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1 text-[var(--nothing-muted)] font-mono text-[11px] px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--nothing-muted)] animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--nothing-muted)] animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--nothing-muted)] animate-bounce [animation-delay:0.4s]" />
            <span className="ml-1 text-[10px]">KI denkt nach...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="pt-3 border-t border-[var(--nothing-border)] flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Frag nach Einsparmöglichkeiten oder formuliere ein Ziel..."
          className="flex-1 bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-full px-4 py-2 text-xs text-[var(--nothing-text)] placeholder-[var(--nothing-muted)] focus:outline-none focus:border-[var(--nothing-text)] transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-8 h-8 rounded-full bg-[#D71921] text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
