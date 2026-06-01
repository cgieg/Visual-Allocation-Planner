import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Whiteboard } from './components/Whiteboard';
import { RecruitingBoard } from './components/RecruitingBoard';
import { ProjectPipeline } from './components/ProjectPipeline';
import { Dashboard } from './components/Dashboard';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useStore, NewcomerPhase, ProjectRole, PipelineStage } from './store/useStore';
import { EmployeeCard } from './components/EmployeeCard';

function App() {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );
  const [activeTab, setActiveTab] = useState<'dashboard' | 'board' | 'recruiting' | 'pipeline'>('dashboard');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  
  const employees = useStore(state => state.employees);
  const pipelineProjects = useStore(state => state.pipelineProjects);
  const addAllocation = useStore(state => state.addAllocation);
  const updateEmployee = useStore(state => state.updateEmployee);
  const movePipelineStage = useStore(state => state.movePipelineStage);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
    setActiveDragType(event.active.data.current?.type || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    setActiveDragType(null);
    const { active, over } = event;

    if (!over) return;
    
    // Employee → Project (allocation)
    if (active.data.current?.type === 'employee' && over.data.current?.type === 'project') {
      const employeeId = active.id as string;
      const projectId = over.id as string;
      
      const existing = useStore.getState().allocations.find(a => a.employeeId === employeeId && a.projectId === projectId);
      if (existing) return;

      const employee = useStore.getState().employees.find(e => e.id === employeeId);
      if (!employee) return;

      addAllocation({
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        employeeId,
        projectId,
        percentage: 0,
        projectRole: employee.currentRole as ProjectRole
      });
    }

    // Employee → Recruiting Column (phase change)
    if (active.data.current?.type === 'employee' && over.data.current?.type === 'recruiting-column') {
      const employeeId = active.id as string;
      const newPhase = over.data.current?.phase as NewcomerPhase;
      
      const employee = useStore.getState().employees.find(e => e.id === employeeId);
      if (employee && employee.status === 'newcomer' && employee.newcomerPhase !== newPhase) {
        updateEmployee(employeeId, { newcomerPhase: newPhase });
      }
    }

    // Pipeline Project → Pipeline Column (stage change)
    if (active.data.current?.type === 'pipeline-project' && over.data.current?.type === 'pipeline-column') {
      const projectId = active.data.current?.project?.id;
      const newStage = over.data.current?.stage as PipelineStage;
      
      if (projectId && newStage) {
        const project = useStore.getState().pipelineProjects.find(p => p.id === projectId);
        if (project && project.stage !== newStage) {
          if (newStage === 'kickoff') {
            // Moving to kickoff - ask for confirmation to promote
            if (window.confirm(`"${project.name}" in die Kickoff-Phase verschieben?`)) {
              movePipelineStage(projectId, newStage);
            }
          } else {
            movePipelineStage(projectId, newStage);
          }
        }
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    setActiveDragType(null);
  };

  const activeEmployee = activeDragId && activeDragType === 'employee' 
    ? employees.find(e => e.id === activeDragId) 
    : null;

  const activePipelineProject = activeDragId && activeDragType === 'pipeline-project'
    ? pipelineProjects.find(p => `pipeline-${p.id}` === activeDragId)
    : null;

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'board': return <Whiteboard />;
      case 'recruiting': return <RecruitingBoard />;
      case 'pipeline': return <ProjectPipeline />;
    }
  };

  const pipelineCount = pipelineProjects.length;

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd} 
      onDragCancel={handleDragCancel}
      collisionDetection={pointerWithin}
    >
      <div className="min-h-screen flex flex-col bg-board h-screen">
        <Header />
        
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="inline-flex bg-white rounded-lg p-1 shadow-sm border border-gray-200 overflow-x-auto max-w-full">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-primary text-white shadow' : 'text-textMuted hover:text-textMain hover:bg-gray-50'}`}
            >
              KPI-Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('board')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'board' ? 'bg-primary text-white shadow' : 'text-textMuted hover:text-textMain hover:bg-gray-50'}`}
            >
              Projekt-Pool
            </button>
            <button 
              onClick={() => setActiveTab('recruiting')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'recruiting' ? 'bg-primary text-white shadow' : 'text-textMuted hover:text-textMain hover:bg-gray-50'}`}
            >
              Personalpipeline
            </button>
            <button 
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === 'pipeline' ? 'bg-primary text-white shadow' : 'text-textMuted hover:text-textMain hover:bg-gray-50'}`}
            >
              Projekt-Pipeline
              {pipelineCount > 0 && activeTab !== 'pipeline' && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                  {pipelineCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden mt-4">
          <div className="flex-1 overflow-auto relative">
             {renderActiveView()}
          </div>
          
          {activeTab !== 'pipeline' && activeTab !== 'dashboard' && (
            <div className="w-80 border-l border-gray-200 bg-surface flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)] z-10">
              <Sidebar />
            </div>
          )}
        </div>
      </div>
      
      <DragOverlay>
        {activeEmployee ? (
          <div className="opacity-80 rotate-2 scale-105 transition-transform pointer-events-none w-72">
            <EmployeeCard employee={activeEmployee} />
          </div>
        ) : null}
        {activePipelineProject ? (
          <div className="opacity-80 rotate-1 scale-105 pointer-events-none w-72">
            <div className="bg-white rounded-xl border-2 border-primary shadow-lg p-3">
              <div className="h-1.5 rounded-t-xl mb-2" style={{ backgroundColor: activePipelineProject.color }} />
              <h4 className="font-bold text-textMain text-sm">{activePipelineProject.name}</h4>
              {activePipelineProject.client && (
                <p className="text-xs text-textMuted mt-0.5">{activePipelineProject.client}</p>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default App;

