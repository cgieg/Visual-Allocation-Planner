import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useStore, Project, isSWE } from '../store/useStore';
import { Users, MessageSquareWarning, Trash2 } from 'lucide-react';
import { AllocationCard } from './AllocationCard';
import { ProjectTeamModal } from './ProjectTeamModal';

interface Props {
  project: Project;
}

const formatMMJJJJ = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const month = parts[1];
    return `${month}/${year}`;
  }
  return dateStr;
};

export const ProjectCard: React.FC<Props> = ({ project }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: project.id,
    data: {
      type: 'project',
      project
    }
  });
  
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const employees = useStore(state => state.employees);
  const allAllocations = useStore(state => state.allocations);
  const removeProject = useStore(state => state.removeProject);
  const allocations = allAllocations.filter(a => a.projectId === project.id);

  // Calculate unstaffed / open positions (vacancies)
  const vacancies = (project.requiredPositions || []).map(pos => {
    const filledPercentage = allocations
      .filter(a => a.projectRole === pos.role)
      .reduce((sum, a) => sum + a.percentage, 0);
    const openPercentage = Math.max(0, (pos.percentage ?? 100) - filledPercentage);
    return {
      role: pos.role,
      target: pos.percentage ?? 100,
      filled: filledPercentage,
      open: openPercentage
    };
  }).filter(v => v.open > 0);

  const sortedAllocations = [...allocations].sort((a, b) => {
    const aEmp = employees.find(e => e.id === a.employeeId);
    const bEmp = employees.find(e => e.id === b.employeeId);
    if (!aEmp || !bEmp) return 0;

    const aTotal = allAllocations.filter(alloc => alloc.employeeId === a.employeeId).reduce((sum, alloc) => sum + alloc.percentage, 0);
    const bTotal = allAllocations.filter(alloc => alloc.employeeId === b.employeeId).reduce((sum, alloc) => sum + alloc.percentage, 0);

    const aRed = aTotal > 100 ? 1 : 0;
    const bRed = bTotal > 100 ? 1 : 0;

    if (aRed !== bRed) {
      return bRed - aRed; // Red (1) comes first
    }

    return aEmp.name.localeCompare(bEmp.name); // Alphabetical by employee name
  });

  // Check if team has Tech-Lead eligible roles but no Tech-Lead
  const sweAllocations = allocations.filter(a => {
    const emp = employees.find(e => e.id === a.employeeId);
    return emp && isSWE(emp.currentRole);
  });
  const hasSwe = sweAllocations.length > 1;
  const hasTechLead = sweAllocations.some(a => a.isTechLead);
  const isMissingTechLead = hasSwe && !hasTechLead;
  
  const bgColorClass = project.themeColor || 'bg-project-gray';

  const handleDelete = () => {
    if (window.confirm(`Möchtest du das Projekt "${project.name}" wirklich löschen?`)) {
      removeProject(project.id);
    }
  };

  return (
    <>
      <div 
        ref={setNodeRef}
        className={`rounded-2xl border ${isOver ? 'border-primary ring-2 ring-primary/20 scale-[1.02]' : isMissingTechLead ? 'animate-border-pulse-warning border-warning' : 'border-gray-200'} shadow-sm bg-white overflow-hidden transition-all duration-300 ease-out flex flex-col h-[600px] hover:-translate-y-1 hover:shadow-lg animate-fade-in-up`}
      >
        <div className={`p-4 flex justify-between items-center border-b border-gray-100 ${bgColorClass}`}>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-textMain leading-tight">{project.name}</h3>
            {isMissingTechLead && (
              <span 
                className="px-1.5 py-0.5 bg-warning/10 text-warning border border-warning/30 rounded text-[9px] font-bold uppercase tracking-wider animate-pulse"
                title="Mehrere SWEs im Projekt, aber kein Tech-Lead bestimmt!"
              >
                ⚠️ Kein Tech-Lead
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsTeamModalOpen(true)}
              className="p-1.5 text-textMain/70 hover:bg-white/50 rounded-md transition-colors flex items-center gap-1 text-xs font-medium relative"
              title="Team-Status (Risiken & Potenziale)"
            >
              <MessageSquareWarning strokeWidth={1.5} size={18} />
              {(project.teamRisks || project.teamPotentials) && (
                <div className="w-2.5 h-2.5 rounded-full bg-danger absolute -top-0.5 -right-0.5 border border-white"></div>
              )}
            </button>
            <button 
              onClick={handleDelete}
              className="p-1.5 text-textMain/70 hover:text-danger hover:bg-white/50 rounded-md transition-colors"
              title="Projekt löschen"
            >
              <Trash2 strokeWidth={1.5} size={18} />
            </button>
          </div>
        </div>

        {/* Project Metadata Section */}
        {(project.client || project.deliveryLead || project.contactPlatform || project.contactDepartment || project.estimatedStart || project.estimatedEnd || project.description) && (
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex flex-col flex-shrink-0">
            {project.description && (
              <div className="text-[11px] text-textMain/80 italic leading-snug line-clamp-2" title={project.description}>
                {project.description}
              </div>
            )}
            {(project.client || project.deliveryLead || project.contactPlatform || project.contactDepartment || project.estimatedStart || project.estimatedEnd) && (
              <div className={`text-[10px] text-textMuted grid grid-cols-2 gap-x-3 gap-y-1.5 ${project.description ? 'pt-2 border-t border-gray-200/50 mt-2' : ''}`}>
                {project.client && (
                  <div>
                    <span className="font-semibold text-textMain/80 block">Kundenbereich / Abteilung</span>
                    <span className="truncate block" title={project.client}>{project.client}</span>
                  </div>
                )}
                {(project.estimatedStart || project.estimatedEnd) && (
                  <div>
                    <span className="font-semibold text-textMain/80 block">Laufzeit</span>
                    <span>
                      {project.estimatedStart ? formatMMJJJJ(project.estimatedStart) : '–'} bis {project.estimatedEnd ? formatMMJJJJ(project.estimatedEnd) : '–'}
                    </span>
                  </div>
                )}
                {project.deliveryLead && (
                  <div>
                    <span className="font-semibold text-textMain/80 block">Delivery Lead</span>
                    <span className="truncate block" title={project.deliveryLead}>{project.deliveryLead}</span>
                  </div>
                )}
                {project.contactPlatform && (
                  <div>
                    <span className="font-semibold text-textMain/80 block">Ansprechpartner Anfrage-Kanal</span>
                    <span className="truncate block" title={project.contactPlatform}>{project.contactPlatform}</span>
                  </div>
                )}
                {project.contactDepartment && (
                  <div className="col-span-2">
                    <span className="font-semibold text-textMain/80 block">Ansprechpartner Bereich</span>
                    <span className="truncate block" title={project.contactDepartment}>{project.contactDepartment}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="p-4 flex-1 overflow-y-auto bg-gray-50/30">
          <div className="space-y-3">
            {allocations.length === 0 ? (
              <div className="h-full min-h-[200px] flex items-center justify-center text-center text-textMuted flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users strokeWidth={1.5} size={24} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium">Mitarbeiter aus dem Pool<br/>hierher ziehen</p>
              </div>
            ) : (
              sortedAllocations.map(allocation => (
                <AllocationCard key={allocation.id} allocation={allocation} />
              ))
            )}
          </div>
        </div>

        {/* Vacancies / Offene Rollen Section */}
        {vacancies.length > 0 && (
          <div className="px-4 py-2.5 bg-amber-50/70 border-t border-amber-100/50 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1.5">
              <span>🔍 Offener Bedarf (Vakanzen)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {vacancies.map(v => (
                <span 
                  key={v.role} 
                  className="px-2 py-0.5 bg-white border border-amber-200/60 rounded-md text-[10px] font-bold text-amber-800 shadow-sm flex items-center gap-1"
                  title={`Soll: ${v.target}% | Besetzt: ${v.filled}%`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {v.role}: {v.open}% offen
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {isTeamModalOpen && (
        <ProjectTeamModal project={project} onClose={() => setIsTeamModalOpen(false)} />
      )}
    </>
  );
};
