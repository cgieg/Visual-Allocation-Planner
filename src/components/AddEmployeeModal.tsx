import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ProjectRole } from '../store/useStore';

interface Props {
  title: string;
  onClose: () => void;
  onAdd: (data: { name: string, role: string }) => void;
}

const ROLES: ProjectRole[] = ['Proxy PO', 'Scrum Master', 'SWE Frontend', 'SWE Backend', 'Architekt', 'UI/UX Designer', 'Test Consultant', 'Test Engineer'];

export const AddEmployeeModal: React.FC<Props> = ({ title, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>(ROLES[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), role });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-textMain">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
            <X strokeWidth={1.5} size={20} className="text-textMuted" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-textMain mb-1">Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none shadow-sm"
              placeholder="Vor- und Nachname"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textMain mb-1">Rolle</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none shadow-sm appearance-none"
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-textMuted hover:bg-gray-100 rounded-lg transition-colors border border-transparent"
            >
              Abbrechen
            </button>
            <button 
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primaryHover rounded-lg shadow-sm transition-colors disabled:opacity-50 border border-transparent"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
