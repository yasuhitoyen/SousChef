import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { motion } from 'framer-motion'

const Layout = () => {
  return (
    <>
      <Navbar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-20 min-h-screen bg-[#d4e0ed]"
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </motion.main>
    </>
  )
}

export default Layout
