import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

const Layout = () => {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#F7F3E9]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </>
  )
}

export default Layout
