"use client";

import React from "react";
import { SidebarTrigger } from "./ui/sidebar";
import SwitchThemeButton from "./switch-theme-button";

const Nav = () => {
  return (
    <div className="flex items-center border-b-[.2px] border-sidebar-border/50 py-4 mb-4 gap-4">
      <SidebarTrigger />
      <div className="flex gap-3 items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Package Tracker
          </p>
        </div>
        <SwitchThemeButton />
      </div>
    </div>
  );
};

export default Nav;
