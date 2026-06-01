import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { PipelineProject, PipelineStage } from '../store/useStore';
import { PipelineProjectCard } from './PipelineProjectCard';

interface Props {
  stage: PipelineStage;
  title: string;
  description: string;
  icon: string;
  projects: PipelineProject[];
  accentColor: string;
  onProjectClick: (project: PipelineProject) => void;
  onPromote?: (project: PipelineProject) => void;
}

export const PipelineColumn: React.FC<Props> = ({ stage, title, description, icon, projects, accentColor, onProjectClick, onPromote }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `pipeline-column-${stage}`,
    data: {
      type: 'pipeline-column',
      stage
    }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] max-w-[340px] flex flex-col rounded-2xl border transition-all ${
        isOver 
          ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
          : 'border-gray-200 bg-gray-50/80'
      }`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200 bg-white rounded-t-2xl">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <h3 className="font-bold text-textMain text-sm">{title}</h3>
          </div>
          <span 
            className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {projects.length}
          </span>
        </div>
        <p className="text-xs text-textMuted leading-relaxed">{description}</p>
      </div>

      {/* Column Content */}
      <div className="p-3 flex-1 overflow-y-auto space-y-3">
        {projects.map(project => (
          <PipelineProjectCard 
            key={project.id} 
            project={project}
            onClick={() => onProjectClick(project)}
            onPromote={stage === 'kickoff' && onPromote ? () => onPromote(project) : undefined}
          />
        ))}
        {projects.length === 0 && (
          <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-textMuted text-sm text-center px-4">
            Projekte hierher ziehen
          </div>
        )}
      </div>
    </div>
  );
};
