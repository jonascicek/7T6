import React from 'react'
import PageLayout from '../components/PageLayout'

export default function ImpressumPage() {
  return (
    <PageLayout withFooter containerClassName="bg-neutral-950 text-white" mainClassName="pb-20">
      <section className="px-6 lg:px-8 py-14 md:py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm tracking-[0.18em] uppercase text-neutral-500 mb-4">Rechtliches</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-8">Impressum</h1>

          <div className="space-y-8 text-neutral-300 leading-relaxed">
            <section>
              <h2 className="text-white text-lg mb-3">Angaben gemaess § 5 DDG</h2>
              <p className="mt-3">
                Ilhan Cicek<br />
                Kamillenweg 2<br />
                33161 Hoevelhof<br />
                Deutschland
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">Kontakt</h2>
              <p>
                Telefon: +49 5257/934225<br />
                E-Mail: info@ctv-sport.de
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">Inhaltlich verantwortlich</h2>
              <p>
                Verantwortlich fuer journalistisch-redaktionelle Inhalte gemaess § 18 Abs. 2 MStV:<br />
                Ilhan Cicek, Anschrift wie oben
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">Haftung fuer Inhalte</h2>
              <p>
                Die Inhalte dieser Website wurden mit groesster Sorgfalt erstellt. Fuer die Richtigkeit,
                Vollstaendigkeit und Aktualitaet der Inhalte kann jedoch keine Gewaehr uebernommen werden.
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">Haftung fuer Links</h2>
              <p>
                Diese Website enthaelt Links zu externen Websites Dritter, auf deren Inhalte kein Einfluss besteht.
                Deshalb kann fuer diese fremden Inhalte auch keine Gewaehr uebernommen werden.
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">Urheberrecht</h2>
              <p>
                Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
                deutschen Urheberrecht. Beitraege Dritter sind als solche gekennzeichnet.
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">EU-Streitbeilegung</h2>
              <p>
                Die Europaeische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                https://ec.europa.eu/consumers/odr/
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">Verbraucherstreitbeilegung</h2>
              <p>
                Es besteht keine Verpflichtung und keine Bereitschaft zur Teilnahme an einem
                Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle.
              </p>
            </section>

          </div>
        </div>
      </section>
    </PageLayout>
  )
}
