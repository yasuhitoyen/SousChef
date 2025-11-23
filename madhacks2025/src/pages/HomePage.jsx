import React from 'react'
import { Link } from 'react-router-dom'

const HomePage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#E8DDC8] hover:shadow-xl transition-shadow">
        <Link to='/select' className="block">
          <div className="flex items-center justify-between">
            <div>
              <h4 className='text-2xl font-bold text-[#2C2416] mb-2'>Find Recipes!</h4>
              <p className="text-[#5A4A3A]">Scan your ingredients and discover delicious recipes</p>
            </div>
            <div className="text-4xl">→</div>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default HomePage