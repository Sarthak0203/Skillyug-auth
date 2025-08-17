import { useState } from 'react'
import './App.css'
import { Route, Router, Routes } from 'react-router-dom'
import Login from './pages/Login'
import SignupForm from './pages/Signup'
import Navbar from './components/Navbar'

function App() {

  return (
      <div className="min-h-screen w-full bg-gradient-to-br from-black via-blue-900 to-blue-800">
        <Navbar />
        <Routes>
          <Route path="/sign-up" element={<SignupForm/>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
       )
}

export default App
