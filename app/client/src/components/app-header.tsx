import { useState } from 'react';
import { useAuth } from '../auth';
import { SidebarTrigger } from './ui/sidebar';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BellIcon, SearchIcon, UserIcon, LogOutIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AppHeader() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[#E3E8E4] bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-[#111714] hover:bg-[#F4F7F4]" />
        <Separator orientation="vertical" className="h-4 bg-[#E3E8E4]" />
        <div className="relative w-64 md:w-80">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-[#69736E]" />
          <Input
            type="search"
            placeholder="Search quotations, POs, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-[#F4F7F4] border-[#E3E8E4] focus:bg-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="size-8 text-[#69736E] hover:text-[#111714]">
          <BellIcon className="size-4" />
        </Button>
        <Separator orientation="vertical" className="h-4 bg-[#E3E8E4]" />
        {user && (
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-[#003B2B] text-white flex items-center justify-center text-xs font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[#111714]">{user.username}</span>
              <span className="text-[10px] text-[#69736E] uppercase font-semibold">{user.role}</span>
            </div>
            <Button size="icon" variant="ghost" onClick={logout} title="Logout" className="size-8 text-[#69736E] hover:text-[#ba1a1a]">
              <LogOutIcon className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
