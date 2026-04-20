import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-black/80 text-white border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="font-display text-4xl tracking-[0.2em] mb-4">7T6</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Premium Fashion Journal.<br />
              Kuratierte Kollektionen und exklusive Drops.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium tracking-[0.18em] mb-4 text-neutral-300">NAVIGATION</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-neutral-400 hover:text-white transition">
                  Journal
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-sm text-neutral-400 hover:text-white transition">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium tracking-[0.18em] mb-4 text-neutral-300">NEWSLETTER</h4>
            <p className="text-sm text-neutral-400 mb-4">
              Erhalte Updates zu neuen Drops.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="E-Mail"
                className="flex-1 px-4 py-2 bg-neutral-900 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition"
              />
              <button className="px-6 py-2 bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">
                →
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} 7T6. Alle Rechte vorbehalten.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-neutral-500 hover:text-white transition text-sm">
              Instagram
            </a>
            <a href="#" className="text-neutral-500 hover:text-white transition text-sm">
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
