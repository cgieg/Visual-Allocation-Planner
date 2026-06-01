import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Search, Filter, Plus } from 'lucide-react';
import { DraggableEmployeeCard } from './DraggableEmployeeCard';
import { AddEmployeeModal } from './AddEmployeeModal';

export const Sidebar: React.FC = () => {
  const { employees, allocations, pipelineProjects } = useStore();
  const addEmployee = useStore(state => state.addEmployee);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showBenchOnly, setShowBenchOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getEmployeeTotalAllocation = (empId: string) => {
    const empAllocations = allocations.filter(alloc => alloc.employeeId === empId);
    const poolTotal = empAllocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
    
    const pipelineAllocations = pipelineProjects.flatMap(p => 
      p.requiredPositions.flatMap(pos => 
        pos.assignedPersons
           .filter(ap => ap.employeeId === empId)
           .map(ap => ap.percentage)
      )
    );
    const pipelineTotal = pipelineAllocations.reduce((sum, perc) => sum + perc, 0);
    return poolTotal + pipelineTotal;
  };

  const activeEmployees = employees.filter(e => e.status === 'active');
  
  const filteredEmployees = activeEmployees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter ? e.currentRole === roleFilter : true;
    
    let matchesBench = true;
    if (showBenchOnly) {
      matchesBench = getEmployeeTotalAllocation(e.id) < 100;
    }
    
    return matchesSearch && matchesRole && matchesBench;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const aAllocations = allocations.filter(alloc => alloc.employeeId === a.id);
    const bAllocations = allocations.filter(alloc => alloc.employeeId === b.id);
    const aTotal = aAllocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
    const bTotal = bAllocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
    
    const aRed = aTotal > 100 ? 1 : 0;
    const bRed = bTotal > 100 ? 1 : 0;
    
    if (aRed !== bRed) {
      return bRed - aRed; // Red (1) comes before not red (0)
    }
    
    return a.name.localeCompare(b.name); // Secondary alphabetical sort
  });

  const roles = Array.from(new Set(activeEmployees.map(e => e.currentRole)));

  const handleAddEmployee = (data: {name: string, role: string}) => {
    addEmployee({
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name: data.name,
      currentRole: data.role,
      skills: [],
      risks: '',
      potentials: '',
      status: 'active'
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-surface border-l border-gray-200">
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-textMain text-lg">Mitarbeiter-Pool</h3>
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
              {filteredEmployees.length}
            </span>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
            title="Neuen Mitarbeiter anlegen"
          >
            <Plus strokeWidth={1.5} size={16} />
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <Search strokeWidth={1.5} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Suchen (Name, Skill)..." 
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter strokeWidth={1.5} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm cursor-pointer"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Alle Rollen</option>
              {roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center mt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={showBenchOnly}
                  onChange={() => setShowBenchOnly(!showBenchOnly)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${showBenchOnly ? 'bg-primary' : 'bg-gray-200'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showBenchOnly ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="text-sm font-medium text-textMain group-hover:text-primary transition-colors">
                Nur Bench anzeigen (&lt;100%)
              </span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
        <div className="space-y-3">
          {sortedEmployees.map(employee => (
            <DraggableEmployeeCard key={employee.id} employee={employee} />
          ))}
          {sortedEmployees.length === 0 && (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search strokeWidth={1.5} size={20} className="text-gray-400" />
              </div>
              <p className="text-textMuted text-sm">Keine Mitarbeiter gefunden.</p>
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <AddEmployeeModal 
          title="Neuen Mitarbeiter anlegen"
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddEmployee}
        />
      )}
    </div>
  );
};
