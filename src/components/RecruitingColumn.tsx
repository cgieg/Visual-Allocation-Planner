import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Employee, NewcomerPhase, useStore } from '../store/useStore';
import { DraggableEmployeeCard } from './DraggableEmployeeCard';
import { UserPlus } from 'lucide-react';

interface Props {
  phase: NewcomerPhase;
  title: string;
  description: string;
  newcomers: Employee[];
}

export const RecruitingColumn: React.FC<Props> = ({ phase, title, description, newcomers }) => {
  const updateEmployee = useStore(state => state.updateEmployee);

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${phase}`,
    data: {
      type: 'recruiting-column',
      phase
    }
  });

  const handleActivate = (id: string) => {
    if (window.confirm("Soll dieser Mitarbeiter in den aktiven Pool übernommen werden?")) {
      updateEmployee(id, { status: 'active', newcomerPhase: undefined });
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 min-w-[300px] max-w-[400px] flex flex-col bg-gray-50/80 rounded-2xl border ${isOver ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-gray-200'} transition-all`}
    >
      <div className="p-4 border-b border-gray-200 bg-white rounded-t-2xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-textMain">{title}</h3>
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
            {newcomers.length}
          </span>
        </div>
        <p className="text-xs text-textMuted">{description}</p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {newcomers.map(newcomer => (
          <div key={newcomer.id} className="relative group">
            <DraggableEmployeeCard employee={newcomer} />
            {phase === 'ready' && (
              <button 
                onClick={() => handleActivate(newcomer.id)}
                className="absolute -top-3 -right-3 bg-success text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-600 z-[60]"
                title="In aktiven Pool übernehmen"
              >
                <UserPlus strokeWidth={1.5} size={16} />
              </button>
            )}
          </div>
        ))}
        {newcomers.length === 0 && (
          <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-textMuted text-sm text-center px-4">
            Hierher ziehen
          </div>
        )}
      </div>
    </div>
  );
};
