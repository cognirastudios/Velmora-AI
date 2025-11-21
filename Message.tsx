

import React, { FC, ReactNode } from 'react';
import { VelmoraIcon, UserIcon, PaperclipIcon, EditIcon, FlagIcon } from '../Icons';
import { ChatMessage } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';

interface MessageProps extends Omit<ChatMessage, 'content'> {
    content: ReactNode;
    id: string;
    onEdit?: (id: string) => void;
    onReport?: (id: string) => void;
}

const Message: FC<MessageProps> = ({ role, content, file, id, onEdit, onReport }) => {
  const { settings } = useSettings();
  const isModel = role === 'model';
  const isUser = role === 'user';

  const bubble = (
    <div
      className={`max-w-md lg:max-w-2xl px-5 py-3 rounded-2xl flex flex-col ${
        isModel ? 'bg-[var(--background-secondary)] text-[var(--text-primary)] rounded-tl-none items-start' : 'bg-[var(--accent-primary)] text-white rounded-br-none items-end'
      }`}
    >
      {file && (
        <div className="mb-2 flex items-center gap-2 border border-[var(--border-primary)] bg-[var(--background-primary)] px-3 py-1.5 rounded-lg text-sm">
           <PaperclipIcon className="h-4 w-4" />
           <span>{file.name}</span>
        </div>
      )}
      <div className={`prose ${settings.theme === 'dark' ? 'prose-invert' : ''} text-[var(--text-primary)] text-sm whitespace-pre-wrap ${isModel ? 'text-left' : 'text-right'}`}>{content}</div>
    </div>
  );

  const editButton = isUser && onEdit && (
    <button onClick={() => onEdit(id)} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-secondary)] hover:text-[var(--text-primary)] self-center">
      <EditIcon className="w-4 h-4" />
    </button>
  );

  const reportButton = isModel && onReport && (
    <button onClick={() => onReport(id)} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-secondary)] hover:text-[var(--text-primary)] self-center ml-2">
        <FlagIcon className="w-4 h-4" />
    </button>
  );

  return (
    <div className={`group flex items-start gap-4 ${isModel ? '' : 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isModel ? 'bg-white' : 'bg-[var(--text-muted)]'}`}>
          {isModel ? <VelmoraIcon className="h-6 w-6" /> : <UserIcon className="h-6 w-6 text-white" />}
      </div>
      <div className="flex items-center gap-2">
         {isUser ? <>{editButton}{bubble}</> : <>{bubble}{reportButton}</>}
      </div>
    </div>
  );
};

export default Message;