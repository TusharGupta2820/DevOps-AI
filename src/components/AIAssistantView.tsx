import React, { useState, useRef, useEffect } from 'react';
import { ChatHistoryItem, ChatMessage, NavigationPath } from '../types';
import { BRAND_ASSETS } from '../data/mockData';

interface AIAssistantViewProps {
  chatHistory: ChatHistoryItem[];
  onNavigate: (path: NavigationPath) => void;
  onOpenTopologyModal: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  chatHistory,
  onNavigate,
  onOpenTopologyModal,
}) => {
  const [historyItems, setHistoryItems] = useState<ChatHistoryItem[]>(chatHistory);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: "Hello. I'm analyzing the recent alerts. It looks like we had a critical event on prod-server-01 at 3:00 AM. How can I help you investigate?",
      timestamp: '03:14 AM',
    },
    {
      id: 'msg-2',
      sender: 'user',
      text: 'Why did the production deployment fail at 3:00 AM?',
      timestamp: '03:15 AM',
    },
    {
      id: 'msg-3',
      sender: 'ai',
      text: 'Based on the system logs and trace telemetry from `prod-server-01`, HikariPool-1 reached 100% capacity (20/20 active connections). The user-authentication service timed out after 30,000ms waiting for an open connection.\n\n**Root Cause:** A sudden burst in login traffic at 03:00 AM caused worker thread starvation. I recommend expanding the HikariCP max pool size to 50 or scaling `user-service` to 8 replicas.',
      timestamp: '03:15 AM',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');
  const [showTraceModal, setShowTraceModal] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsThinking(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages,
        }),
      });

      const data = await response.json();

      setIsThinking(false);

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: data.response || 'Analyzed infrastructure logs.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Connection error while communicating with AI DevOps Copilot. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleSelectHistory = (id: string) => {
    setHistoryItems((prev) =>
      prev.map((item) => ({ ...item, active: item.id === id }))
    );
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-4rem)] bg-slate-50">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Conversation History */}
        <aside className="w-72 flex-shrink-0 bg-white flex flex-col pt-4 overflow-y-auto border-r border-slate-200">
          <div className="px-4 pb-3">
            <h2 className="text-sm font-bold text-slate-800 mb-3">
              History
            </h2>
            <div className="relative mb-2">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                className="w-full bg-slate-100 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Search chats..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
            {historyItems
              .filter((h) => h.title.toLowerCase().includes(searchHistory.toLowerCase()))
              .map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectHistory(item.id)}
                  className={`group relative px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    item.active
                      ? 'bg-blue-50 text-blue-900 border border-blue-200/60'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
                  )}
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`material-symbols-outlined text-lg mt-0.5 ${
                        item.active ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    >
                      chat
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs truncate ${
                          item.active ? 'font-bold text-blue-950' : 'font-medium'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {item.timeAgo}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </aside>

        {/* Center: Main Chat Interface */}
        <main className="flex-1 flex flex-col bg-white relative z-10 shadow-xs">
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 max-w-3xl mx-auto w-full ${
                  msg.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {msg.sender === 'ai' ? (
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm text-white">
                    <span className="material-symbols-outlined text-lg">
                      smart_toy
                    </span>
                  </div>
                ) : (
                  <img
                    alt="User Avatar"
                    className="w-9 h-9 rounded-full object-cover shadow-sm flex-shrink-0 border border-slate-200"
                    src={BRAND_ASSETS.avatar}
                  />
                )}

                <div
                  className={`flex-1 rounded-2xl p-4 shadow-xs text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none ml-12'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
                  }`}
                >
                  <p className="whitespace-pre-line">
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}

            {/* AI Thinking State */}
            {isThinking && (
              <div className="flex items-start gap-3 max-w-3xl mx-auto w-full">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm text-white">
                  <span className="material-symbols-outlined text-lg animate-spin">
                    sync
                  </span>
                </div>
                <div className="flex-1 bg-slate-100 border border-slate-200/60 rounded-2xl rounded-tl-none p-4 shadow-xs flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <span>Analyzing logs and telemetry...</span>
                  </div>
                  <div className="space-y-2 w-full pt-1">
                    <div className="h-2 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-2 bg-slate-200 rounded w-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-white border-t border-slate-200 relative z-20">
            <div className="max-w-3xl mx-auto relative">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 flex items-center p-2 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:bg-white transition-all shadow-xs">
                <button 
                  onClick={() => handleSendMessage("Analyze HikariCP connection pool metrics.")}
                  className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-xl hover:bg-slate-200/60 flex-shrink-0 cursor-pointer"
                  title="Attach telemetry context"
                >
                  <span className="material-symbols-outlined text-xl">attach_file</span>
                </button>

                <textarea
                  className="flex-1 bg-transparent border-none focus:outline-none resize-none py-1.5 px-3 text-sm text-slate-800 placeholder:text-slate-400 max-h-32 min-h-[40px] overflow-y-auto"
                  placeholder="Ask Copilot anything about your infrastructure..."
                  rows={1}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                ></textarea>

                <button
                  onClick={() => handleSendMessage()}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm flex-shrink-0 ml-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">
                    send
                  </span>
                </button>
              </div>

              <div className="text-center mt-2">
                <span className="text-[11px] text-slate-400">
                  AI Copilot can make mistakes. Consider verifying important infrastructure changes.
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Context Panel */}
        <aside className="w-80 flex-shrink-0 bg-slate-50 flex flex-col border-l border-slate-200 z-20 overflow-y-auto p-4 space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                Active Context
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Incident Response
              </h3>
            </div>

            <div className="bg-white rounded-xl p-3 flex items-center justify-between border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-800">
                  System Status
                </span>
              </div>
              <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold border border-red-200">
                Degraded
              </span>
            </div>

            <div className="space-y-4">
              {/* Selected Node */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">dns</span> Target Node
                </h4>
                <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-xs">
                  <p className="text-xs font-bold text-slate-800 truncate mb-1">
                    prod-server-01
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span> 10.4.22.105
                  </p>
                </div>
              </div>

              {/* Recent Error */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span> Recent Error
                </h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 relative overflow-hidden">
                  <p className="text-xs font-bold text-red-700 mb-1">
                    Connection Timeout
                  </p>
                  <p className="text-xs text-slate-600">
                    PostgreSQL DB instance failed to respond within 30000ms.
                  </p>
                  <button
                    onClick={() => setShowTraceModal(true)}
                    className="mt-2 text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    View full trace <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </button>
                </div>
              </div>

              {/* Metrics Snippet */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">analytics</span> Metrics
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                    <span className="text-xl font-extrabold text-slate-900 block">
                      12
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Active Containers
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                    <span className="text-xl font-extrabold text-red-600 block">
                      98%
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      CPU Usage
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Topology Map Widget */}
          <div className="pt-2">
            <div
              onClick={onOpenTopologyModal}
              className="h-28 rounded-xl bg-cover bg-center overflow-hidden relative shadow-sm group cursor-pointer border border-slate-200"
              style={{ backgroundImage: `url('${BRAND_ASSETS.topologyMapCard}')` }}
            >
              <div className="absolute inset-0 bg-slate-900/60"></div>
              <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center text-white">
                <span className="text-xs font-bold">
                  Topology Map
                </span>
                <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">
                  fullscreen
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Trace Modal */}
      {showTraceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-xl max-w-2xl w-full p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-red-400 text-base flex items-center gap-2">
                <span className="material-symbols-outlined">bug_report</span> Trace Stack: Connection Timeout
              </h3>
              <button
                onClick={() => setShowTraceModal(false)}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="bg-black/60 p-3 rounded-lg font-mono text-xs text-red-300 space-y-1 overflow-x-auto max-h-80 border border-slate-800">
              <p className="font-bold text-red-400">java.sql.SQLTransientConnectionException: HikariPool-1 - Connection is not available, request timed out after 30000ms.</p>
              <p>  at com.zaxxer.hikari.pool.HikariPool.createTimeoutException(HikariPool.java:696)</p>
              <p>  at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:197)</p>
              <p>  at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:162)</p>
              <p>  at com.example.service.UserService.authenticate(UserService.java:84)</p>
            </div>
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => { setShowTraceModal(false); onNavigate('logs'); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer hover:bg-blue-700"
              >
                <span className="material-symbols-outlined text-sm">terminal</span> Open Log Analyzer
              </button>
              <button
                onClick={() => setShowTraceModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg font-bold text-xs cursor-pointer hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
