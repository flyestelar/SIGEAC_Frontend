"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { MoonIcon, SunIcon } from "lucide-react";

export function ThemeToggler() {
  const { setTheme, theme } = useTheme();

  return (
    <TooltipProvider disableHoverableContent>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <Button
            className="relative h-8 w-8 rounded-full border-border/50 bg-background/40 backdrop-blur-sm transition-transform duration-150 ease-out hover:bg-foreground/[0.04] active:scale-[0.97]"
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <SunIcon className="h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all duration-200 ease-out dark:rotate-0 dark:scale-100" />
            <MoonIcon className="absolute h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all duration-200 ease-out dark:-rotate-90 dark:scale-0" />
            <span className="sr-only">Switch Theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="flex items-center gap-2">
            <span>Switch Theme</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70">
              <span className="text-[11px]">⌘</span>⇧T
            </kbd>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
