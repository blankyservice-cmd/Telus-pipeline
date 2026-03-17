"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { LogOut, Phone, User } from "lucide-react";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="bg-telus text-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight leading-none">
                Telus Pipeline
              </h1>
              <p className="text-xs text-white/60 mt-0.5">Sales Call Tracker</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {status === "authenticated" && session?.user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-white/80">
                  <User className="w-4 h-4" />
                  <span>{session.user.name}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : status === "unauthenticated" ? (
              <button
                onClick={() => signIn("google")}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white text-telus hover:bg-white/90 transition-colors cursor-pointer"
              >
                Sign in with Google
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
