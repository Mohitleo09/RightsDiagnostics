'use client'

import * as React from "react"
import Navbar from './Patients/page'
import Hero from './Patients/hero/page'
import Category from './Patients/Category/page'
import HowItWorks from './Patients/HowItWorks/page'
import Packages from './Patients/packages/page'
import Footer from './Patients/footer/page'

export default function Home() {
  return (
    <main className="min-h-[60vh] p-0">
      <Navbar />
      <Hero />
      <Category />
      <Packages />
      <HowItWorks />
      <Footer />
    </main>
  )
}
