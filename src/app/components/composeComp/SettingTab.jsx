// SettingTab.jsx
import { Card } from '@heroui/react';
import { Settings } from 'lucide-react';

const SettingTab = () => {
  return (
    <Card className="border-slate-200">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-slate-700" />
          <h3 className="text-lg font-medium">Campaign Settings</h3>
        </div>
        <p className="text-slate-500">Additional settings will appear here</p>
        {/* Add more settings inputs as needed */}
      </div>
    </Card>
  );
};

export default SettingTab;