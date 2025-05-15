"use client"
import { SessionProvider } from "next-auth/react"
import 'react-toastify/dist/ReactToastify.css';

export default function SessionWrapper({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}