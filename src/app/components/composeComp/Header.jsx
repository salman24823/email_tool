// Header.jsx
import { FileText } from 'lucide-react';

const Header = () => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Compose Campaign</h1>
        <p className="text-slate-500 mt-1">Create and send your email campaign</p>
      </div>
      <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-sm font-medium">
        <FileText className="w-4 h-4" />
        Draft Mode
      </div>
    </div>
  );
};

export default Header;