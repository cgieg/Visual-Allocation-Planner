import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore, Project, ProjectRole, RequiredPosition } from '../store/useStore';
import { X, Save, ShieldAlert, Sparkles, Users, Plus, Trash2 } from 'lucide-react';

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

interface Props {
  project: Project;
  onClose: () => void;
}

export const ProjectTeamModal: React.FC<Props> = ({ project, onClose }) => {
  const updateProject = useStore(state => state.updateProject);
  
  const [formData, setFormData] = useState({
    teamRisks: '',
    riskImpact: '-',
    riskSeverity: '-',
    teamPotentials: '',
    client: project.client || '',
    deliveryLead: project.deliveryLead || '',
    contactPlatform: project.contactPlatform || '',
    contactDepartment: project.contactDepartment || '',
    estimatedStart: project.estimatedStart || '',
    estimatedEnd: project.estimatedEnd || '',
    description: project.description || '',
  });

  const [requiredPositions, setRequiredPositions] = useState<RequiredPosition[]>(
    project.requiredPositions || []
  );

  const handleAddPosition = () => {
    const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
    const ROLES: ProjectRole[] = ['Proxy PO', 'Scrum Master', 'SWE Frontend', 'SWE Backend', 'Architekt', 'UI/UX Designer', 'Test Consultant', 'Test Engineer'];
    const availableRole = ROLES.find(r => !requiredPositions.some(p => p.role === r)) || 'SWE Frontend';
    const newPos: RequiredPosition = {
      id: generateId(),
      role: availableRole,
      count: 1,
      percentage: 100,
      assignedPersons: []
    };
    setRequiredPositions([...requiredPositions, newPos]);
  };

  const handleUpdatePosition = (posId: string, field: 'role' | 'percentage', value: any) => {
    setRequiredPositions(prev => prev.map(pos => {
      if (pos.id !== posId) return pos;
      if (field === 'role') return { ...pos, role: value as ProjectRole };
      if (field === 'percentage') return { ...pos, percentage: Number(value) || 0 };
      return pos;
    }));
  };

  const handleRemovePosition = (posId: string) => {
    setRequiredPositions(prev => prev.filter(pos => pos.id !== posId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasNewRisks = formData.teamRisks.trim().length > 0;
    const hasNewPotentials = formData.teamPotentials.trim().length > 0;
    
    let currentUser = useStore.getState().metadata.lastEditedBy;
    
    if ((hasNewRisks || hasNewPotentials) && !currentUser) {
      const enteredName = window.prompt("Wer trägt diese Projekt-Informationen gerade ein? (Dein Name)");
      if (enteredName && enteredName.trim()) {
        currentUser = enteredName.trim();
        useStore.getState().setMetadata(currentUser);
      } else {
        currentUser = "Nutzer";
      }
    }
    
    if (!currentUser) {
      currentUser = "Nutzer";
    }
    
    const timestamp = new Date().toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
    
    let updatedRisks = project.teamRisks || '';
    if (hasNewRisks) {
      const metrics = (formData.riskImpact !== '-' || formData.riskSeverity !== '-') 
        ? ` [Impact: ${formData.riskImpact} | Severity: ${formData.riskSeverity}]` 
        : '';
      const newRiskEntry = `[${timestamp} - ${currentUser}]${metrics}: ${formData.teamRisks.trim()}`;
      updatedRisks = project.teamRisks 
        ? `${project.teamRisks}\n${newRiskEntry}`
        : newRiskEntry;
    }
    
    let updatedPotentials = project.teamPotentials || '';
    if (hasNewPotentials) {
      const newPotentialEntry = `[${timestamp} - ${currentUser}]: ${formData.teamPotentials.trim()}`;
      updatedPotentials = project.teamPotentials 
        ? `${project.teamPotentials}\n${newPotentialEntry}`
        : newPotentialEntry;
    }

    updateProject(project.id, {
      teamRisks: updatedRisks,
      teamPotentials: updatedPotentials,
      client: formData.client.trim(),
      deliveryLead: formData.deliveryLead.trim(),
      contactPlatform: formData.contactPlatform.trim(),
      contactDepartment: formData.contactDepartment.trim(),
      estimatedStart: formData.estimatedStart,
      estimatedEnd: formData.estimatedEnd,
      description: formData.description.trim(),
      requiredPositions: requiredPositions,
    });
    
    setFormData({
      teamRisks: '',
      riskImpact: '-',
      riskSeverity: '-',
      teamPotentials: '',
      client: '',
      deliveryLead: '',
      contactPlatform: '',
      contactDepartment: '',
      estimatedStart: '',
      estimatedEnd: '',
      description: '',
    });
    
    onClose();
  };

  return createPortal(
    <div 
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <Users strokeWidth={1.5} size={24} className="text-primary" />
            <h2 className="text-xl font-bold text-textMain">Team-Status: {project.name}</h2>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X strokeWidth={1.5} size={20} />
          </button>
        </div>

        <form id="team-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 max-h-[65vh]">
          {/* Allgemeine Projekt-Informationen */}
          <div className="space-y-4 pb-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-textMain uppercase tracking-wider mb-2">Allgemeine Projekt-Informationen</h3>
            
            <div>
              <label className="block text-[11px] font-semibold text-textMain mb-1">Kurzbeschreibung</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Projektbeschreibung..."
                rows={2}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y max-h-32"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-textMain mb-1">Kundenbereich / Abteilung</label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={e => setFormData({...formData, client: e.target.value})}
                  placeholder="z.B. Service & Support"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-textMain mb-1">Delivery Lead</label>
                <input
                  type="text"
                  value={formData.deliveryLead}
                  onChange={e => setFormData({...formData, deliveryLead: e.target.value})}
                  placeholder="z.B. Max Mustermann"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-textMain mb-1">Ansprechpartner Anfrage-Kanal</label>
                <input
                  type="text"
                  value={formData.contactPlatform}
                  onChange={e => setFormData({...formData, contactPlatform: e.target.value})}
                  placeholder="z.B. Erika Muster"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-textMain mb-1">Ansprechpartner Bereich</label>
                <input
                  type="text"
                  value={formData.contactDepartment}
                  onChange={e => setFormData({...formData, contactDepartment: e.target.value})}
                  placeholder="z.B. John Doe"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-textMain mb-1">Geschätzter Start</label>
                <input
                  type="date"
                  value={formData.estimatedStart}
                  onChange={e => setFormData({...formData, estimatedStart: e.target.value})}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-textMain mb-1">Laufzeit Ende</label>
                <select
                  value={formData.estimatedEnd}
                  onChange={e => setFormData({...formData, estimatedEnd: e.target.value})}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Bitte wählen</option>
                  {generateMonthOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Soll-Besetzung (Projekt-Bedarf) */}
          <div className="space-y-4 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-textMain uppercase tracking-wider">Soll-Besetzung (Projekt-Bedarf)</h3>
              <button
                type="button"
                onClick={handleAddPosition}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <Plus strokeWidth={1.5} size={12} />
                Rolle hinzufügen
              </button>
            </div>
            
            {requiredPositions.length === 0 ? (
              <p className="text-xs text-textMuted py-3 text-center border border-dashed border-gray-200 rounded-lg">
                Kein Soll-Bedarf definiert. Das Projekt wird als voll besetzt gewertet.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {requiredPositions.map(pos => {
                  const ROLES: ProjectRole[] = ['Proxy PO', 'Scrum Master', 'SWE Frontend', 'SWE Backend', 'Architekt', 'UI/UX Designer', 'Test Consultant', 'Test Engineer'];
                  return (
                    <div key={pos.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <select
                          value={pos.role}
                          onChange={e => handleUpdatePosition(pos.id, 'role', e.target.value)}
                          className="text-xs font-semibold text-textMain bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30 flex-1 cursor-pointer"
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
                            value={pos.percentage ?? 100}
                            onChange={e => handleUpdatePosition(pos.id, 'percentage', parseInt(e.target.value) || 0)}
                            className="w-14 text-right text-xs font-semibold bg-white border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                          <span className="text-xs font-semibold text-textMain">%</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePosition(pos.id)}
                        className="p-1 text-gray-400 hover:text-danger hover:bg-red-50 rounded transition-colors"
                        title="Rolle entfernen"
                      >
                        <Trash2 strokeWidth={1.5} size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-textMain mb-2">
              <ShieldAlert strokeWidth={1.5} size={16} className="text-warning" />
              Team-Risiken hinzufügen
            </label>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-[11px] font-medium text-textMuted mb-1">Impact (Auswirkung)</label>
                <select 
                  className="w-full px-2 py-1.5 bg-white border border-warning/20 rounded text-xs focus:ring-1 focus:ring-warning/30 focus:border-warning"
                  value={formData.riskImpact}
                  onChange={e => setFormData({...formData, riskImpact: e.target.value})}
                >
                  <option value="-">-</option>
                  <option value="Niedrig">Niedrig</option>
                  <option value="Mittel">Mittel</option>
                  <option value="Hoch">Hoch</option>
                  <option value="Kritisch">Kritisch</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-textMuted mb-1">Severity (Eintrittsw.)</label>
                <select 
                  className="w-full px-2 py-1.5 bg-white border border-warning/20 rounded text-xs focus:ring-1 focus:ring-warning/30 focus:border-warning"
                  value={formData.riskSeverity}
                  onChange={e => setFormData({...formData, riskSeverity: e.target.value})}
                >
                  <option value="-">-</option>
                  <option value="Niedrig">Niedrig</option>
                  <option value="Mittel">Mittel</option>
                  <option value="Hoch">Hoch</option>
                  <option value="Kritisch">Kritisch</option>
                </select>
              </div>
            </div>
            <textarea 
              rows={3}
              className="w-full px-3 py-2 bg-warning/5 border border-warning/20 rounded-lg text-sm focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all placeholder:text-warning/50"
              placeholder="Z.B. Wissensmonopol bei Person X, kritische Deadline, mangelnde Kapazität..."
              value={formData.teamRisks}
              onChange={e => setFormData({...formData, teamRisks: e.target.value})}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-textMain mb-2">
              <Sparkles strokeWidth={1.5} size={16} className="text-primary" />
              Team-Potenziale hinzufügen
            </label>
            <textarea 
              rows={3}
              className="w-full px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-primary/50"
              placeholder="Z.B. hohe Synergie zwischen Frontend und Backend, Innovationspotenzial..."
              value={formData.teamPotentials}
              onChange={e => setFormData({...formData, teamPotentials: e.target.value})}
            />
          </div>

          {/* Gespeicherte Team-Informationen */}
          <div className="pt-5 border-t border-gray-100 bg-gray-50/50 -mx-6 px-6 pb-2 space-y-3">
            <h3 className="text-xs font-bold text-textMain uppercase tracking-wider">Gespeicherte Team-Informationen (Schreibgeschützt)</h3>
            <div className="space-y-4 text-xs">
              <div>
                <span className="block font-semibold text-textMuted uppercase tracking-wider text-[10px] mb-1">Team-Risiken</span>
                <p className="text-textMuted bg-white p-2.5 rounded border border-gray-100 whitespace-pre-line text-xs italic shadow-sm min-h-[40px]">
                  {project.teamRisks || 'Keine Team-Risiken hinterlegt'}
                </p>
              </div>
              <div>
                <span className="block font-semibold text-textMuted uppercase tracking-wider text-[10px] mb-1">Team-Potenziale</span>
                <p className="text-textMuted bg-white p-2.5 rounded border border-gray-100 whitespace-pre-line text-xs italic shadow-sm min-h-[40px]">
                  {project.teamPotentials || 'Keine Team-Potenziale hinterlegt'}
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button 
            type="submit"
            form="team-form"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primaryHover transition-colors shadow-sm"
          >
            <Save strokeWidth={1.5} size={16} />
            Speichern
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
