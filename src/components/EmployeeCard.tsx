import { useState } from 'react';
import { useStore, Employee } from '../store/useStore';
import { AlertCircle, Pencil } from 'lucide-react';
import { EmployeeModal } from './EmployeeModal';

interface EmployeeCardProps {
  employee: Employee;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const allAllocations = useStore(state => state.allocations);
  const pipelineProjects = useStore(state => state.pipelineProjects);
  const allocations = allAllocations.filter(a => a.employeeId === employee.id);
  
  const pipelineAllocations = pipelineProjects.flatMap(p => 
    p.requiredPositions.flatMap(pos => 
      pos.assignedPersons
         .filter(ap => ap.employeeId === employee.id)
         .map(ap => ({ percentage: ap.percentage }))
    )
  );

  const totalAllocation = allocations.reduce((sum, a) => sum + a.percentage, 0) + pipelineAllocations.reduce((sum, a) => sum + a.percentage, 0);
  const isOverloaded = totalAllocation > 100;
  
  let progressColor = 'bg-primary';
  if (totalAllocation > 100) progressColor = 'bg-danger';
  else if (totalAllocation === 100) progressColor = 'bg-success';
  else if (totalAllocation > 0) progressColor = 'bg-warning';

  return (
    <>
      <div 
        className={`bg-white rounded-xl p-3 border ${isOverloaded ? 'border-danger/40 ring-1 ring-danger/10' : 'border-gray-200'} shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 ease-out group animate-fade-in-up cursor-grab active:cursor-grabbing`}
      >
        <div className="flex justify-between items-start mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-textMain font-semibold text-xs shadow-sm">
              {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-textMain leading-tight">
                {employee.name}
              </h4>
              <p className="text-xs text-textMuted mt-0.5 font-medium">{employee.currentRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {employee.risks && <span title="Risiko hinterlegt" className="flex"><AlertCircle strokeWidth={1.5} size={15} className="text-warning drop-shadow-sm" /></span>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
              title="Profil bearbeiten"
            >
              <Pencil strokeWidth={1.5} size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {employee.skills.slice(0, 3).map(skill => (
            <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-medium border border-gray-200/60">
              {skill}
            </span>
          ))}
          {employee.skills.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md text-[10px] font-medium border border-gray-100">
              +{employee.skills.length - 3}
            </span>
          )}
        </div>

        <div className="mt-auto">
          <div className="flex justify-between text-[11px] font-semibold mb-1.5">
            <span className="text-textMuted">Gesamtauslastung</span>
            <span className={isOverloaded ? 'text-danger' : 'text-textMain'}>
              {totalAllocation}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full ${progressColor} transition-all duration-500 ease-out`} 
              style={{ width: `${Math.min(totalAllocation, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <EmployeeModal 
          employee={employee} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
};
