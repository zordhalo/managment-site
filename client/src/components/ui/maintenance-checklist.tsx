import * as React from "react"
import { Check, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

interface MaintenanceTaskProps {
  title: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

const MaintenanceTask: React.FC<MaintenanceTaskProps> = ({
  title,
  checked = false,
  onCheckedChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-start space-x-3 py-2">
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-0.5"
        id={`task-${title}`}
      />
      <label
        htmlFor={`task-${title}`}
        className={cn(
          "text-sm font-medium leading-tight text-foreground cursor-pointer",
          checked && "line-through text-muted-foreground"
        )}
      >
        {title}
      </label>
    </div>
  )
}

const maintenanceTasks = [
  "Wipe all mice, keyboards, and headsets clean with sanitizing wipes",
  "Tuck all chairs under the tables",
  "Ensure room is clean, neat and tidy",
  "Check that all peripherals are connected to desktop units",
  "Place headsets on top of either the screen or headset holder",
  "Ensure keyboards, mice and headsets are paired to the correct station",
  "Check that headset mics and adapters are properly connected",
  "Verify mouse and keyboard cables are properly attached",
  "Remove any clutter or hanging wires under each station",
  "Report any software issues to esports coach or staff supervisor"
]

export interface MaintenanceChecklistProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  tasks?: string[]
}

export function MaintenanceChecklist({
  className,
  title = "Daily Esports Room Maintenance",
  description = "Complete all tasks before ending your shift",
  tasks = maintenanceTasks,
  ...props
}: MaintenanceChecklistProps) {
  const [checkedTasks, setCheckedTasks] = React.useState<Record<string, boolean>>({})

  const handleCheckTask = (task: string, checked: boolean) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [task]: checked,
    }))
  }

  // Calculate completion percentage
  const completedCount = Object.values(checkedTasks).filter(Boolean).length
  const totalTasks = tasks.length
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  return (
    <Card className={cn("w-full", className)} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-xl flex items-center">
              <Monitor className="mr-2 h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center justify-center rounded-full bg-primary/10 p-1 text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {completionPercentage}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {tasks.map((task) => (
            <MaintenanceTask
              key={task}
              title={task}
              checked={checkedTasks[task] || false}
              onCheckedChange={(checked) => handleCheckTask(task, checked)}
            />
          ))}
        </div>
        
        {completedCount === totalTasks && totalTasks > 0 && (
          <div className="mt-4 rounded-md bg-primary/10 p-3 text-sm flex items-center text-primary">
            <Check className="mr-2 h-4 w-4" />
            All maintenance tasks completed! Great job!
          </div>
        )}
      </CardContent>
    </Card>
  )
}