import { BarChart, ChevronDown, Home, Mail, Send, Settings } from 'lucide-react'
import React from 'react'

const SideBar = () => {
    return (
        <div className="col-span-2 bg-white border-r border-slate-200 shadow-sm p-4 flex flex-col h-screen sticky top-0">
            <div className="mb-6">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-600 p-1.5 rounded-md">
                        <Mail className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-700 to-blue-700 bg-clip-text text-transparent">
                        MailCaster
                    </span>
                </h1>
            </div>

            <nav className="space-y-1 flex-1">
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-700 font-medium transition-colors hover:bg-blue-100">
                    <Home className="w-4 h-4" />
                    Dashboard
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors">
                    <Send className="w-4 h-4" />
                    Campaigns
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors">
                    <BarChart className="w-4 h-4" />
                    Analytics
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors">
                    <Settings className="w-4 h-4" />
                    Settings
                </a>
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-600 flex items-center justify-center text-white font-medium">
                        MC
                    </div>
                    <div>
                        <p className="text-sm font-medium">MailCaster Pro</p>
                        <p className="text-xs text-slate-500">v1.2.0</p>
                    </div>
                    <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                </div>
            </div>
        </div>
    )
}

export default SideBar