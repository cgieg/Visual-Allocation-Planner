import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, ChevronRight, User, UserPlus, Search, Users } from 'lucide-react';
import { PipelineProject, ProjectRole, RequiredPosition, useStore } from '../store/useStore';

interface Props {
  project: PipelineProject;
  onClose: () => void;
}

const ROLES: ProjectRole[] = ['Proxy PO', 'Scrum Master', 'SWE Frontend', 'SWE Backend', 'Architekt', 'UI/UX Designer', 'Test Consultant', 'Test Engineer'];

const STAGE_LABELS: Record<string, string> = {
  'opportunity': 'Opportunity Identifiziert',
  'intake': 'Anfrage-Plattform',
  'go-nogo': 'Go/No Go',
  'staffing': 'Staffing',
  'kickoff': 'Kickoff',
};

const STAGE_COLORS: Record<string, string> = {
  'opportunity': '#6b7280',
  'intake': '#0891b2',
  'go-nogo': '#d97706',
  'staffing': '#7c3aed',
  'kickoff': '#059669',
};

const NEWCOMER_PHASE_LABELS: Record<string, string> = {
  'contract': 'Vertragsphase',
  'prep': 'Onboarding-Vorb.',
  'preboarding': 'Pre-Boarding',
  'ready': 'Erster Arbeitstag',
};

const roleColors: Record<string, string> = {
  'SWE Frontend': '#008bd2',
  'SWE Backend': '#2563eb',
  'Proxy PO': '#7c3aed',
  'Scrum Master': '#059669',
  'Architekt': '#d97706',
  'UI/UX Designer': '#ec4899',
  'Test Consultant': '#0d9488',
  'Test Engineer': '#0891b2',
};

const formatLaufzeitEnde = (dateStr: string) => {
  if (!dateStr) return '–';
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const month = parts[1];
    return `${month}/${year}`;
  }
  return dateStr;
};

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

export const PipelineProjectModal: React.FC<Props> = ({ project, onClose }) => {
  const employees = useStore(state => state.employees);
  const allocations = useStore(state => state.allocations);
  const updatePipelineProject = useStore(state => state.updatePipelineProject);
  const assignPersonToPosition = useStore(state => state.assignPersonToPosition);
  const removePersonFromPosition = useStore(state => state.removePersonFromPosition);
  const movePipelineStage = useStore(state => state.movePipelineStage);
  const removePipelineProject = useStore(state => state.removePipelineProject);
  const promotePipelineProject = useStore(state => state.promotePipelineProject);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editClient, setEditClient] = useState(project.client);
  const [editDescription, setEditDescription] = useState(project.description);
  const [editStart, setEditStart] = useState(project.estimatedStart);
  const [editEnd, setEditEnd] = useState(project.estimatedEnd);
  const [editContactPlatform, setEditContactPlatform] = useState(project.contactPlatform || '');
  const [editContactDepartment, setEditContactDepartment] = useState(project.contactDepartment || '');
  const [editDeliveryLead, setEditDeliveryLead] = useState(project.deliveryLead || '');
  
  const [staffingTab, setStaffingTab] = useState<'active' | 'newcomer'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [assignPercentage, setAssignPercentage] = useState(100);

  // Recalculate from store (in case of updates)
  const pipelineProjects = useStore(state => state.pipelineProjects);
  const currentProject = pipelineProjects.find(p => p.id === project.id) || project;

  const activeEmployees = employees.filter(e => e.status === 'active');
  const newcomerEmployees = employees.filter(e => e.status === 'newcomer');

  const filteredEmployees = (staffingTab === 'active' ? activeEmployees : newcomerEmployees)
    .filter(e => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.currentRole.toLowerCase().includes(q);
    });

  // Get all employee IDs already assigned anywhere in this project
  const assignedEmployeeIds = new Set(
    currentProject.requiredPositions.flatMap(pos => pos.assignedPersons.map(ap => ap.employeeId))
  );

  const getEmployeeTotalAllocation = (employeeId: string): number => {
    // Regular project allocations
    const projectAlloc = allocations
      .filter(a => a.employeeId === employeeId)
      .reduce((sum, a) => sum + a.percentage, 0);
    
    // Pipeline project allocations (across all pipeline projects)
    const pipelineAlloc = pipelineProjects
      .flatMap(p => p.requiredPositions.flatMap(pos => pos.assignedPersons))
      .filter(ap => ap.employeeId === employeeId)
      .reduce((sum, ap) => sum + ap.percentage, 0);

    return projectAlloc + pipelineAlloc;
  };

  const handleSaveEdit = () => {
    updatePipelineProject(project.id, {
      name: editName.trim(),
      client: editClient.trim(),
      description: editDescription.trim(),
      estimatedStart: editStart,
      estimatedEnd: editEnd,
      contactPlatform: editContactPlatform.trim(),
      contactDepartment: editContactDepartment.trim(),
      deliveryLead: editDeliveryLead.trim(),
    });
    setIsEditing(false);
  };

  const handleAddPosition = () => {
    const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
    const availableRole = ROLES.find(r => !currentProject.requiredPositions.some(p => p.role === r)) || 'SWE Frontend';
    const newPos: RequiredPosition = {
      id: generateId(),
      role: availableRole,
      count: 1,
      percentage: 100,
      assignedPersons: []
    };
    updatePipelineProject(project.id, {
      requiredPositions: [...currentProject.requiredPositions, newPos]
    });
  };

  const handleUpdatePosition = (posId: string, field: 'role' | 'count' | 'percentage', value: string | number) => {
    updatePipelineProject(project.id, {
      requiredPositions: currentProject.requiredPositions.map(pos => {
        if (pos.id !== posId) return pos;
        if (field === 'role') return { ...pos, role: value as ProjectRole };
        if (field === 'percentage') return { ...pos, percentage: Number(value) || 0 };
        return { ...pos, count: Number(value) || 1 };
      })
    });
  };

  const handleRemovePosition = (posId: string) => {
    updatePipelineProject(project.id, {
      requiredPositions: currentProject.requiredPositions.filter(pos => pos.id !== posId)
    });
  };

  const handleAssignPerson = (employeeId: string, positionId: string) => {
    assignPersonToPosition(project.id, positionId, { employeeId, percentage: assignPercentage });
    setSelectedPositionId(null);
  };

  const handleDelete = () => {
    if (window.confirm(`Projekt "${currentProject.name}" wirklich löschen?`)) {
      removePipelineProject(project.id);
      onClose();
    }
  };

  const handlePromote = () => {
    if (window.confirm(`"${currentProject.name}" in den Projektpool übernehmen?`)) {
      promotePipelineProject(project.id);
      onClose();
    }
  };

  const stages: Array<{ id: string; label: string }> = [
    { id: 'opportunity', label: 'Opportunity' },
    { id: 'intake', label: 'Anfrage' },
    { id: 'go-nogo', label: 'Go/No Go' },
    { id: 'staffing', label: 'Staffing' },
    { id: 'kickoff', label: 'Kickoff' },
  ];

  const currentStageIndex = stages.findIndex(s => s.id === currentProject.stage);

  const totalRequired = currentProject.requiredPositions.reduce((sum, pos) => sum + (pos.percentage ?? pos.count * 100), 0);
  const totalFilled = currentProject.requiredPositions.reduce((sum, pos) => sum + pos.assignedPersons.reduce((s, ap) => s + ap.percentage, 0), 0);

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header with color bar */}
        <div 
          className="px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: currentProject.color + '18', borderBottom: `2px solid ${currentProject.color}` }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-bold text-textMain">{currentProject.name}</h2>
              <span 
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: STAGE_COLORS[currentProject.stage] }}
              >
                {STAGE_LABELS[currentProject.stage]}
              </span>
            </div>
            {currentProject.client && (
              <p className="text-sm text-textMuted">{currentProject.client}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/60 rounded-lg transition-colors">
            <X strokeWidth={1.5} size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Stage Progress Bar */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-1">
              {stages.map((stage, i) => (
                <React.Fragment key={stage.id}>
                  <button
                    onClick={() => {
                      if (stage.id === 'kickoff') {
                        handlePromote();
                      } else {
                        movePipelineStage(project.id, stage.id as any);
                      }
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium text-center transition-all ${
                      i <= currentStageIndex
                        ? 'text-white shadow-sm'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    style={i <= currentStageIndex ? { backgroundColor: STAGE_COLORS[stage.id] } : undefined}
                  >
                    {stage.label}
                  </button>
                  {i < stages.length - 1 && (
                    <ChevronRight strokeWidth={1.5} size={14} className="text-gray-300 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Project Info Section */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-textMain">Projektinformationen</h3>
              <button
                onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                className="text-xs font-medium text-primary hover:text-primaryHover transition-colors"
              >
                {isEditing ? 'Speichern' : 'Bearbeiten'}
              </button>
            </div>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-textMain mb-1">Projektname</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Projektname"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-textMain mb-1">Kundenbereich / Abteilung</label>
                    <input
                      type="text"
                      value={editClient}
                      onChange={e => setEditClient(e.target.value)}
                      placeholder="z.B. Service & Support"
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-textMain mb-1">Delivery Lead</label>
                    <input
                      type="text"
                      value={editDeliveryLead}
                      onChange={e => setEditDeliveryLead(e.target.value)}
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
                      value={editContactPlatform}
                      onChange={e => setEditContactPlatform(e.target.value)}
                      placeholder="z.B. Erika Muster"
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-textMain mb-1">Ansprechpartner im Bereich</label>
                    <input
                      type="text"
                      value={editContactDepartment}
                      onChange={e => setEditContactDepartment(e.target.value)}
                      placeholder="z.B. John Doe"
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-textMain mb-1">Beschreibung</label>
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder="Beschreibung"
                    rows={3}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y overflow-y-auto max-h-48"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-textMain mb-1">Geschätzter Start</label>
                    <input
                      type="date"
                      value={editStart}
                      onChange={e => setEditStart(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-textMain mb-1">Laufzeit Ende</label>
                    <select
                      value={editEnd}
                      onChange={e => setEditEnd(e.target.value)}
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
            ) : (
              <div className="text-sm text-textMuted space-y-3">
                {currentProject.description && (
                  <p className="text-sm text-textMain leading-relaxed whitespace-pre-wrap">{currentProject.description}</p>
                )}
                {!currentProject.description && (
                  <p className="text-xs italic text-textMuted">Keine Beschreibung vorhanden</p>
                )}

                <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 pt-4 border-t border-gray-100 text-xs">
                  <div>
                    <span className="block font-semibold text-textMain mb-0.5">Kundenbereich / Abteilung</span>
                    <span className="text-textMuted">{currentProject.client || '–'}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-textMain mb-0.5">Laufzeit Ende</span>
                    <span className="text-textMuted font-medium text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 inline-block">
                      {formatLaufzeitEnde(currentProject.estimatedEnd)}
                    </span>
                  </div>
                  <div>
                    <span className="block font-semibold text-textMain mb-0.5">Geschätzter Start</span>
                    <span className="text-textMuted">
                      {currentProject.estimatedStart ? new Date(currentProject.estimatedStart).toLocaleDateString('de-DE') : '–'}
                    </span>
                  </div>
                  <div>
                    <span className="block font-semibold text-textMain mb-0.5">Delivery Lead</span>
                    <span className="text-textMuted">{currentProject.deliveryLead || '–'}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-textMain mb-0.5">Ansprechpartner Anfrage-Kanal</span>
                    <span className="text-textMuted">{currentProject.contactPlatform || '–'}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-textMain mb-0.5">Ansprechpartner im Bereich</span>
                    <span className="text-textMuted">{currentProject.contactDepartment || '–'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Required Positions Section */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-textMain">Benötigte Rollen</h3>
                <span className="text-xs text-textMuted">
                  ({totalFilled}% / {totalRequired}% besetzt)
                </span>
              </div>
              <button
                onClick={handleAddPosition}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <Plus strokeWidth={1.5} size={12} />
                Rolle
              </button>
            </div>

            {currentProject.requiredPositions.length > 0 && !selectedPositionId && (
              <div className="mb-3.5 px-3 py-2.5 bg-primary/5 rounded-xl border border-primary/10 text-xs text-primary flex items-center gap-2.5 animate-fade-in-up">
                <span className="text-base leading-none">💡</span>
                <span>Klicken Sie auf das <strong>Person zuweisen</strong> Symbol <span className="inline-flex items-center p-0.5 bg-white rounded border border-primary/20 text-primary mx-0.5"><UserPlus strokeWidth={1.5} size={10} /></span> einer Rolle, um Mitarbeiter oder Newcomer zuzuweisen.</span>
              </div>
            )}

            {currentProject.requiredPositions.length === 0 ? (
              <p className="text-xs text-textMuted py-4 text-center border border-dashed border-gray-200 rounded-lg">
                Noch keine Rollen definiert
              </p>
            ) : (
              <div className="space-y-3">
                {currentProject.requiredPositions.map(pos => (
                  <div key={pos.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    {/* Position header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: roleColors[pos.role] || '#6b7280' }}
                        />
                        <select
                          value={pos.role}
                          onChange={e => handleUpdatePosition(pos.id, 'role', e.target.value)}
                          className="text-sm font-semibold text-textMain bg-transparent border-none focus:outline-none cursor-pointer"
                        >
                          {ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={0}
                          step={10}
                          value={pos.percentage ?? pos.count * 100}
                          onChange={e => handleUpdatePosition(pos.id, 'percentage', parseInt(e.target.value) || 0)}
                          className="w-16 text-right text-sm font-semibold bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        <span className="text-xs font-semibold text-textMain">%</span>
                        
                        <span className={`text-xs font-medium ml-2 ${
                          pos.assignedPersons.reduce((s, ap) => s + ap.percentage, 0) >= (pos.percentage ?? pos.count * 100) 
                            ? 'text-emerald-600' 
                            : 'text-textMuted'
                        }`}>
                          ({pos.assignedPersons.reduce((s, ap) => s + ap.percentage, 0)}% / {pos.percentage ?? pos.count * 100}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedPositionId(selectedPositionId === pos.id ? null : pos.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            selectedPositionId === pos.id 
                              ? 'bg-primary text-white' 
                              : 'text-gray-400 hover:text-primary hover:bg-primary/10'
                          }`}
                          title="Person zuweisen"
                        >
                          <UserPlus strokeWidth={1.5} size={14} />
                        </button>
                        <button
                          onClick={() => handleRemovePosition(pos.id)}
                          className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                          title="Rolle entfernen"
                        >
                          <Trash2 strokeWidth={1.5} size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Assigned persons */}
                    {pos.assignedPersons.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        {pos.assignedPersons.map(ap => {
                          const emp = employees.find(e => e.id === ap.employeeId);
                          if (!emp) return null;
                          const isNewcomer = emp.status === 'newcomer';
                          return (
                            <div key={ap.employeeId} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 border border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                                  isNewcomer ? 'bg-amber-400' : 'bg-primary'
                                }`}>
                                  {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </div>
                                <span className="text-xs font-medium text-textMain">{emp.name}</span>
                                {isNewcomer && (
                                  <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] font-medium text-amber-700">
                                    {NEWCOMER_PHASE_LABELS[emp.newcomerPhase || 'contract']}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-textMuted">{ap.percentage}%</span>
                                <button
                                  onClick={() => removePersonFromPosition(project.id, pos.id, ap.employeeId)}
                                  className="p-1 text-gray-300 hover:text-danger transition-colors"
                                >
                                  <X strokeWidth={1.5} size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Assign person panel (shown when position is selected) */}
                    {selectedPositionId === pos.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs font-semibold text-textMain mb-2">Person zuweisen</div>
                        
                        {/* Percentage setting */}
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-[11px] text-textMuted">Allokation:</label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={assignPercentage}
                            onChange={e => setAssignPercentage(parseInt(e.target.value))}
                            className="flex-1 h-1.5 accent-primary"
                          />
                          <span className="text-xs font-bold text-textMain w-8 text-right">{assignPercentage}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Staffing Section - Person Selection */}
          {selectedPositionId && (
            <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/30">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-textMain flex items-center gap-2">
                  <Users strokeWidth={1.5} size={14} />
                  Verfügbare Personen
                </h3>
                {/* Tabs */}
                <div className="inline-flex bg-white rounded-lg p-0.5 shadow-sm border border-gray-200 ml-auto">
                  <button
                    onClick={() => setStaffingTab('active')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      staffingTab === 'active' ? 'bg-primary text-white shadow-sm' : 'text-textMuted hover:text-textMain'
                    }`}
                  >
                    <User strokeWidth={1.5} size={10} className="inline mr-1" />
                    Mitarbeiter ({activeEmployees.length})
                  </button>
                  <button
                    onClick={() => setStaffingTab('newcomer')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      staffingTab === 'newcomer' ? 'bg-amber-500 text-white shadow-sm' : 'text-textMuted hover:text-textMain'
                    }`}
                  >
                    <UserPlus strokeWidth={1.5} size={10} className="inline mr-1" />
                    Newcomer ({newcomerEmployees.length})
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search strokeWidth={1.5} size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Name oder Rolle suchen..."
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                />
              </div>

              {/* Person list */}
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {filteredEmployees.map(emp => {
                  const isAlreadyAssigned = assignedEmployeeIds.has(emp.id);
                  const totalAlloc = getEmployeeTotalAllocation(emp.id);
                  const isNewcomer = emp.status === 'newcomer';

                  return (
                    <div 
                      key={emp.id}
                      className={`flex items-center justify-between bg-white rounded-lg px-3 py-2 border transition-all ${
                        isAlreadyAssigned 
                          ? 'border-gray-100 opacity-50' 
                          : 'border-gray-200 hover:border-primary/30 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                          isNewcomer ? 'bg-amber-400' : 'bg-primary'
                        }`}>
                          {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-textMain">{emp.name}</span>
                            {isNewcomer && (
                              <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] font-medium text-amber-700">
                                {NEWCOMER_PHASE_LABELS[emp.newcomerPhase || 'contract']}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-textMuted">{emp.currentRole}</span>
                            <span className={`text-[10px] font-medium ${
                              totalAlloc > 100 ? 'text-danger' : totalAlloc === 100 ? 'text-emerald-600' : 'text-textMuted'
                            }`}>
                              {totalAlloc}% allokiert
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignPerson(emp.id, selectedPositionId)}
                        disabled={isAlreadyAssigned}
                        className="px-2.5 py-1 bg-primary text-white text-[11px] font-medium rounded-md hover:bg-primaryHover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {isAlreadyAssigned ? 'Zugewiesen' : 'Zuweisen'}
                      </button>
                    </div>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <p className="text-xs text-textMuted text-center py-4">Keine Personen gefunden</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between rounded-b-2xl">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-danger hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 strokeWidth={1.5} size={13} />
            Projekt löschen
          </button>
          <div className="flex items-center gap-2">
            {currentProject.stage === 'kickoff' ? (
              <button
                onClick={handlePromote}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Zum Projektpool
                <ChevronRight strokeWidth={1.5} size={13} />
              </button>
            ) : (
              <button
                onClick={() => {
                  const nextStageMap: Record<string, string> = {
                    'opportunity': 'intake',
                    'intake': 'go-nogo',
                    'go-nogo': 'staffing',
                    'staffing': 'kickoff',
                  };
                  const nextStage = nextStageMap[currentProject.stage];
                  if (nextStage === 'kickoff') {
                    // Moving to kickoff triggers promotion
                    movePipelineStage(project.id, 'kickoff' as any);
                  } else if (nextStage) {
                    movePipelineStage(project.id, nextStage as any);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primaryHover transition-colors shadow-sm"
              >
                Nächste Stufe
                <ChevronRight strokeWidth={1.5} size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
