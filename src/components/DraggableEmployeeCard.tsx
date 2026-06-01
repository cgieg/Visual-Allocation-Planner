import { useDraggable } from '@dnd-kit/core';
import { EmployeeCard } from './EmployeeCard';
import { Employee } from '../store/useStore';

interface Props {
  employee: Employee;
}

export const DraggableEmployeeCard: React.FC<Props> = ({ employee }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: employee.id,
    data: {
      type: 'employee',
      employee
    }
  });

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`${isDragging ? 'opacity-40 scale-95' : ''} transition-transform z-50 relative`}
    >
      <EmployeeCard employee={employee} />
    </div>
  );
};
