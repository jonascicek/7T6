import React from 'react'
import PageLayout from '../components/PageLayout'
import { Link } from '../lib/router'

export default function NotFoundPage() {
  return (
    <PageLayout containerClassName="bg-neutral-950 text-white" mainClassName="pb-20">
      <section className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-center max-w-xl">
          <p className="text-xs tracking-[0.26em] uppercase text-neutral-500 mb-4">404</p>
          <h1 className="font-display text-5xl md:text-6xl tracking-wide mb-5">Seite nicht gefunden</h1>
          <p className="text-neutral-300 mb-8">
            Diese Route existiert nicht oder wurde verschoben.
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-3 bg-white text-black text-sm tracking-[0.16em] hover:bg-neutral-200 transition"
          >
            Zur Startseite
          </Link>
        </div>
      </section>
    </PageLayout>
  )
}
