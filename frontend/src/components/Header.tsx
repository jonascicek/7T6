import React, { useState } from 'react'
import { Link, useLocation } from '../lib/router'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-neutral-900">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="relative flex items-center justify-end h-24 md:h-28">
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 inline-flex items-center justify-center h-[68px] w-[68px] md:h-[84px] md:w-[84px] overflow-hidden"
            aria-label="Zur Startseite"
          >
            <img
              src="/logo-7t6.jpeg"
              alt="7T6 Logo"
              className="h-full w-full object-contain scale-[1.42]"
            />
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <Link
              to="/"
              className={`text-sm tracking-[0.2em] transition-colors ${
                location.pathname === '/' ? 'text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              JOURNAL
            </Link>
          </div>

          <button
            className="md:hidden text-white"
            aria-label="Menu"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-6 flex flex-col gap-4 text-sm tracking-[0.18em]">
            <Link to="/" className="text-neutral-300 hover:text-white" onClick={() => setMobileOpen(false)}>
              JOURNAL
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
