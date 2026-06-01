import React, { useState } from 'react';
import { useStore, PipelineStage, PipelineProject } from '../store/useStore';
import { PipelineColumn } from './PipelineColumn';
import { PipelineProjectModal } from './PipelineProjectModal';
import { AddPipelineProjectModal } from './AddPipelineProjectModal';
import { Plus, GitBranch } from 'lucide-react';

interface ColumnConfig {
  stage: PipelineStage;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
}

const COLUMNS: ColumnConfig[] = [
  { 
    stage: 'opportunity', 
    title: 'Opportunity Identifiziert', 
    description: 'Neue Projektchance erkannt',
    icon: '🔵',
    accentColor: '#6b7280'
  },
  { 
    stage: 'intake', 
    title: 'Anfrage-Plattform', 
    description: 'Projektanfrage aus der Plattform erhalten',
    icon: '📨',
    accentColor: '#0891b2'
  },
  { 
    stage: 'go-nogo', 
    title: 'Go / No Go', 
    description: 'Bewertung & Entscheidung',
    icon: '🤔',
    accentColor: '#d97706'
  },
  { 
    stage: 'staffing', 
    title: 'Staffing', 
    description: 'Team zusammenstellen',
    icon: '👥',
    accentColor: '#7c3aed'
  },
  { 
    stage: 'kickoff', 
    title: 'Kickoff', 
    description: 'Bereit für den Projektstart',
    icon: '🚀',
    accentColor: '#059669'
  },
];

export const ProjectPipeline: React.FC = () => {
  const pipelineProjects = useStore(state => state.pipelineProjects);
  const addPipelineProject = useStore(state => state.addPipelineProject);
  const promotePipelineProject = useStore(state => state.promotePipelineProject);

  const [selectedProject, setSelectedProject] = useState<PipelineProject | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handlePromote = (project: PipelineProject) => {
    if (window.confirm(`"${project.name}" in den Projektpool übernehmen? Das Projekt wird aus der Pipeline entfernt und im Whiteboard angezeigt.`)) {
      promotePipelineProject(project.id);
    }
  };

  // Summary statistics
  const totalProjects = pipelineProjects.length;
  const totalRequired = pipelineProjects.reduce((sum, p) => 
    sum + p.requiredPositions.reduce((s, pos) => s + (pos.percentage ?? pos.count * 100), 0), 0);
  const totalFilled = pipelineProjects.reduce((sum, p) => 
    sum + p.requiredPositions.reduce((s, pos) => s + pos.assignedPersons.reduce((apSum, ap) => apSum + ap.percentage, 0), 0), 0);

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-textMain tracking-tight flex items-center gap-2.5">
            <GitBranch strokeWidth={1.5} size={22} className="text-primary" />
            Projekt-Pipeline
          </h2>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="text-xs text-textMuted">
              <strong className="text-textMain">{totalProjects}</strong> Projekte
            </span>
            <span className="text-xs text-textMuted">
              <strong className="text-textMain">{totalFilled}%</strong> / {totalRequired}% besetzt
            </span>
          </div>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-sm hover:bg-primaryHover transition-colors font-medium text-sm"
        >
          <Plus strokeWidth={1.5} size={16} />
          Neues Pipeline-Projekt
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <PipelineColumn
            key={col.stage}
            stage={col.stage}
            title={col.title}
            description={col.description}
            icon={col.icon}
            accentColor={col.accentColor}
            projects={pipelineProjects.filter(p => p.stage === col.stage)}
            onProjectClick={setSelectedProject}
            onPromote={col.stage === 'kickoff' ? handlePromote : undefined}
          />
        ))}
      </div>

      {/* Modals */}
      {selectedProject && (
        <PipelineProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {isAddModalOpen && (
        <AddPipelineProjectModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={(project) => {
            addPipelineProject(project);
            setIsAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
