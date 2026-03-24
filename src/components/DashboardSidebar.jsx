import React from 'react'
import WorkspacePanel from './WorkspacePanel'
import SidebarHealthCard from './SidebarHealthCard'

export default function DashboardSidebar({
  workspace,
  currentProject,
  currentScenario,
  updateCurrentProject,
  updateCurrentScenario,
  workspaceActions,
  healthProps,
}) {
  return (
    <aside className="dashboard-sidebar">
      <WorkspacePanel
        projects={workspace.projects}
        currentProject={currentProject}
        currentScenario={currentScenario}
        onSelectProject={workspaceActions.handleSelectProject}
        onCreateProject={workspaceActions.handleCreateProject}
        onDuplicateProject={workspaceActions.handleDuplicateProject}
        onDeleteProject={workspaceActions.handleDeleteProject}
        onRenameProject={(value) => updateCurrentProject(project => ({ ...project, name: value }))}
        onCreateScenario={workspaceActions.handleCreateScenario}
        onDuplicateScenario={workspaceActions.handleDuplicateScenario}
        onDeleteScenario={workspaceActions.handleDeleteScenario}
        onSelectScenario={(scenarioId) => updateCurrentProject(project => ({ ...project, currentScenarioId: scenarioId }))}
        onRenameScenario={(value) => updateCurrentScenario(scenario => ({ ...scenario, name: value }))}
        onProjectNotesChange={(value) => updateCurrentProject(project => ({ ...project, notes: value }))}
        onCalendarChange={(field, value) => updateCurrentProject(project => ({
          ...project,
          calendarConfig: {
            ...project.calendarConfig,
            [field]: value,
          },
        }))}
      />

      <SidebarHealthCard {...healthProps} />
    </aside>
  )
}
