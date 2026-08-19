import React from 'react'
import PageLayout from '../components/PageLayout'

export default function DatenschutzPage() {
  return (
    <PageLayout withFooter containerClassName="bg-neutral-950 text-white" mainClassName="pb-20">
      <section className="px-6 lg:px-8 py-14 md:py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm tracking-[0.18em] uppercase text-neutral-500 mb-4">Rechtliches</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-8">Datenschutzerklaerung</h1>

          <div className="space-y-8 text-neutral-300 leading-relaxed">
            <section>
              <h2 className="text-white text-lg mb-3">1. Verantwortliche Stelle</h2>
              <p className="mt-3">
                Ilhan Cicek<br />
                Kamillenweg 2<br />
                33161 Hoevelhof<br />
                Deutschland<br />
                E-Mail: info@ctv-sport.de<br />
                Telefon: +49 5257/934225
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">2. Zwecke und Rechtsgrundlagen der Verarbeitung</h2>
              <p>
                Personenbezogene Daten werden verarbeitet, soweit dies fuer die Bereitstellung einer funktionsfaehigen
                Website, die Sicherheit des Betriebs und die Bearbeitung von Anfragen erforderlich ist. Rechtsgrundlagen
                sind insbesondere Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem und stabilem Betrieb),
                Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche/vertragliche Kommunikation) sowie Art. 6 Abs. 1 lit. c DSGVO
                (gesetzliche Verpflichtungen).
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">3. Hosting und Server-Logfiles</h2>
              <p>
                Beim Aufruf dieser Website werden technisch erforderliche Daten verarbeitet, zum Beispiel IP-Adresse,
                Datum/Uhrzeit, aufgerufene URL, Referrer und User-Agent. Diese Daten dienen der Stabilitaet,
                Sicherheit, Fehleranalyse und Missbrauchsabwehr.
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">4. Technisch notwendige Cookies</h2>
              <p>
                Diese Website verwendet technisch notwendige Cookies, die fuer zentrale Funktionen und die sichere
                Bereitstellung des Angebots erforderlich sind. Die Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO,
                bei gesetzlicher Erforderlichkeit zusaetzlich § 25 Abs. 2 TDDDG.
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">5. Kontaktaufnahme</h2>
              <p>
                Wenn du per E-Mail Kontakt aufnimmst, werden die uebermittelten Angaben inklusive der
                Kontaktdaten zur Bearbeitung der Anfrage gespeichert. Die Verarbeitung erfolgt auf Grundlage
                von Art. 6 Abs. 1 lit. b DSGVO und/oder Art. 6 Abs. 1 lit. f DSGVO.
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">6. Medien und bereitgestellte Inhalte</h2>
              <p>
                Bereitgestellte Medieninhalte werden verarbeitet und gespeichert, soweit dies fuer die Darstellung
                des Angebots erforderlich ist. Es sollten keine sensiblen personenbezogenen Daten in Medieninhalten
                enthalten sein.
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">7. Empfaenger und Weitergabe von Daten</h2>
              <p>
                Eine Weitergabe personenbezogener Daten an externe Dritte erfolgt nicht, sofern dies nicht
                zur Vertragserfuellung erforderlich ist, eine gesetzliche Verpflichtung besteht oder eine
                ausdrueckliche Einwilligung vorliegt.
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">8. Speicherdauer</h2>
              <p>
                Personenbezogene Daten werden nur so lange gespeichert, wie es fuer den jeweiligen Zweck
                erforderlich ist. Danach werden Daten geloescht, sofern keine gesetzlichen Aufbewahrungsfristen
                oder sonstigen berechtigten Gruende fuer eine laengere Speicherung bestehen.
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">9. Betroffenenrechte</h2>
              <p>
                Du hast das Recht auf Auskunft, Berichtigung, Loeschung, Einschraenkung der Verarbeitung,
                Datenuebertragbarkeit sowie Widerspruch gegen bestimmte Verarbeitungen. Zudem besteht das Recht,
                eine erteilte Einwilligung mit Wirkung fuer die Zukunft zu widerrufen.
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">10. Beschwerderecht bei einer Aufsichtsbehoerde</h2>
              <p>
                Du hast das Recht, dich bei einer Datenschutzaufsichtsbehoerde zu beschweren,
                wenn du der Ansicht bist, dass die Verarbeitung deiner personenbezogenen Daten
                rechtswidrig erfolgt.
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">11. Datensicherheit</h2>
              <p>
                Es werden angemessene technische und organisatorische Massnahmen umgesetzt, um personenbezogene
                Daten gegen Verlust, Manipulation und unberechtigten Zugriff zu schuetzen. Bei der
                Uebertragung werden dem Stand der Technik entsprechende Sicherheitsmechanismen eingesetzt.
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg mb-3">12. Stand und Aktualisierung</h2>
              <p>Stand: August 2026. Diese Datenschutzerklaerung wird bei rechtlichen oder technischen Aenderungen aktualisiert.</p>
            </section>

            <p className="text-sm text-neutral-500 pt-4 border-t border-neutral-800">
              Diese Datenschutzerklaerung gilt fuer das aktuelle Online-Angebot und wird bei Bedarf aktualisiert.
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
