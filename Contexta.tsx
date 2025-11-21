
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, ChatHistory } from '../../types';
import { getChatResponse, getSuggestions, summarizeHistory } from '../../services/Vulmora AI Service';
import Spinner from '../common/Spinner';
import Message from '../common/Message';
import { SendIcon, PaperclipIcon, CloseIcon, PlusIcon, TrashIcon, CheckIcon } from '../Icons';
import { useSettings } from '../../contexts/SettingsContext';

const CHAT_HISTORY_KEY = 'cognira-contexta-chats';
const ACTIVE_CHAT_ID_KEY = 'cognira-contexta-activeChatId';

// Constants for context summarization
const CONTEXT_SUMMARY_THRESHOLD = 12; // Start summarizing when history has this many messages
const MESSAGES_TO_SUMMARIZE_COUNT = 8; // Take this many older messages to create a summary from

const Contexta: React.FC = () => {
  const { settings } = useSettings();

  const [histories, setHistories] = useState<ChatHistory[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load chat history:", e);
      return [];
    }
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_CHAT_ID_KEY) || null;
  });

  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionTimeoutRef = useRef<number | null>(null);

  // Persist histories and active chat ID to localStorage
  useEffect(() => {
    if (settings.saveHistory) {
      try {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(histories));
      } catch (e) {
        console.error("Failed to save chat history:", e);
      }
    }
  }, [histories, settings.saveHistory]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem(ACTIVE_CHAT_ID_KEY, activeChatId);
    } else {
      localStorage.removeItem(ACTIVE_CHAT_ID_KEY);
    }
  }, [activeChatId]);


  // Initialize chat or set active chat
  useEffect(() => {
    if (histories.length === 0) {
      createNewChat();
    } else if (!activeChatId || !histories.some(h => h.id === activeChatId)) {
      setActiveChatId(histories[0]?.id || null);
    }
  }, []);


  const activeMessages = useMemo(() => {
    return histories.find(h => h.id === activeChatId)?.messages || [];
  }, [histories, activeChatId]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [activeMessages]);
  
  // Effect for fetching suggestions
  useEffect(() => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    
    if (input.trim().length > 10 && !editingMessageId) {
      setIsSuggesting(true);
      suggestionTimeoutRef.current = window.setTimeout(async () => {
        const historyForApi = histories.find(h => h.id === activeChatId)?.messages || [];
        const fetchedSuggestions = await getSuggestions(historyForApi, input);
        // Only update if the input hasn't changed while fetching
        if (input.trim().length > 10) {
          setSuggestions(fetchedSuggestions);
        }
        setIsSuggesting(false);
      }, 750); // 750ms debounce
    } else {
      setSuggestions([]);
      setIsSuggesting(false);
    }

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };

  }, [input, activeChatId, histories, editingMessageId]);


  const createNewChat = () => {
    const newChatId = crypto.randomUUID();
    const newChat: ChatHistory = {
      id: newChatId,
      title: "New Chat",
      messages: [
        { id: crypto.randomUUID(), role: 'model', content: 'Hello! I am Velmora AI, an intelligent assistant. How can I help you today?' }
      ]
    };
    setHistories(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);
  };

  const deleteHistory = (idToDelete: string) => {
    const newHistories = histories.filter(h => h.id !== idToDelete);
    
    if (activeChatId === idToDelete) {
        setActiveChatId(newHistories.length > 0 ? newHistories[0].id : null);
    }
    setHistories(newHistories);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/') && file.size > 50 * 1024 * 1024) { // 50MB limit for videos
        alert("Video file is too large. Please select a video under 50MB.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setAttachedFile(file);
    }
  };
  
  const handleEdit = (messageId: string) => {
    const messageToEdit = activeMessages.find(m => m.id === messageId);
    if (messageToEdit) {
      setInput(messageToEdit.content);
      setAttachedFile(null); // Editing with files not supported, clear attachment
      setEditingMessageId(messageId);
      setSuggestions([]);
      inputRef.current?.focus();
    }
  };

  const handleReport = (messageId: string) => {
    const messageIndex = activeMessages.findIndex(m => m.id === messageId);
    if (messageIndex > 0) {
      const messageToReport = activeMessages[messageIndex];
      const previousMessage = activeMessages[messageIndex - 1];
      
      console.log("--- ISSUE REPORT ---");
      console.log("Reported Message (Model):", messageToReport.content);
      if(previousMessage.role === 'user') {
          console.log("Preceding Query (User):", previousMessage.content);
      }
      console.log("--------------------");

      alert("Thank you for your feedback. The issue has been logged for review.");
    } else {
      alert("Thank you for your feedback.");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setInput('');
    setSuggestions([]);
  };

  const handleSend = async () => {
    if (!activeChatId || (input.trim() === '' && !attachedFile) || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      ...(attachedFile && { file: { name: attachedFile.name, type: attachedFile.type } })
    };

    if (editingMessageId) {
        const editIndex = activeMessages.findIndex(m => m.id === editingMessageId);
        if (editIndex === -1) return;
        const historyForApi = activeMessages.slice(0, editIndex);
        const updatedMessages = [...historyForApi, userMessage];
        
        setHistories(prev => prev.map(h => h.id === activeChatId ? { ...h, messages: updatedMessages } : h));
        setIsLoading(true);
        setInput('');
        setEditingMessageId(null);
        
        try {
            const response = await getChatResponse(historyForApi, userMessage.content, null); // no file on edit
            const modelMessage: ChatMessage = { id: crypto.randomUUID(), role: 'model', content: response };
            setHistories(prev => prev.map(h => h.id === activeChatId ? { ...h, messages: [...updatedMessages, modelMessage] } : h));
        } catch (error) {
            const errorMessageText = error instanceof Error ? error.message : 'An unknown error occurred.';
            const errorMessage: ChatMessage = { id: crypto.randomUUID(), role: 'model', content: errorMessageText };
            setHistories(prev => prev.map(h => h.id === activeChatId ? { ...h, messages: [...updatedMessages, errorMessage] } : h));
        } finally {
            setIsLoading(false);
        }
        return;
    }

    // --- Regular message sending with summarization logic ---
    const currentChatHistory = histories.find(h => h.id === activeChatId)?.messages || [];
    const updatedMessagesWithUser = [...currentChatHistory, userMessage];
    
    setHistories(prev => prev.map(h => 
      h.id === activeChatId 
        ? { ...h, messages: updatedMessagesWithUser, title: h.title === 'New Chat' ? input.substring(0, 25) : h.title } 
        : h
    ));

    const currentInput = input;
    const currentFile = attachedFile;
    setInput('');
    setAttachedFile(null);
    setSuggestions([]);
    if(fileInputRef.current) fileInputRef.current.value = "";
    setIsLoading(true);
    
    let historyForApi = [...currentChatHistory];
    let finalHistoryForUi = updatedMessagesWithUser;

    try {
      if (currentChatHistory.length >= CONTEXT_SUMMARY_THRESHOLD) {
          const welcomeMessage = currentChatHistory[0];
          const messagesToSummarize = currentChatHistory.slice(1, MESSAGES_TO_SUMMARIZE_COUNT + 1);
          const recentMessages = currentChatHistory.slice(MESSAGES_TO_SUMMARIZE_COUNT + 1);

          const summary = await summarizeHistory(messagesToSummarize);
          
          const summaryMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'model',
              content: `[Summary of earlier conversation:\n${summary}]`
          };
          
          historyForApi = [welcomeMessage, summaryMessage, ...recentMessages];
          finalHistoryForUi = [welcomeMessage, summaryMessage, ...recentMessages, userMessage];
          
          // Update the UI to show the summarized state
          setHistories(prev => prev.map(h => 
              h.id === activeChatId ? { ...h, messages: finalHistoryForUi } : h
          ));
      }

      const response = await getChatResponse(historyForApi, currentInput, currentFile);
      const modelMessage: ChatMessage = { id: crypto.randomUUID(), role: 'model', content: response };
       
      setHistories(prev => prev.map(h => 
          h.id === activeChatId 
            ? { ...h, messages: [...finalHistoryForUi, modelMessage] } 
            : h
       ));
    } catch (error) {
      const errorMessageText = error instanceof Error ? error.message : 'An unknown error occurred.';
      const errorMessage: ChatMessage = { id: crypto.randomUUID(), role: 'model', content: errorMessageText };
       setHistories(prev => prev.map(h => 
          h.id === activeChatId 
            ? { ...h, messages: [...finalHistoryForUi, errorMessage] } 
            : h
       ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applySuggestion = (suggestion: string) => {
    setInput(suggestion);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="h-full flex bg-[var(--background-primary)] rounded-xl shadow-2xl overflow-hidden border border-[var(--border-primary)]">
      {/* Sidebar for Chat History */}
      <div className="w-64 bg-[var(--background-primary)] border-r border-[var(--border-primary)] flex flex-col p-2">
        <button onClick={createNewChat} className="flex items-center justify-center gap-2 w-full p-2 mb-4 rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] transition-colors">
            <PlusIcon className="w-5 h-5" />
            New Chat
        </button>
        <div className="flex-1 overflow-y-auto space-y-2">
            {histories.map(h => (
                <div key={h.id} 
                     onClick={() => setActiveChatId(h.id)}
                     className={`group flex justify-between items-center w-full text-left p-2 rounded-lg cursor-pointer transition-colors ${activeChatId === h.id ? 'bg-[var(--background-secondary)]' : 'hover:bg-[var(--background-secondary)]'}`}>
                    <p className="text-sm text-[var(--text-primary)] truncate flex-1">{h.title}</p>
                    <button onClick={(e) => {e.stopPropagation(); deleteHistory(h.id);}} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-[var(--border-primary)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Contexta Room</h2>
            <p className="text-sm text-[var(--text-muted)]">Intelligent Conversational Agent</p>
          </div>
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {activeMessages.map((msg) => (
              <Message 
                key={msg.id} 
                id={msg.id} 
                role={msg.role} 
                content={msg.content} 
                file={msg.file} 
                onEdit={msg.role === 'user' ? handleEdit : undefined}
                onReport={msg.role === 'model' ? handleReport : undefined}
              />
            ))}
            {isLoading && <Message role="model" content={<Spinner />} id={crypto.randomUUID()} />}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--background-secondary)]">
             {(isSuggesting || suggestions.length > 0) && (
              <div className="mb-3 p-3 bg-[var(--background-primary)] rounded-lg">
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-2">
                  {isSuggesting && !suggestions.length && <Spinner />}
                  <span className="font-semibold">Suggestions</span>
                </div>
                 <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <button 
                        key={i} 
                        onClick={() => applySuggestion(s)}
                        className="text-xs bg-[var(--border-primary)] text-[var(--text-primary)] px-3 py-1.5 rounded-full hover:bg-[var(--text-muted)] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                 </div>
              </div>
            )}
            {attachedFile && (
              <div className="mb-2 flex items-center justify-between bg-[var(--border-primary)] text-[var(--text-primary)] text-sm px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <PaperclipIcon className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span className="truncate">{attachedFile.name}</span>
                </div>
                <button onClick={() => setAttachedFile(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex items-center space-x-4">
               <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
               <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="text-[var(--text-secondary)] p-2 rounded-full hover:bg-[var(--border-primary)] transition-colors duration-200"
                aria-label="Attach file"
               >
                <PaperclipIcon className="h-6 w-6" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message or attach a file..."
                disabled={isLoading}
                className="flex-1 bg-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-4 py-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
              {editingMessageId && (
                 <button onClick={handleCancelEdit} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm p-2 rounded-lg hover:bg-[var(--border-primary)]">
                   Cancel
                 </button>
              )}
              <button
                onClick={handleSend}
                disabled={isLoading || (!activeChatId) || (input.trim() === '' && !attachedFile)}
                className="bg-[var(--accent-primary)] text-white p-3 rounded-full hover:bg-[var(--accent-primary-hover)] transition-colors duration-200 disabled:bg-[var(--text-muted)] disabled:cursor-not-allowed"
                aria-label={editingMessageId ? "Save changes" : "Send message"}
              >
                {editingMessageId ? <CheckIcon className="h-5 w-5" /> : <SendIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Contexta;
