// Compose.jsx
"use client";
import { useState } from 'react';
import Header from '@/app/components/composeComp/Header'; 
import SettingTab from '@/app/components/composeComp/SettingTab'; 
import PreviewTab from '@/app/components/composeComp/PreviewTab'; 
import ComposeComp from '@/app/components/composeComp/ComposeComp'; 

export default function Compose() {
  const [activeTab, setActiveTab] = useState('compose');
  
  // Add state for sharing between components
  const [htmlBody, setHtmlBody] = useState('');
  const [subject, setSubject] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [interval, setInterval] = useState('');

  return (
    <div className="flex-1 p-6">
      <Header />
      <div className="mb-6 border-b border-slate-200">
        <div className="flex space-x-8">
          {['compose', 'preview', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium ${
                activeTab === tab
                  ? 'text-blue-700 border-b-2 border-blue-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'compose' && (
        <ComposeComp 
          htmlBody={htmlBody}
          setHtmlBody={setHtmlBody}
          subject={subject}
          setSubject={setSubject}
          csvFile={csvFile}
          setCsvFile={setCsvFile}
          interval={interval}
          setInterval={setInterval}
        />
      )}
      {activeTab === 'preview' && <PreviewTab htmlBody={htmlBody} />}
      {activeTab === 'settings' && <SettingTab />}
    </div>
  );
}