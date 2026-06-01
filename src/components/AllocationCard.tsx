import React from 'react';
import { useStore, Allocation, ProjectRole, isSWE } from '../store/useStore';
import { Trash2 } from 'lucide-react';

interface Props {
  allocation: Allocation;
}

export const AllocationCard: React.FC<Props> = ({ allocation }) => {
  const employees = useStore(state => state.employees);
  const updateAllocation = useStore(state => state.updateAllocation);
  const removeAllocation = useStore(state => state.removeAllocation);

  const employee = employees.find(e => e.id === allocation.employeeId);
  if (!employee) return null;

  let availableRoles: ProjectRole[] = [employee.currentRole as ProjectRole];
  
  if (employee.currentRole === 'Proxy PO') {
    availableRoles = ['Proxy PO', 'Scrum Master'];
  } else if (employee.currentRole === 'Scrum Master') {
    availableRoles = ['Scrum Master', 'Proxy PO'];
  } else if (employee.currentRole === 'Test Consultant') {
    availableRoles = ['Test Consultant', 'Test Engineer'];
  } else if (employee.currentRole === 'Test Engineer') {
    availableRoles = ['Test Engineer', 'Test Consultant'];
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-card transition-all relative group hover:shadow-md">
      <button 
        onClick={() => removeAllocation(allocation.id)}
        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
        title="Mitarbeiter aus Projekt entfernen"
      >
        <Trash2 strokeWidth={1.5} size={14} />
      </button>

      <div className="flex items-center gap-2.5 mb-3 pr-6">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-textMain font-semibold text-xs shadow-sm">
          {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-textMain leading-tight truncate">{employee.name}</h4>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-textMuted">{employee.currentRole}</span>
            {allocation.isTechLead && (
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-bold uppercase tracking-wider">
                Tech-Lead
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2.5 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
        <div>
          <label className="block text-[10px] font-semibold text-textMuted mb-1 uppercase tracking-wider">Projektrolle</label>
          <select 
            value={allocation.projectRole || ''}
            onChange={e => updateAllocation(allocation.id, { projectRole: e.target.value as ProjectRole })}
            className={`w-full text-xs py-1.5 px-2 bg-white border ${!allocation.projectRole ? 'border-warning/50 ring-1 ring-warning/20' : 'border-gray-200'} rounded focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer`}
          >
            <option value="" disabled>Rolle wählen...</option>
            {availableRoles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="flex justify-between items-center text-[10px] font-semibold text-textMuted mb-1 uppercase tracking-wider">
            <span>Allokation</span>
            <span className={allocation.percentage === 0 ? 'text-warning font-bold' : 'text-primary font-bold'}>
              {allocation.percentage}%
            </span>
          </label>
          <div className="flex items-center gap-2">
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="5"
              value={allocation.percentage}
              onChange={e => updateAllocation(allocation.id, { percentage: parseInt(e.target.value) })}
              className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
        {isSWE(employee.currentRole) && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
            <input 
              type="checkbox" 
              id={`tech-lead-${allocation.id}`}
              checked={allocation.isTechLead || false}
              onChange={e => updateAllocation(allocation.id, { isTechLead: e.target.checked })}
              className="rounded text-primary focus:ring-primary/30 w-3 h-3 cursor-pointer"
            />
            <label 
              htmlFor={`tech-lead-${allocation.id}`} 
              className="text-[10px] font-semibold uppercase tracking-wider text-textMain cursor-pointer"
            >
              Zusatz: Tech-Lead
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
