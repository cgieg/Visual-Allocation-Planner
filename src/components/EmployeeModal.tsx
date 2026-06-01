import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore, Employee } from '../store/useStore';
import { X, Save, ShieldAlert, Sparkles, UserCircle, Trash2 } from 'lucide-react';

interface EmployeeModalProps {
  employee: Employee;
  onClose: () => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({ employee, onClose }) => {
  const { updateEmployee, removeEmployee, projects, pipelineProjects, allocations } = useStore();
  const employeeAllocations = allocations.filter(a => a.employeeId === employee.id);
  
  const pipelineEmployeeAllocations = pipelineProjects.flatMap(p => 
    p.requiredPositions.flatMap(pos => 
      pos.assignedPersons
         .filter(ap => ap.employeeId === employee.id)
         .map(ap => ({
           id: `${p.id}-${pos.id}-${ap.employeeId}`,
           projectId: p.id,
           projectName: p.name,
           projectRole: pos.role,
           percentage: ap.percentage,
           isTechLead: false,
           isPipeline: true
         }))
    )
  );

  const hasAnyAllocations = employeeAllocations.length > 0 || pipelineEmployeeAllocations.length > 0;
  
  const [formData, setFormData] = useState({
    name: employee.name,
    currentRole: employee.currentRole,
    skills: employee.skills.join(', '),
    risks: '',
    riskImpact: '-',
    riskSeverity: '-',
    potentials: '',
    startDate: employee.startDate || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasNewRisks = formData.risks.trim().length > 0;
    const hasNewPotentials = formData.potentials.trim().length > 0;
    
    let currentUser = useStore.getState().metadata.lastEditedBy;
    
    if ((hasNewRisks || hasNewPotentials) && !currentUser) {
      const enteredName = window.prompt("Wer trägt diese Informationen gerade ein? (Dein Name)");
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
    
    let updatedRisks = employee.risks || '';
    if (hasNewRisks) {
      const metrics = (formData.riskImpact !== '-' || formData.riskSeverity !== '-') 
        ? ` [Impact: ${formData.riskImpact} | Severity: ${formData.riskSeverity}]` 
        : '';
      const newRiskEntry = `[${timestamp} - ${currentUser}]${metrics}: ${formData.risks.trim()}`;
      updatedRisks = employee.risks 
        ? `${employee.risks}\n${newRiskEntry}`
        : newRiskEntry;
    }
    
    let updatedPotentials = employee.potentials || '';
    if (hasNewPotentials) {
      const newPotentialEntry = `[${timestamp} - ${currentUser}]: ${formData.potentials.trim()}`;
      updatedPotentials = employee.potentials 
        ? `${employee.potentials}\n${newPotentialEntry}`
        : newPotentialEntry;
    }

    updateEmployee(employee.id, {
      name: formData.name,
      currentRole: formData.currentRole,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      risks: updatedRisks,
      potentials: updatedPotentials,
      startDate: formData.startDate,
    });
    
    setFormData(prev => ({
      ...prev,
      risks: '',
      riskImpact: '-',
      riskSeverity: '-',
      potentials: ''
    }));
    
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
            <UserCircle strokeWidth={1.5} size={24} className="text-primary" />
            <h2 className="text-xl font-bold text-textMain">Mitarbeiter-Profil</h2>
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

        <form id="employee-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textMain mb-1.5">Name</label>
              <input 
                type="text" 
                required
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textMain mb-1.5">Aktuelle Rolle</label>
              <input 
                type="text" 
                required
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={formData.currentRole}
                onChange={e => setFormData({...formData, currentRole: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-textMain mb-1.5">Fähigkeiten / Skills (Kommagetrennt)</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={formData.skills}
              placeholder="React, TypeScript, Agile..."
              onChange={e => setFormData({...formData, skills: e.target.value})}
            />
          </div>

          {employee.status === 'newcomer' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-textMain mb-1.5">Startdatum</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 text-sm font-semibold text-textMain mb-2">
              <ShieldAlert strokeWidth={1.5} size={16} className="text-warning" />
              Personelle Risiken
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
              placeholder="Z.B. Wechselrisiko, Engpasswissen..."
              value={formData.risks}
              onChange={e => setFormData({...formData, risks: e.target.value})}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-textMain mb-2">
              <Sparkles strokeWidth={1.5} size={16} className="text-primary" />
              Entwicklungspotenziale
            </label>
            <textarea 
              rows={3}
              className="w-full px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-primary/50"
              placeholder="Z.B. Interesse an Architektur, Scrum Master Ausbildung..."
              value={formData.potentials}
              onChange={e => setFormData({...formData, potentials: e.target.value})}
            />
          </div>
          {/* Gespeicherte Profil-Informationen */}
          <div className="pt-5 border-t border-gray-100 bg-gray-50/50 -mx-6 px-6 pb-2 space-y-3">
            <h3 className="text-xs font-bold text-textMain uppercase tracking-wider">Gespeicherte Profil-Informationen (Schreibgeschützt)</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block font-semibold text-textMuted uppercase tracking-wider text-[10px] mb-0.5">Name</span>
                <span className="text-textMain font-medium">{employee.name}</span>
              </div>
              <div>
                <span className="block font-semibold text-textMuted uppercase tracking-wider text-[10px] mb-0.5">Rolle</span>
                <span className="text-textMain font-medium">{employee.currentRole}</span>
              </div>
              <div className="col-span-2">
                <span className="block font-semibold text-textMuted uppercase tracking-wider text-[10px] mb-0.5">Skills</span>
                <span className="text-textMain font-medium">{employee.skills.join(', ') || 'Keine Skills hinterlegt'}</span>
              </div>
              <div className="col-span-2">
                <span className="block font-semibold text-textMuted uppercase tracking-wider text-[10px] mb-0.5">Personelle Risiken</span>
                <p className="text-textMuted bg-white p-2.5 rounded border border-gray-100 whitespace-pre-line text-xs italic shadow-sm min-h-[40px]">
                  {employee.risks || 'Keine Risiken hinterlegt'}
                </p>
              </div>
              <div className="col-span-2">
                <span className="block font-semibold text-textMuted uppercase tracking-wider text-[10px] mb-0.5">Entwicklungspotenziale</span>
                <p className="text-textMuted bg-white p-2.5 rounded border border-gray-100 whitespace-pre-line text-xs italic shadow-sm min-h-[40px]">
                  {employee.potentials || 'Keine Potenziale hinterlegt'}
                </p>
              </div>
              {employee.status === 'newcomer' && (
                <>
                  <div className="col-span-2">
                    <span className="block font-semibold text-textMuted uppercase tracking-wider text-[10px] mb-0.5">Startdatum</span>
                    <span className="text-textMain font-medium">
                      {employee.startDate ? new Date(employee.startDate).toLocaleDateString('de-DE') : 'Nicht hinterlegt'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Aktuelle Projekt-Allokationen */}
          {hasAnyAllocations && (
            <div className="pt-5 border-t border-gray-100 bg-gray-50/50 -mx-6 px-6 pb-2 space-y-3">
              <h3 className="text-xs font-bold text-textMain uppercase tracking-wider">Aktuelle Projekt-Allokationen</h3>
              <div className="space-y-2">
                {employeeAllocations.map(alloc => {
                  const proj = projects.find(p => p.id === alloc.projectId);
                  if (!proj) return null;
                  return (
                    <div key={alloc.id} className="flex justify-between items-center bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                      <div>
                        <div className="font-semibold text-sm text-textMain">{proj.name}</div>
                        <div className="text-xs text-textMuted mt-0.5">
                          Rolle: {alloc.projectRole || employee.currentRole} 
                          {alloc.isTechLead && <span className="ml-2 inline-block px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold">TECH-LEAD</span>}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-primary bg-primary/5 px-2 py-1 rounded">
                        {alloc.percentage}%
                      </div>
                    </div>
                  );
                })}
                {pipelineEmployeeAllocations.map(alloc => (
                  <div key={alloc.id} className="flex justify-between items-center bg-white border border-dashed border-gray-300 rounded-lg p-3 shadow-sm">
                    <div>
                      <div className="font-semibold text-sm text-textMain">{alloc.projectName}</div>
                      <div className="text-xs text-textMuted mt-0.5">
                        Rolle: {alloc.projectRole || employee.currentRole} 
                        <span className="ml-2 inline-block px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">PIPELINE-PROJEKT</span>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-primary bg-primary/5 px-2 py-1 rounded">
                      {alloc.percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          {!hasAnyAllocations && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Mitarbeiter wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                  removeEmployee(employee.id);
                  onClose();
                }
              }}
              className="px-4 py-2 text-sm font-medium text-danger bg-white border border-danger/30 rounded-lg hover:bg-danger/5 transition-colors mr-auto flex items-center gap-2 shadow-sm"
            >
              <Trash2 strokeWidth={1.5} size={16} />
              Mitarbeiter löschen
            </button>
          )}
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
            form="employee-form"
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
