"use client"

import { useStore } from "@/lib/store"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AgentSelector() {
  const { agents, currentAgentId, setCurrentAgentId } = useStore()

  const selectedAgent = agents.find((agent) => agent.id === currentAgentId)

  return (
    <Select
      value={currentAgentId ?? "none"}
      onValueChange={(value) =>
        setCurrentAgentId(value === "none" ? null : value)
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select agent...">
          {selectedAgent ? selectedAgent.name : "Select agent..."}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No agent selected</SelectItem>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            {agent.name} · {agent.model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
