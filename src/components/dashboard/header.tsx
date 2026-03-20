'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './sidebar';

export function Header() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const initials = session?.user?.name?.slice(0, 2) || session?.user?.email?.slice(0, 2) || '??';

  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-neutral-800 bg-neutral-950 p-0">
            <Sidebar className="h-full" />
          </SheetContent>
        </Sheet>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-neutral-300 hover:bg-neutral-800 hover:text-white">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-blue-600 text-xs text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm sm:inline">{session?.user?.name || '사용자'}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 border-neutral-700 bg-neutral-900">
          <DropdownMenuItem className="text-neutral-300 focus:bg-neutral-800 focus:text-white">
            {session?.user?.email}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-neutral-700" />
          <DropdownMenuItem
            className="text-red-400 focus:bg-neutral-800 focus:text-red-300"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
