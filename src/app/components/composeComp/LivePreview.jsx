// LivePreview.jsx
import { Card } from '@heroui/react';
import { Mail } from 'lucide-react';

const LivePreview = ({ htmlBody }) => {
  return (
    <div className="">
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
                sandbox="allow-same-origin"
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
  );
};

export default LivePreview;