"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { useState } from "react"

export function AgentSelector() {
  const { agents, currentAgentId, setCurrentAgentId } = useStore()
  const [open, setOpen] = useState(false)

  const selectedAgent = agents.find((agent) => agent.id === currentAgentId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
        >
          {selectedAgent ? selectedAgent.name : "Select agent..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search agents..." />
          <CommandList>
            <CommandEmpty>No agent found.</CommandEmpty>
            <CommandGroup>
              {agents.map((agent) => (
                <CommandItem
                  key={agent.id}
                  value={agent.id}
                  onSelect={(value) => {
                    setCurrentAgentId(value === currentAgentId ? null : value)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", currentAgentId === agent.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span>{agent.name}</span>
                    <span className="text-xs text-muted-foreground">{agent.model}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
