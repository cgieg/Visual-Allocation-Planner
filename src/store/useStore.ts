import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ProjectRole = 'Proxy PO' | 'Scrum Master' | 'SWE Frontend' | 'SWE Backend' | 'Architekt' | 'UI/UX Designer' | 'Test Consultant' | 'Test Engineer';
export type NewcomerPhase = 'contract' | 'prep' | 'preboarding' | 'ready';
export type EmployeeStatus = 'active' | 'newcomer';

// Pipeline types
export type PipelineStage = 'opportunity' | 'intake' | 'go-nogo' | 'staffing' | 'kickoff';

export interface AssignedPerson {
  employeeId: string;
  percentage: number;
}

export interface RequiredPosition {
  id: string;
  role: ProjectRole;
  count: number; // Keeping for backward compatibility or pure headcount
  percentage?: number; // The requested percentage (e.g. 100 for 100%)
  assignedPersons: AssignedPerson[];
}

export interface PipelineProject {
  id: string;
  name: string;
  client: string;
  description: string;
  stage: PipelineStage;
  requiredPositions: RequiredPosition[];
  estimatedStart: string;
  estimatedEnd: string;
  color: string;
  createdAt: string;
  contactPlatform?: string;
  contactDepartment?: string;
  deliveryLead?: string;
}

export interface Employee {
  id: string;
  name: string;
  currentRole: string;
  skills: string[];
  risks: string;
  potentials: string;
  status: EmployeeStatus;
  newcomerPhase?: NewcomerPhase;
  startDate?: string;
}

export interface Project {
  id: string;
  name: string;
  themeColor: string;
  teamRisks: string;
  teamPotentials: string;
  client?: string;
  deliveryLead?: string;
  contactPlatform?: string;
  contactDepartment?: string;
  estimatedStart?: string;
  estimatedEnd?: string;
  description?: string;
  requiredPositions?: RequiredPosition[];
}

export interface Allocation {
  id: string;
  employeeId: string;
  projectId: string;
  projectRole: ProjectRole | null;
  percentage: number;
  isTechLead?: boolean;
}

export interface AppState {
  employees: Employee[];
  projects: Project[];
  allocations: Allocation[];
  pipelineProjects: PipelineProject[];
  metadata: {
    lastEditedBy: string | null;
    lastEditedAt: string | null;
  };
  setEmployees: (employees: Employee[]) => void;
  setProjects: (projects: Project[]) => void;
  setAllocations: (allocations: Allocation[]) => void;
  setMetadata: (by: string) => void;
  importState: (state: Partial<AppState>) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  removeProject: (id: string) => void;
  addAllocation: (allocation: Allocation) => void;
  updateAllocation: (id: string, allocation: Partial<Allocation>) => void;
  removeAllocation: (id: string) => void;
  // Pipeline actions
  addPipelineProject: (project: PipelineProject) => void;
  updatePipelineProject: (id: string, updates: Partial<PipelineProject>) => void;
  removePipelineProject: (id: string) => void;
  movePipelineStage: (id: string, newStage: PipelineStage) => void;
  assignPersonToPosition: (projectId: string, positionId: string, person: AssignedPerson) => void;
  removePersonFromPosition: (projectId: string, positionId: string, employeeId: string) => void;
  promotePipelineProject: (id: string) => void;
  resetData: () => void;
}

export const isSWE = (role: string | null | undefined): boolean => {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return normalized.includes('swe') || 
         normalized.includes('software') || 
         normalized.includes('entwickler') ||
         normalized.includes('architekt') ||
         normalized.includes('architect');
};

const normalizeState = (employees: Employee[], allocations: Allocation[]) => {
  const normalizedEmployees = employees.map(emp => {
    if (emp.currentRole === 'SWE') {
      return { ...emp, currentRole: 'SWE Frontend' };
    }
    return emp;
  });

  const normalizedAllocations = allocations.map(a => {
    let projectRole = a.projectRole;
    if ((projectRole as string) === 'SWE') {
      projectRole = 'SWE Frontend';
    }
    return { ...a, projectRole };
  });

  return {
    employees: normalizedEmployees,
    allocations: normalizedAllocations
  };
};

const adjustAllocations = (allocations: Allocation[], employees: Employee[]): Allocation[] => {
  const projectSWEs: { [projectId: string]: Allocation[] } = {};
  
  allocations.forEach(a => {
    const emp = employees.find(e => e.id === a.employeeId);
    if (emp && isSWE(emp.currentRole)) {
      if (!projectSWEs[a.projectId]) {
        projectSWEs[a.projectId] = [];
      }
      projectSWEs[a.projectId].push(a);
    }
  });

  let updatedAllocations = [...allocations];

  Object.entries(projectSWEs).forEach(([projectId, sweAllocs]) => {
    if (sweAllocs.length === 0) return;

    const techLeads = sweAllocs.filter(a => a.isTechLead);
    
    if (techLeads.length === 1) {
      return;
    }

    if (techLeads.length > 1) {
      const keepId = techLeads[0].id;
      updatedAllocations = updatedAllocations.map(a => {
        if (a.projectId === projectId && a.id !== keepId) {
          const emp = employees.find(e => e.id === a.employeeId);
          if (emp && isSWE(emp.currentRole) && a.isTechLead) {
            return { ...a, isTechLead: false };
          }
        }
        return a;
      });
    }
  });

  updatedAllocations = updatedAllocations.map(a => {
    const emp = employees.find(e => e.id === a.employeeId);
    if (emp && !isSWE(emp.currentRole) && a.isTechLead) {
      return { ...a, isTechLead: false };
    }
    return a;
  });

  return updatedAllocations;
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      employees: [],
      projects: [],
      allocations: [],
      pipelineProjects: [],
      metadata: {
        lastEditedBy: null,
        lastEditedAt: null,
      },
      setEmployees: (employees) => set((state) => {
        const normalized = normalizeState(employees, state.allocations);
        return {
          employees: normalized.employees,
          allocations: adjustAllocations(normalized.allocations, normalized.employees)
        };
      }),
      setProjects: (projects) => set({ projects }),
      setAllocations: (allocations) => set((state) => {
        const normalized = normalizeState(state.employees, allocations);
        return {
          employees: normalized.employees,
          allocations: adjustAllocations(normalized.allocations, normalized.employees)
        };
      }),
      setMetadata: (by) => set({ metadata: { lastEditedBy: by, lastEditedAt: new Date().toISOString() } }),
      importState: (stateData) => set((prev) => {
        // Migration of imported state data
        if (stateData.projects) {
          stateData.projects = stateData.projects.map(p => {
            const anyP = p as any;
            if (anyP.contactFlexhub !== undefined && anyP.contactPlatform === undefined) {
              anyP.contactPlatform = anyP.contactFlexhub;
              delete anyP.contactFlexhub;
            }
            return p;
          });
        }
        if (stateData.pipelineProjects) {
          stateData.pipelineProjects = stateData.pipelineProjects.map(p => {
            const anyP = p as any;
            if (anyP.contactFlexhub !== undefined && anyP.contactPlatform === undefined) {
              anyP.contactPlatform = anyP.contactFlexhub;
              delete anyP.contactFlexhub;
            }
            if (anyP.stage === 'flexhub') {
              anyP.stage = 'intake';
            }
            return p;
          });
        }

        const nextEmployees = stateData.employees !== undefined ? stateData.employees : prev.employees;
        const nextAllocations = stateData.allocations !== undefined ? stateData.allocations : prev.allocations;
        
        const normalized = normalizeState(nextEmployees, nextAllocations);
        const adjusted = adjustAllocations(normalized.allocations, normalized.employees);
        
        return {
          ...prev,
          ...stateData,
          employees: normalized.employees,
          allocations: adjusted
        };
      }),
      addEmployee: (employee) => set((state) => {
        const nextEmployees = [...state.employees, employee];
        const normalized = normalizeState(nextEmployees, state.allocations);
        const adjusted = adjustAllocations(normalized.allocations, normalized.employees);
        return {
          employees: normalized.employees,
          allocations: adjusted
        };
      }),
      updateEmployee: (id, employeeData) => set((state) => {
        const nextEmployees = state.employees.map(e => e.id === id ? { ...e, ...employeeData } : e);
        const normalized = normalizeState(nextEmployees, state.allocations);
        const adjusted = adjustAllocations(normalized.allocations, normalized.employees);
        return {
          employees: normalized.employees,
          allocations: adjusted
        };
      }),
      removeEmployee: (id) => set((state) => ({
        employees: state.employees.filter(e => e.id !== id),
        allocations: state.allocations.filter(a => a.employeeId !== id),
        pipelineProjects: state.pipelineProjects.map(p => ({
          ...p,
          requiredPositions: p.requiredPositions.map(pos => ({
            ...pos,
            assignedPersons: pos.assignedPersons.filter(ap => ap.employeeId !== id)
          }))
        }))
      })),
      addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
      updateProject: (id, projectData) => set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...projectData } : p)
      })),
      removeProject: (id) => set((state) => ({
        projects: state.projects.filter(p => p.id !== id),
        allocations: state.allocations.filter(a => a.projectId !== id)
      })),
      addAllocation: (allocation) => set((state) => {
        const nextAllocations = [...state.allocations, allocation];
        const normalized = normalizeState(state.employees, nextAllocations);
        const adjusted = adjustAllocations(normalized.allocations, normalized.employees);
        return {
          employees: normalized.employees,
          allocations: adjusted
        };
      }),
      updateAllocation: (id, allocationData) => set((state) => {
        let nextAllocations = state.allocations.map(a => a.id === id ? { ...a, ...allocationData } : a);
        
        const target = nextAllocations.find(a => a.id === id);
        if (target) {
          const emp = state.employees.find(e => e.id === target.employeeId);
          if (emp && isSWE(emp.currentRole) && allocationData.isTechLead === true) {
            nextAllocations = nextAllocations.map(a => {
              if (a.id === id || a.projectId !== target.projectId) return a;
              const otherEmp = state.employees.find(e => e.id === a.employeeId);
              if (otherEmp && isSWE(otherEmp.currentRole)) {
                return { ...a, isTechLead: false };
              }
              return a;
            });
          }
        }

        const normalized = normalizeState(state.employees, nextAllocations);
        const adjusted = adjustAllocations(normalized.allocations, normalized.employees);
        return {
          employees: normalized.employees,
          allocations: adjusted
        };
      }),
      removeAllocation: (id) => set((state) => {
        const nextAllocations = state.allocations.filter(a => a.id !== id);
        const normalized = normalizeState(state.employees, nextAllocations);
        const adjusted = adjustAllocations(normalized.allocations, normalized.employees);
        return {
          employees: normalized.employees,
          allocations: adjusted
        };
      }),

      // Pipeline actions
      addPipelineProject: (project) => set((state) => ({
        pipelineProjects: [...state.pipelineProjects, project]
      })),

      updatePipelineProject: (id, updates) => set((state) => ({
        pipelineProjects: state.pipelineProjects.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      removePipelineProject: (id) => set((state) => ({
        pipelineProjects: state.pipelineProjects.filter(p => p.id !== id)
      })),

      movePipelineStage: (id, newStage) => set((state) => ({
        pipelineProjects: state.pipelineProjects.map(p => p.id === id ? { ...p, stage: newStage } : p)
      })),

      assignPersonToPosition: (projectId, positionId, person) => set((state) => ({
        pipelineProjects: state.pipelineProjects.map(p => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            requiredPositions: p.requiredPositions.map(pos => {
              if (pos.id !== positionId) return pos;
              // Prevent duplicate assignment
              if (pos.assignedPersons.some(ap => ap.employeeId === person.employeeId)) return pos;
              return {
                ...pos,
                assignedPersons: [...pos.assignedPersons, person]
              };
            })
          };
        })
      })),

      removePersonFromPosition: (projectId, positionId, employeeId) => set((state) => ({
        pipelineProjects: state.pipelineProjects.map(p => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            requiredPositions: p.requiredPositions.map(pos => {
              if (pos.id !== positionId) return pos;
              return {
                ...pos,
                assignedPersons: pos.assignedPersons.filter(ap => ap.employeeId !== employeeId)
              };
            })
          };
        })
      })),

      promotePipelineProject: (id) => set((state) => {
        const pipeline = state.pipelineProjects.find(p => p.id === id);
        if (!pipeline) return state;

        // Create new Project from PipelineProject
        const newProject: Project = {
          id: generateId(),
          name: pipeline.name,
          themeColor: pipeline.color,
          teamRisks: '',
          teamPotentials: '',
          client: pipeline.client,
          deliveryLead: pipeline.deliveryLead,
          contactPlatform: pipeline.contactPlatform,
          contactDepartment: pipeline.contactDepartment,
          estimatedStart: pipeline.estimatedStart,
          estimatedEnd: pipeline.estimatedEnd,
          description: pipeline.description,
          requiredPositions: pipeline.requiredPositions || [],
        };

        // Create Allocations from all assigned persons across all positions
        const newAllocations: Allocation[] = [];
        pipeline.requiredPositions.forEach(pos => {
          pos.assignedPersons.forEach(ap => {
            // Check if this employee already has an allocation to this project
            const alreadyAllocated = newAllocations.some(a => a.employeeId === ap.employeeId);
            if (!alreadyAllocated) {
              newAllocations.push({
                id: generateId(),
                employeeId: ap.employeeId,
                projectId: newProject.id,
                projectRole: pos.role,
                percentage: ap.percentage,
                isTechLead: false,
              });
            }
          });
        });

        const nextAllocations = [...state.allocations, ...newAllocations];
        const normalized = normalizeState(state.employees, nextAllocations);
        const adjusted = adjustAllocations(normalized.allocations, normalized.employees);

        return {
          projects: [...state.projects, newProject],
          pipelineProjects: state.pipelineProjects.filter(p => p.id !== id),
          employees: normalized.employees,
          allocations: adjusted,
        };
      }),

      resetData: () => set({
        employees: [],
        projects: [],
        allocations: [],
        pipelineProjects: [],
        metadata: { lastEditedBy: null, lastEditedAt: null }
      }),
    }),
    {
      name: 'visuelle-allocation-storage',
      merge: (persistedState: unknown, currentState) => {
        const merged = { ...currentState, ...(persistedState as Partial<AppState>) };
        if (merged.employees && merged.allocations) {
          const normalized = normalizeState(merged.employees, merged.allocations);
          merged.employees = normalized.employees;
          merged.allocations = adjustAllocations(normalized.allocations, normalized.employees);
        }
        // Ensure active projects have requiredPositions array & migrate contactFlexhub
        if (merged.projects) {
          merged.projects = merged.projects.map(p => {
            const anyP = p as any;
            if (anyP.contactFlexhub !== undefined && anyP.contactPlatform === undefined) {
              anyP.contactPlatform = anyP.contactFlexhub;
              delete anyP.contactFlexhub;
            }
            return {
              ...p,
              requiredPositions: p.requiredPositions || []
            };
          });
        }
        // Ensure pipelineProjects array exists for backward compatibility & migrate contactFlexhub / stage
        if (!merged.pipelineProjects) {
          merged.pipelineProjects = [];
        } else {
          merged.pipelineProjects = merged.pipelineProjects.map(p => {
            const anyP = p as any;
            if (anyP.contactFlexhub !== undefined && anyP.contactPlatform === undefined) {
              anyP.contactPlatform = anyP.contactFlexhub;
              delete anyP.contactFlexhub;
            }
            if (anyP.stage === 'flexhub') {
              anyP.stage = 'intake';
            }
            return {
              ...p,
              requiredPositions: p.requiredPositions?.map(pos => ({
                ...pos,
                role: (pos.role as string) === 'SWE' ? 'SWE Frontend' : pos.role,
                percentage: pos.percentage ?? pos.count * 100
              })) || []
            };
          });
        }
        return merged;
      }
    }
  )
)
