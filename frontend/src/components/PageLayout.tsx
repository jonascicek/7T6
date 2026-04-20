import React from 'react'
import Header from './Header'
import Footer from './Footer'

interface PageLayoutProps {
  children: React.ReactNode
  withFooter?: boolean
  containerClassName?: string
  mainClassName?: string
}

export default function PageLayout({
  children,
  withFooter = false,
  containerClassName = '',
  mainClassName = '',
}: PageLayoutProps) {
  return (
    <div className={`min-h-screen ${containerClassName}`.trim()}>
      <Header />
      <main className={`pt-20 ${mainClassName}`.trim()}>{children}</main>
      {withFooter ? <Footer /> : null}
    </div>
  )
}
