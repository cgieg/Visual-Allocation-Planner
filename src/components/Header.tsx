import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, Info, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Header: React.FC = () => {
  const { metadata, setMetadata, importState, resetData, projects, pipelineProjects, allocations } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active Pool Vacancies
  const poolVacancies: Record<string, { role: string; open: number; projects: Array<{ name: string; open: number }> }> = {};
  projects.forEach(proj => {
    const projAllocations = allocations.filter(a => a.projectId === proj.id);
    (proj.requiredPositions || []).forEach(pos => {
      const filled = projAllocations
        .filter(a => a.projectRole === pos.role)
        .reduce((sum, a) => sum + a.percentage, 0);
      const open = Math.max(0, (pos.percentage ?? 100) - filled);
      
      if (open > 0) {
        if (!poolVacancies[pos.role]) {
          poolVacancies[pos.role] = { role: pos.role, open: 0, projects: [] };
        }
        poolVacancies[pos.role].open += open;
        poolVacancies[pos.role].projects.push({ name: proj.name, open });
      }
    });
  });
  const poolVacanciesList = Object.values(poolVacancies).sort((a, b) => b.open - a.open);
  const totalPoolOpenFte = poolVacanciesList.reduce((sum, v) => sum + v.open, 0);

  // Pipeline Project Vacancies
  const pipelineVacancies: Record<string, { role: string; open: number; projects: Array<{ name: string; open: number }> }> = {};
  pipelineProjects.forEach(proj => {
    (proj.requiredPositions || []).forEach(pos => {
      const filled = pos.assignedPersons.reduce((sum, ap) => sum + ap.percentage, 0);
      const open = Math.max(0, (pos.percentage ?? pos.count * 100) - filled);
      
      if (open > 0) {
        if (!pipelineVacancies[pos.role]) {
          pipelineVacancies[pos.role] = { role: pos.role, open: 0, projects: [] };
        }
        pipelineVacancies[pos.role].open += open;
        pipelineVacancies[pos.role].projects.push({ name: proj.name, open });
      }
    });
  });
  const pipelineVacanciesList = Object.values(pipelineVacancies).sort((a, b) => b.open - a.open);
  const totalPipelineOpenFte = pipelineVacanciesList.reduce((sum, v) => sum + v.open, 0);

  const hasVacancies = poolVacanciesList.length > 0 || pipelineVacanciesList.length > 0;

  const handleExport = () => {
    const name = window.prompt("Wer bearbeitet den Stand gerade? (Dein Name)");
    if (!name) return;
    setMetadata(name);
    
    setTimeout(() => {
      const state = useStore.getState();
      const exportData = {
        employees: state.employees,
        projects: state.projects,
        allocations: state.allocations,
        metadata: state.metadata
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `Ressourcenplan_${dateStr}_${name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const data = JSON.parse(result);
        if (data.employees && data.projects) {
          importState(data);
          alert("Daten erfolgreich importiert.");
        } else {
          alert("Ungültiges Dateiformat.");
        }
      } catch {
        alert("Fehler beim Importieren der Datei.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (window.confirm("Bist du sicher, dass du alle Daten löschen möchtest? Dies kann nicht rückgängig gemacht werden.")) {
      resetData();
    }
  };

  return (
    <header className="bg-surface/85 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-textMain tracking-tight font-display">Visual Allocation Tool</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/80 text-blue-800 rounded-md text-sm font-medium border border-blue-100/50">
            <Info strokeWidth={1.5} size={16} className="text-blue-600" />
            {metadata.lastEditedBy ? (
              <span>
                Aktueller Arbeitsstand geladen. Zuletzt bearbeitet von: <strong className="font-semibold">{metadata.lastEditedBy}</strong> am {new Date(metadata.lastEditedAt!).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            ) : (
              <span>Lokaler Erstentwurf</span>
            )}
          </div>

          {/* Global Vacancies Dropdown */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-sm cursor-pointer select-none ${
                hasVacancies
                  ? 'bg-amber-500/10 text-amber-800 border-amber-500/20 hover:bg-amber-500/20 animate-border-pulse-warning'
                  : 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {hasVacancies ? (
                <>
                  <AlertCircle strokeWidth={1.5} size={14} className="text-amber-600 animate-pulse" />
                  <span>Vakanzen: {totalPoolOpenFte}% Pool / {totalPipelineOpenFte}% Pipeline</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>100% gestafft</span>
                </>
              )}
              {isOpen ? <ChevronUp strokeWidth={1.5} size={12} /> : <ChevronDown strokeWidth={1.5} size={12} />}
            </button>

            {isOpen && (
              <div className="absolute left-0 mt-2 w-[540px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-[100] p-5 origin-top-left animate-fade-in-up">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="font-bold text-sm text-textMain flex items-center gap-2">
                    📋 Kapazitäts- & Bedarfsanalyse (Vakanzen)
                  </h3>
                  <span className="text-[10px] text-textMuted font-medium uppercase bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                    Übergreifende Ansicht
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 max-h-[380px] overflow-y-auto pr-1">
                  {/* Left Column: Active Pool */}
                  <div>
                    <h4 className="text-[11px] font-bold text-textMain uppercase tracking-wider mb-2 pb-1 border-b border-gray-100/50 flex items-center justify-between">
                      <span>1. Projekt-Pool</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 rounded">{totalPoolOpenFte}% FTE</span>
                    </h4>

                    {poolVacanciesList.length === 0 ? (
                      <div className="py-8 text-center text-xs text-textMuted bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        ✨ Keine Vakanzen im Pool
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {poolVacanciesList.map(v => (
                          <div key={v.role} className="p-2.5 bg-amber-50/15 border border-amber-200/50 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.01)] hover:border-amber-200 transition-colors">
                            <div className="flex justify-between items-center text-xs font-bold text-amber-800 mb-1.5">
                              <span className="truncate max-w-[150px]">{v.role}</span>
                              <span>{v.open}%</span>
                            </div>
                            <div className="space-y-0.5 border-t border-amber-100/30 pt-1">
                              {v.projects.map((p, idx) => (
                                <div key={idx} className="flex justify-between text-[10px] text-textMuted">
                                  <span className="truncate max-w-[160px]" title={p.name}>{p.name}</span>
                                  <span className="font-semibold">{p.open}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Project Pipeline */}
                  <div>
                    <h4 className="text-[11px] font-bold text-textMain uppercase tracking-wider mb-2 pb-1 border-b border-gray-100/50 flex items-center justify-between">
                      <span>2. Projekt-Pipeline</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 rounded">{totalPipelineOpenFte}% FTE</span>
                    </h4>

                    {pipelineVacanciesList.length === 0 ? (
                      <div className="py-8 text-center text-xs text-textMuted bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        ✨ Keine Vakanzen in der Pipeline
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pipelineVacanciesList.map(v => (
                          <div key={v.role} className="p-2.5 bg-blue-50/15 border border-blue-200/50 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.01)] hover:border-blue-200 transition-colors">
                            <div className="flex justify-between items-center text-xs font-bold text-blue-800 mb-1.5">
                              <span className="truncate max-w-[150px]">{v.role}</span>
                              <span>{v.open}%</span>
                            </div>
                            <div className="space-y-0.5 border-t border-blue-100/30 pt-1">
                              {v.projects.map((p, idx) => (
                                <div key={idx} className="flex justify-between text-[10px] text-textMuted">
                                  <span className="truncate max-w-[160px]" title={p.name}>{p.name}</span>
                                  <span className="font-semibold">{p.open}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-danger bg-white border border-danger/30 rounded-lg hover:bg-danger/5 transition-all shadow-sm"
          >
            <Trash2 strokeWidth={1.5} size={16} />
            Zurücksetzen
          </button>
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImport} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-textMain bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <Upload strokeWidth={1.5} size={16} className="text-gray-500" />
            Projektstand importieren
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primaryHover hover:shadow-md transition-all shadow-sm"
          >
            <Download strokeWidth={1.5} size={16} />
            Speichern & Exportieren
          </button>
        </div>
      </div>
    </header>
  );
};
