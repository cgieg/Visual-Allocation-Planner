import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import { ProjectRole, PipelineProject, RequiredPosition } from '../store/useStore';

interface Props {
  onClose: () => void;
  onAdd: (project: PipelineProject) => void;
}

const ROLES: ProjectRole[] = ['Proxy PO', 'Scrum Master', 'SWE Frontend', 'SWE Backend', 'Architekt', 'UI/UX Designer', 'Test Consultant', 'Test Engineer'];

const PROJECT_COLORS = [
  '#008bd2', '#059669', '#7c3aed', '#d97706', '#dc2626', '#0891b2', '#4f46e5', '#be185d'
];

const generateMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 15; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    options.push({ value: `${year}-${month}`, label: `${month}/${year}` });
  }
  return options;
};

export const AddPipelineProjectModal: React.FC<Props> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedStart, setEstimatedStart] = useState('');
  const [estimatedEnd, setEstimatedEnd] = useState('');
  const [contactPlatform, setContactPlatform] = useState('');
  const [contactDepartment, setContactDepartment] = useState('');
  const [deliveryLead, setDeliveryLead] = useState('');
  const [positions, setPositions] = useState<{ role: ProjectRole; count: number; percentage: number }[]>([]);

  const addPosition = () => {
    // Find first role not yet added, or default to SWE
    const availableRole = ROLES.find(r => !positions.some(p => p.role === r)) || 'SWE Frontend';
    setPositions([...positions, { role: availableRole, count: 1, percentage: 100 }]);
  };

  const removePosition = (index: number) => {
    setPositions(positions.filter((_, i) => i !== index));
  };

  const updatePosition = (index: number, field: 'role' | 'count' | 'percentage', value: string | number) => {
    setPositions(positions.map((p, i) => {
      if (i !== index) return p;
      if (field === 'role') return { ...p, role: value as ProjectRole };
      if (field === 'percentage') return { ...p, percentage: Number(value) || 0 };
      return { ...p, count: Number(value) || 1 };
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
    const color = PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];

    const requiredPositions: RequiredPosition[] = positions.map(p => ({
      id: generateId(),
      role: p.role,
      count: p.count,
      percentage: p.percentage,
      assignedPersons: []
    }));

    const project: PipelineProject = {
      id: generateId(),
      name: name.trim(),
      client: client.trim(),
      description: description.trim(),
      stage: 'opportunity',
      requiredPositions,
      estimatedStart,
      estimatedEnd,
      color,
      createdAt: new Date().toISOString(),
      contactPlatform: contactPlatform.trim(),
      contactDepartment: contactDepartment.trim(),
      deliveryLead: deliveryLead.trim(),
    };

    onAdd(project);
    onClose();
  };

  return createPortal(
    <div 
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in-up"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-textMain">Neues Pipeline-Projekt</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X strokeWidth={1.5} size={18} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-textMain mb-1.5">Projektname *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="z.B. Enterprise Cloud Migration"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
              required
            />
          </div>

          {/* Bereich (client) */}
          <div>
            <label className="block text-xs font-semibold text-textMain mb-1.5">Kundenbereich / Abteilung</label>
            <input
              type="text"
              value={client}
              onChange={e => setClient(e.target.value)}
              placeholder="z.B. Service & Support"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Delivery Lead */}
          <div>
            <label className="block text-xs font-semibold text-textMain mb-1.5">Delivery Lead</label>
            <input
              type="text"
              value={deliveryLead}
              onChange={e => setDeliveryLead(e.target.value)}
              placeholder="z.B. Max Mustermann"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-textMain mb-1.5">Ansprechpartner Anfrage-Kanal</label>
              <input
                type="text"
                value={contactPlatform}
                onChange={e => setContactPlatform(e.target.value)}
                placeholder="z.B. Erika Muster"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-textMain mb-1.5">Ansprechpartner im Bereich</label>
              <input
                type="text"
                value={contactDepartment}
                onChange={e => setContactDepartment(e.target.value)}
                placeholder="z.B. John Doe"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-textMain mb-1.5">Beschreibung</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Kurze Projektbeschreibung..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y overflow-y-auto max-h-48"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-textMain mb-1.5">Geschätzter Start</label>
              <input
                type="date"
                value={estimatedStart}
                onChange={e => setEstimatedStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-textMain mb-1.5">Laufzeit Ende</label>
              <select
                value={estimatedEnd}
                onChange={e => setEstimatedEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">Bitte wählen</option>
                {generateMonthOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Required Positions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-textMain">Benötigte Rollen</label>
              <button
                type="button"
                onClick={addPosition}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <Plus strokeWidth={1.5} size={12} />
                Rolle hinzufügen
              </button>
            </div>

            {positions.length === 0 && (
              <p className="text-xs text-textMuted py-3 text-center border border-dashed border-gray-200 rounded-lg">
                Noch keine Rollen definiert. Rollen können auch später hinzugefügt werden.
              </p>
            )}

            <div className="space-y-2">
              {positions.map((pos, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                  <select
                    value={pos.role}
                    onChange={e => updatePosition(index, 'role', e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={pos.percentage ?? pos.count * 100}
                      onChange={e => updatePosition(index, 'percentage', parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1.5 border border-gray-200 rounded-md text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="text-xs text-textMuted">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePosition(index)}
                    className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 strokeWidth={1.5} size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-textMuted hover:text-textMain hover:bg-gray-50 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primaryHover transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Projekt anlegen
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
