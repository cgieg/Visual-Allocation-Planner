import React, { useState } from 'react';
import { useStore, NewcomerPhase } from '../store/useStore';
import { RecruitingColumn } from './RecruitingColumn';
import { Plus } from 'lucide-react';
import { AddEmployeeModal } from './AddEmployeeModal';

export const RecruitingBoard: React.FC = () => {
  const employees = useStore(state => state.employees);
  const addEmployee = useStore(state => state.addEmployee);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const newcomers = employees.filter(e => e.status === 'newcomer');

  const handleAddNewcomer = (data: {name: string, role: string}) => {
    addEmployee({
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name: data.name,
      currentRole: data.role,
      skills: [],
      risks: '',
      potentials: '',
      status: 'newcomer',
      newcomerPhase: 'contract'
    });
    setIsAddModalOpen(false);
  };

  const columns: { id: NewcomerPhase, title: string, description: string }[] = [
    { id: 'contract', title: 'Vertragsphase', description: 'Vertragserstellung & Unterschrift' },
    { id: 'prep', title: 'Onboarding-Vorbereitung', description: 'IT-Equipment & Zugänge' },
    { id: 'preboarding', title: 'Pre-Boarding', description: 'Kontakt halten bis zum Start' },
    { id: 'ready', title: 'Erster Arbeitstag', description: 'Bereit für den Projektstart' },
  ];

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-textMain tracking-tight">Personalpipeline</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-sm hover:bg-primaryHover transition-colors font-medium text-sm"
        >
          <Plus strokeWidth={1.5} size={16} />
          Neuen Kandidaten anlegen
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map(col => (
          <RecruitingColumn 
            key={col.id} 
            phase={col.id} 
            title={col.title} 
            description={col.description}
            newcomers={newcomers.filter(n => n.newcomerPhase === col.id)}
          />
        ))}
      </div>
      
      {isAddModalOpen && (
        <AddEmployeeModal 
          title="Neuen Kandidaten anlegen"
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddNewcomer}
        />
      )}
    </div>
  );
};
