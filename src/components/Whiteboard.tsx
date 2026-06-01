import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ProjectCard } from './ProjectCard';
import { Plus, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export const Whiteboard: React.FC = () => {
  const projects = useStore(state => state.projects);
  const addProject = useStore(state => state.addProject);
  const allocations = useStore(state => state.allocations);
  
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Calculate unstaffed / open positions (vacancies) across all active projects
  const globalVacancies: Record<string, { role: string; open: number; projects: Array<{ name: string; open: number }> }> = {};

  projects.forEach(proj => {
    const projAllocations = allocations.filter(a => a.projectId === proj.id);
    (proj.requiredPositions || []).forEach(pos => {
      const filled = projAllocations
        .filter(a => a.projectRole === pos.role)
        .reduce((sum, a) => sum + a.percentage, 0);
      const open = Math.max(0, (pos.percentage ?? 100) - filled);
      
      if (open > 0) {
        if (!globalVacancies[pos.role]) {
          globalVacancies[pos.role] = {
            role: pos.role,
            open: 0,
            projects: []
          };
        }
        globalVacancies[pos.role].open += open;
        globalVacancies[pos.role].projects.push({ name: proj.name, open });
      }
    });
  });

  const globalVacanciesList = Object.values(globalVacancies).sort((a, b) => b.open - a.open);
  const totalOpenFte = globalVacanciesList.reduce((sum, v) => sum + v.open, 0);

  const handleAddProject = () => {
    const name = window.prompt("Name des neuen Projekts:");
    if (!name) return;
    
    // Use pastel colors for projects
    const colors = ['bg-project-blue', 'bg-project-green', 'bg-project-purple', 'bg-project-orange', 'bg-project-pink', 'bg-project-yellow', 'bg-project-gray'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    addProject({
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name,
      themeColor: randomColor,
      teamRisks: '',
      teamPotentials: '',
      description: ''
    });
  };

  return (
    <div className="p-8 h-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-textMain tracking-tight">Projekt-Pool</h2>
        <button 
          onClick={handleAddProject}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-textMain rounded-lg shadow-sm hover:bg-gray-50 transition-colors font-medium text-sm"
        >
          <Plus strokeWidth={1.5} size={16} />
          Neues Projekt
        </button>
      </div>

      {/* Bedarfsanalyse Widget */}
      {globalVacanciesList.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-amber-200/70 shadow-sm overflow-hidden transition-all duration-300">
          <div 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-amber-50/20 transition-colors bg-amber-50/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 font-bold">
                <AlertCircle strokeWidth={1.5} size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-textMain">Kapazitäts- & Bedarfsanalyse (Vakanzen im Pool)</h3>
                <p className="text-xs text-textMuted mt-0.5">
                  Es gibt aktuell <strong>{globalVacanciesList.length} Rollen</strong> mit unbesetztem Bedarf (insgesamt <strong>{totalOpenFte}% FTE</strong>).
                </p>
              </div>
            </div>
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-all">
              {isCollapsed ? <ChevronDown strokeWidth={1.5} size={18} /> : <ChevronUp strokeWidth={1.5} size={18} />}
            </button>
          </div>

          {!isCollapsed && (
            <div className="px-5 pb-5 border-t border-amber-100/50 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 animate-fade-in-up">
              {globalVacanciesList.map(v => (
                <div key={v.role} className="p-3 bg-amber-50/20 border border-amber-100/60 rounded-xl flex flex-col justify-between hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      {v.role}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100/50 border border-amber-200 text-amber-800 text-[10px] font-extrabold rounded-full">
                      {v.open}% FTE offen
                    </span>
                  </div>
                  
                  {/* List of projects needing this role */}
                  <div className="space-y-1 mt-1">
                    <div className="text-[10px] font-semibold text-textMuted uppercase tracking-wider mb-1">Benötigt in:</div>
                    {v.projects.map((p, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] text-textMain">
                        <span className="font-medium truncate max-w-[150px]" title={p.name}>{p.name}</span>
                        <span className="font-semibold text-amber-800 bg-white border border-amber-100 rounded px-1">{p.open}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 auto-rows-max items-start">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
        {projects.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50">
            <p className="text-textMuted font-medium">Noch keine Projekte angelegt.</p>
            <button 
              onClick={handleAddProject}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg shadow-sm hover:bg-primaryHover transition-colors font-medium text-sm inline-flex items-center gap-2"
            >
              <Plus strokeWidth={1.5} size={16} />
              Erstes Projekt erstellen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
