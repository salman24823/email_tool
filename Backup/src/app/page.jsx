'use client';

import { useState, useRef } from 'react';
import { Button, Card, Input, Textarea } from "@heroui/react";
import { Mail, Paperclip, Send } from "lucide-react";

export default function Compose() {
  const [csvFile, setCsvFile] = useState("");
  const [subject, setSubject] = useState('');
  const [interval, setInterval] = useState('');
  const [htmlBody, setHtmlBody] = useState('');

  const [activeTab, setActiveTab] = useState('compose');
  const fileInputRef = useRef(null);

  const handleSubmit = async () => {
    const formData = new FormData();
    if (csvFile) formData.append("file", csvFile);
    formData.append("subject", subject);
    formData.append("body", htmlBody);
    formData.append("interval", interval);

    try {
      const res = await fetch("/api/handleMail", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to send emails");
        return;
      }

      alert(`${data.sent} emails sent successfully!`);
      console.log("Response:", data);
    } catch (err) {
      console.error("Failed to send emails", err);
      alert("An unexpected error occurred. Please try again.");
    }
  };




  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Compose Campaign</h1>
          <p className="text-slate-500 mt-1">Create and send your email campaign</p>
        </div>
        <div className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-sm font-medium">
          Draft Mode
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-200">
        <div className="flex space-x-8">
          {['compose', 'preview', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium ${activeTab === tab
                ? 'text-blue-700 border-b-2 border-blue-700'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card className="overflow-hidden border-slate-200">
              <div className="bg-gradient-to-r from-blue-600 to-blue-600 h-1"></div>
              <div className="p-6 space-y-6">

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Email List (CSV)</label>
                  <div
                    className="flex items-center justify-center gap-2 px-6 py-8 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-slate-50 group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="p-2 rounded-full bg-slate-100 group-hover:bg-blue-100 transition-colors">
                      <Paperclip className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="space-y-1 text-center">
                      <span className="text-sm font-medium text-slate-700">
                        {csvFile ? csvFile.name : 'Click to upload CSV file'}
                      </span>
                      <p className="text-xs text-slate-500">CSV with email, name columns</p>
                    </div>
                  </div>
                  
                  <Input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setCsvFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <div className="border-t border-slate-200 my-6"></div>

                {/* Subject */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Email Subject</label>
                  <Input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter a compelling subject line"
                  />
                </div>

                {/* HTML Body */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="block text-sm font-medium text-slate-700">Email Body (HTML)</label>
                    <span className="text-xs text-slate-500">Supports full HTML & CSS</span>
                  </div>
                  <Textarea
                    value={htmlBody}
                    onChange={(e) => setHtmlBody(e.target.value)}
                    rows={15}
                    placeholder="Paste complete HTML content including <style> here"
                    className="font-mono text-sm"
                  />
                </div>

                {/* Interval */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Send Interval (ms)</label>
                  <Input
                    type="number"
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    placeholder="e.g., 1000 for 1 email/sec"
                  />
                  <p className="text-xs text-slate-500">Recommended: 1000ms+ to avoid rate limiting</p>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  className="w-full py-6 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Upload & Start Campaign
                </Button>
              </div>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <Card className="border-slate-200 h-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-600 h-1"></div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-slate-700">Live Preview</h3>
                    </div>
                    <div className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Isolated</div>
                  </div>
                  <div className="border border-slate-200 rounded-lg shadow-inner bg-white h-[calc(100vh-300px)] overflow-hidden">
                    <iframe
                      title="Email Preview"
                      sandbox=""
                      className="w-full h-full border-0"
                      srcDoc={
                        htmlBody || `<p style="color:#999;text-align:center;margin-top:2rem">Your email preview will appear here.</p>`
                      }
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <Card className="border-slate-200">
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Full Preview</h3>
            <div className="border rounded-lg overflow-hidden min-h-[500px]">
              <iframe
                title="Full Email Preview"
                sandbox=""
                className="w-full h-[500px] border-0"
                srcDoc={
                  htmlBody || `<p style="color:#999;text-align:center;margin-top:2rem">Your full preview will appear here.</p>`
                }
              />
            </div>
          </div>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card className="border-slate-200">
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Campaign Settings</h3>
            <p className="text-slate-500">Additional settings will appear here</p>
          </div>
        </Card>
      )}
    </div>
  );
}
