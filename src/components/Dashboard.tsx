import React from 'react';
import { useStore } from '../store/useStore';
import { PieChart, AlertTriangle, Users, TrendingUp, ShieldAlert, Target } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { employees, projects, allocations, pipelineProjects } = useStore();

  const activeEmployees = employees.filter(e => e.status === 'active');
  const totalCapacity = activeEmployees.length * 100;

  // Calculate global utilization
  let totalAllocated = 0;
  let overbookedCount = 0;
  let benchCount = 0;

  activeEmployees.forEach(emp => {
    const empAllocations = allocations.filter(a => a.employeeId === emp.id);
    const poolTotal = empAllocations.reduce((sum, a) => sum + a.percentage, 0);
    
    const pipelineAllocations = pipelineProjects.flatMap(p => 
      p.requiredPositions.flatMap(pos => 
        pos.assignedPersons
           .filter(ap => ap.employeeId === emp.id)
           .map(ap => ap.percentage)
      )
    );
    const pipelineTotal = pipelineAllocations.reduce((sum, perc) => sum + perc, 0);
    const empTotal = poolTotal + pipelineTotal;

    totalAllocated += empTotal;
    if (empTotal > 100) overbookedCount++;
    if (empTotal < 100) benchCount++;
  });

  const utilizationRate = totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;

  // Extract High/Critical Risks
  const extractRisks = (text: string, sourceName: string, type: 'Mitarbeiter' | 'Projekt') => {
    if (!text) return [];
    const lines = text.split('\n').filter(Boolean);
    const risks = [];
    for (const line of lines) {
      if (line.includes('Impact: Hoch') || line.includes('Impact: Kritisch') || 
          line.includes('Severity: Hoch') || line.includes('Severity: Kritisch')) {
        risks.push({ source: sourceName, type, text: line });
      }
    }
    return risks;
  };

  const criticalRisks: { source: string, type: string, text: string }[] = [];
  employees.forEach(e => criticalRisks.push(...extractRisks(e.risks, e.name, 'Mitarbeiter')));
  projects.forEach(p => criticalRisks.push(...extractRisks(p.teamRisks, p.name, 'Projekt')));

  // Calculate Hiring Needs (FTEs) from Pipeline and Active Projects
  const hiringNeeds: Record<string, number> = {};
  
  pipelineProjects.forEach(p => {
    p.requiredPositions.forEach(pos => {
      const requiredPct = pos.percentage ?? pos.count * 100;
      const filledPct = pos.assignedPersons.reduce((sum, ap) => sum + ap.percentage, 0);
      const gap = requiredPct - filledPct;
      
      if (gap > 0) {
        hiringNeeds[pos.role] = (hiringNeeds[pos.role] || 0) + gap;
      }
    });
  });

  projects.forEach(p => {
    // Only consider projects that are active or upcoming, not archived (if that exists)
    if (p.requiredPositions) {
      p.requiredPositions.forEach(pos => {
        const requiredPct = pos.percentage ?? 100; // Regular projects don't use count as multiplier typically, but let's be safe
      
      // Find all allocations for this project and role
      const roleAllocations = allocations.filter(a => a.projectId === p.id && a.projectRole === pos.role);
      const filledPct = roleAllocations.reduce((sum, a) => sum + a.percentage, 0);
      const gap = requiredPct - filledPct;

      if (gap > 0) {
        hiringNeeds[pos.role] = (hiringNeeds[pos.role] || 0) + gap;
      }
    });
    }
  });

  const fteNeeds = Object.entries(hiringNeeds)
    .map(([role, gap]) => ({ role, fte: gap / 100 }))
    .sort((a, b) => b.fte - a.fte);
    
  const totalFteNeeds = fteNeeds.reduce((sum, item) => sum + item.fte, 0);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <PieChart strokeWidth={1.5} size={28} className="text-primary" />
        <h2 className="text-2xl font-bold text-textMain tracking-tight">KPI-Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* KPI: Auslastung */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between relative overflow-hidden group animate-fade-in-up">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider">Gesamtauslastung</h3>
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Target strokeWidth={1.5} size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-4xl font-extrabold ${utilizationRate > 100 ? 'text-danger' : 'text-textMain'}`}>
                {utilizationRate}%
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${utilizationRate > 100 ? 'bg-danger' : 'bg-primary'}`} 
              style={{ width: `${Math.min(utilizationRate, 100)}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <span className="block text-xs text-textMuted mb-0.5">Auf der Bench</span>
              <span className="font-semibold text-textMain">{benchCount} Personen</span>
            </div>
            <div>
              <span className="block text-xs text-textMuted mb-0.5">Überbucht</span>
              <span className="font-semibold text-danger">{overbookedCount} Personen</span>
            </div>
          </div>
        </div>

        {/* KPI: Vakanzen */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between relative overflow-hidden group animate-fade-in-up" style={{animationDelay: '100ms'}}>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider">Einstellungsbedarf</h3>
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Users strokeWidth={1.5} size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-textMain">{totalFteNeeds.toFixed(1)}</span>
              <span className="text-sm font-medium text-textMuted">FTEs</span>
            </div>
            <p className="text-xs text-textMuted mb-6">Basierend auf offenen Positionen in Pool & Pipeline.</p>
          </div>
          
          <div className="space-y-3 pt-4 border-t border-gray-100">
            {fteNeeds.slice(0, 3).map(need => (
              <div key={need.role} className="flex justify-between items-center text-sm">
                <span className="font-medium text-textMain">{need.role}</span>
                <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">{need.fte.toFixed(1)} FTE</span>
              </div>
            ))}
            {fteNeeds.length === 0 && (
              <p className="text-xs text-textMuted italic">Keine offenen Vakanzen.</p>
            )}
            {fteNeeds.length > 3 && (
              <p className="text-xs text-textMuted pt-1">+ {fteNeeds.length - 3} weitere Rollen</p>
            )}
          </div>
        </div>

        {/* KPI: Kritische Risiken */}
        <div className="bg-white rounded-xl shadow-sm border border-danger/20 p-6 flex flex-col justify-between relative overflow-hidden group animate-fade-in-up" style={{animationDelay: '200ms'}}>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-danger/5 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-danger uppercase tracking-wider">Kritische Risiken</h3>
              <div className="p-2 bg-danger/10 text-danger rounded-lg">
                <AlertTriangle strokeWidth={1.5} size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-danger">{criticalRisks.length}</span>
              <span className="text-sm font-medium text-danger/80">Einträge</span>
            </div>
            <p className="text-xs text-danger/70 mb-6">Mit Impact oder Severity "Hoch" / "Kritisch".</p>
          </div>
          
          <div className="space-y-3 pt-4 border-t border-danger/10 max-h-32 overflow-y-auto pr-1">
            {criticalRisks.slice(0, 4).map((risk, idx) => {
              const match = risk.text.match(/\[.*?\] (\[.*?\]): (.*)/);
              const desc = match ? match[2] : risk.text;
              
              return (
                <div key={idx} className="bg-danger/5 border border-danger/10 rounded p-2 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-danger">{risk.source} <span className="text-[10px] text-danger/60 font-normal">({risk.type})</span></span>
                  </div>
                  <p className="text-textMain line-clamp-2" title={risk.text}>{desc}</p>
                </div>
              );
            })}
            {criticalRisks.length === 0 && (
              <p className="text-xs text-textMuted italic text-center py-4">Alles im grünen Bereich.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Detail-Ansicht für Einstellungsbedarf (Bar Chart representation) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in-up" style={{animationDelay: '300ms'}}>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp strokeWidth={1.5} size={20} className="text-primary" />
          <h3 className="text-lg font-bold text-textMain">Detaillierter Einstellungsbedarf (Pool & Pipeline)</h3>
        </div>
        
        {fteNeeds.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <ShieldAlert strokeWidth={1.5} size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-textMuted text-sm">Aktuell keine Vakanzen identifiziert.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fteNeeds.map(need => {
              const maxFte = Math.max(...fteNeeds.map(n => n.fte));
              const widthPct = (need.fte / maxFte) * 100;
              return (
                <div key={need.role} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium text-textMain text-right truncate" title={need.role}>
                    {need.role}
                  </div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden relative group">
                    <div 
                      className="h-full bg-primary transition-all duration-1000 ease-out"
                      style={{ width: `${widthPct}%` }}
                    />
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="w-16 text-sm font-bold text-primary text-left">
                    {need.fte.toFixed(1)} FTE
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
