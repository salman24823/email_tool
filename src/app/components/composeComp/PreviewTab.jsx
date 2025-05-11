// PreviewTab.jsx
import { Card } from '@heroui/react';
import { Eye } from 'lucide-react';

const PreviewTab = ({ htmlBody }) => {
  return (
    <Card className="border-slate-200">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-slate-700" />
          <h3 className="text-lg font-medium">Full Preview</h3>
        </div>
        <div className="border rounded-lg overflow-hidden min-h-[500px]">
          <iframe
            title="Full Email Preview"
            sandbox="allow-same-origin"
            className="w-full h-[500px] border-0"
            srcDoc={
              htmlBody || `<p style="color:#999;text-align:center;margin-top:2rem">Your full preview will appear here.</p>`
            }
          />
        </div>
      </div>
    </Card>
  );
};

export default PreviewTab;