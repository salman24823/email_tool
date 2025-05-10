'use client';

import { useState } from 'react';
import { Button, Card, Checkbox } from '@heroui/react';
import { Send } from 'lucide-react';

export default function Compose() {
  const [isChecked, setIsChecked] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleCheckboxChange = async () => {
    setIsChecked(!isChecked);
    if (!isChecked) {
      setIsSending(true);
      try {
        // Predefined email subject and HTML body
        const subject = 'Your Email Campaign Subject';
        const htmlBody = `
          <html>
            <body>
              <h1>Hello!</h1>
              <p>This is a sample email campaign.</p>
            </body>
          </html>
        `;
        const interval = '1000'; // Default interval: 1000ms (1 email/sec)

        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('body', htmlBody);
        formData.append('interval', interval);

        const res = await fetch('/api/handleMail', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Failed to send emails');
          setIsChecked(false);
          return;
        }

        alert(`${data.sent} emails sent successfully!`);
        console.log('Response:', data);
      } catch (err) {
        console.error('Failed to send emails', err);
        alert('An unexpected error occurred. Please try again.');
        setIsChecked(false);
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Compose Campaign</h1>
          <p className="text-slate-500 mt-1">Send bulk emails to all users in audience CSVs</p>
        </div>
        <div className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-sm font-medium">
          Draft Mode
        </div>
      </div>

      {/* Checkbox to Trigger Campaign */}
      <Card className="overflow-hidden border-slate-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-600 h-1"></div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
              <Checkbox
                checked={isChecked}
                onChange={handleCheckboxChange}
                disabled={isSending}
              />
              <span>Send bulk emails to all users in audience CSVs</span>
            </label>
            <p className="text-xs text-slate-500">
              Emails will be sent to all valid email addresses in CSV files located in the audience folder with a 1-second interval.
            </p>
          </div>

          {/* Submit Button (Optional, for manual trigger) */}
          <Button
            onPress={handleCheckboxChange}
            disabled={isSending || !isChecked}
            className="w-full py-6 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all"
          >
            <Send className="mr-2 h-4 w-4" />
            {isSending ? 'Sending Campaign...' : 'Start Campaign'}
          </Button>
        </div>
      </Card>
    </div>
  );
}