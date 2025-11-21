


import React, { useState, FC } from 'react';
import {
  VelmoraIcon, ImagixIcon, AudivoxIcon, MoveraIcon, FactoraIcon, MaploraIcon,
  PromptixIcon, ContextaIcon, ScanalyticaIcon,
  FlashbotIcon, VidsummaIcon, AudiscriptIcon, ThinkoraIcon, AetheriaIcon,
  SunIcon, MoonIcon, LogoutIcon
} from './components/Icons';
import { useSettings } from './contexts/SettingsContext';


// Import room components
import Contexta from './components/rooms/Contexta';
import Thinkora from './components/rooms/Thinkora';
import Vidsumma from './components/rooms/Vidsumma';
import Factora from './components/rooms/Factora';
import Flashbot from './components/rooms/Flashbot';
import Audiscript from './components/rooms/Audiscript';
import Scanalytica from './components/rooms/Scanalytica';
import Imagix from './components/rooms/Imagix';
import Audivox from './components/rooms/Audivox';
import Movera from './components/rooms/Movera';
import Maplora from './components/rooms/Maplora';
import Promptix from './components/rooms/Promptix';
import Login from './components/auth/Login';
import Aetheria from './components/rooms/Aetheria';


type RoomID =
  | 'contexta' | 'thinkora' | 'vidsumma' | 'factora' | 'flashbot' | 'audiscript'
  | 'scanalytica' | 'imagix' | 'audivox' | 'movera' | 'maplora' | 'promptix'
  | 'aetheria';

interface NavItemProps {
  Icon: FC<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: FC<NavItemProps> = ({ Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full text-left p-3 rounded-lg transition-colors duration-200 ${
      isActive ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'hover:bg-[var(--background-secondary)] text-[var(--text-secondary)]'
    }`}
  >
    <Icon className="h-6 w-6 mr-4 flex-shrink-0" />
    <span className="font-medium truncate">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [activeRoom, setActiveRoom] = useState<RoomID>('contexta');
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('isLoggedIn') === 'true');
  const { settings, updateSetting } = useSettings();

  const handleLoginSuccess = () => {
    sessionStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    window.location.reload();
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }


  const rooms: { id: RoomID; label: string; Icon: FC<{ className?: string }>; Component: FC }[] = [
    { id: 'contexta', label: 'Contexta', Icon: ContextaIcon, Component: Contexta },
    { id: 'aetheria', label: 'Aetheria', Icon: AetheriaIcon, Component: Aetheria },
    { id: 'imagix', label: 'Imagix', Icon: ImagixIcon, Component: Imagix },
    { id: 'audivox', label: 'Audivox', Icon: AudivoxIcon, Component: Audivox },
    { id: 'movera', label: 'Movera', Icon: MoveraIcon, Component: Movera },
    { id: 'promptix', label: 'Promptix', Icon: PromptixIcon, Component: Promptix },
    { id: 'thinkora', label: 'Thinkora', Icon: ThinkoraIcon, Component: Thinkora },
    { id: 'flashbot', label: 'Flashbot', Icon: FlashbotIcon, Component: Flashbot },
    { id: 'vidsumma', label: 'Vidsumma', Icon: VidsummaIcon, Component: Vidsumma },
    { id: 'scanalytica', label: 'Scanalytica', Icon: ScanalyticaIcon, Component: Scanalytica },
    { id: 'audiscript', label: 'Audiscript', Icon: AudiscriptIcon, Component: Audiscript },
    { id: 'factora', label: 'Factora', Icon: FactoraIcon, Component: Factora },
    { id: 'maplora', label: 'Maplora', Icon: MaploraIcon, Component: Maplora },
  ];

  const ActiveComponent = rooms.find(r => r.id === activeRoom)?.Component || Contexta;

  return (
    <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-secondary)] flex flex-col">
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <nav className="w-full md:w-64 bg-[var(--background-primary)] border-b md:border-b-0 md:border-r border-[var(--border-primary)] p-4 flex-shrink-0 flex flex-col">
          <div className="flex items-center mb-8">
            <div className="p-2 rounded-lg bg-white">
              <VelmoraIcon className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold ml-3 text-[var(--text-primary)]">Velmora</h1>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto pr-2 -mr-2">
            {rooms.map(({ id, label, Icon }) => (
              <NavItem
                key={id}
                Icon={Icon}
                label={label}
                isActive={activeRoom === id}
                onClick={() => setActiveRoom(id)}
              />
            ))}
          </div>
          <div className="flex-shrink-0 pt-4 mt-4 border-t border-[var(--border-primary)] space-y-2">
            <button
                onClick={() => updateSetting('theme', settings.theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center w-full text-left p-3 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--text-secondary)] transition-colors duration-200"
            >
                {settings.theme === 'dark' ? <SunIcon className="h-6 w-6 mr-4 flex-shrink-0" /> : <MoonIcon className="h-6 w-6 mr-4 flex-shrink-0" />}
                <span className="font-medium">
                    Switch to {settings.theme === 'dark' ? 'Light' : 'Dark'} Mode
                </span>
            </button>
             <button
                onClick={handleLogout}
                className="flex items-center w-full text-left p-3 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--text-secondary)] transition-colors duration-200"
            >
                <LogoutIcon className="h-6 w-6 mr-4 flex-shrink-0" />
                <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
};

export default App;