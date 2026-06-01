import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { PipelineProject, useStore } from '../store/useStore';
import { ArrowRight, Users } from 'lucide-react';

interface Props {
  project: PipelineProject;
  onClick: () => void;
  onPromote?: () => void;
}

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

export const PipelineProjectCard: React.FC<Props> = ({ project, onClick, onPromote }) => {
  const employees = useStore(state => state.employees);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pipeline-${project.id}`,
    data: {
      type: 'pipeline-project',
      project
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Calculate total required and filled percentages
  const totalRequired = project.requiredPositions.reduce((sum, pos) => sum + (pos.percentage ?? pos.count * 100), 0);
  const totalFilled = project.requiredPositions.reduce((sum, pos) => sum + pos.assignedPersons.reduce((s, ap) => s + ap.percentage, 0), 0);
  const fillPercentage = totalRequired > 0 ? Math.min((totalFilled / totalRequired) * 100, 100) : 0;

  // Check if any assigned person is a newcomer
  const allAssignedIds = project.requiredPositions.flatMap(pos => pos.assignedPersons.map(ap => ap.employeeId));
  const hasNewcomers = allAssignedIds.some(id => {
    const emp = employees.find(e => e.id === id);
    return emp && emp.status === 'newcomer';
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative bg-white rounded-xl border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-gray-300 ${
        isDragging ? 'opacity-40 scale-95' : ''
      }`}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      {/* Color stripe */}
      <div 
        className="h-1.5 rounded-t-xl"
        style={{ backgroundColor: project.color.startsWith('bg-') ? undefined : project.color }}
      />
      
      <div className="p-3.5">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-textMain text-sm truncate">{project.name}</h4>
            {project.client && (
              <p className="text-xs text-textMuted mt-0.5 truncate">{project.client}</p>
            )}
          </div>
          {hasNewcomers && (
            <span className="ml-2 flex-shrink-0 px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[10px] font-medium text-amber-700">
              Newcomer
            </span>
          )}
        </div>
 
        {/* Role tags */}
        {project.requiredPositions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {project.requiredPositions.map(pos => {
              const requiredPercentage = pos.percentage ?? pos.count * 100;
              const filledPercentage = pos.assignedPersons.reduce((s, ap) => s + ap.percentage, 0);
              const isFull = filledPercentage >= requiredPercentage;
              return (
                <span 
                  key={pos.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                    isFull 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <span 
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: roleColors[pos.role] || '#6b7280' }}
                  />
                  {requiredPercentage}% {pos.role}
                  <span className={`ml-0.5 ${isFull ? 'text-emerald-500' : 'text-gray-400'}`}>
                    ({filledPercentage}% / {requiredPercentage}%)
                  </span>
                </span>
              );
            })}
          </div>
        )}

        {/* Progress bar */}
        {totalRequired > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-[10px] text-textMuted mb-1">
              <span className="flex items-center gap-1">
                <Users strokeWidth={1.5} size={10} />
                Besetzung
              </span>
              <span className="font-medium">{totalFilled}% / {totalRequired}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${fillPercentage}%`,
                  backgroundColor: fillPercentage >= 100 ? '#059669' : fillPercentage > 0 ? '#008bd2' : '#e5e7eb'
                }}
              />
            </div>
          </div>
        )}

        {/* Dates */}
        {(project.estimatedStart || project.estimatedEnd) && (
          <p className="text-[10px] text-textMuted">
            {project.estimatedStart && formatMMJJJJ(project.estimatedStart)}
            {project.estimatedStart && project.estimatedEnd && ' – '}
            {project.estimatedEnd && formatMMJJJJ(project.estimatedEnd)}
          </p>
        )}
      </div>

      {/* Promote button - only in kickoff column */}
      {onPromote && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`"${project.name}" in den Projektpool übernehmen? Das Projekt wird aus der Pipeline entfernt und im Whiteboard angezeigt.`)) {
              onPromote();
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border-t border-emerald-200 rounded-b-xl text-emerald-700 text-xs font-medium transition-colors"
          title="In den Projektpool übernehmen"
        >
          <span>Zum Projektpool</span>
          <ArrowRight strokeWidth={1.5} size={12} />
        </button>
      )}
    </div>
  );
};
