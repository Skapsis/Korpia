'use client';

import { createContext, useContext, useState } from 'react';

interface GridEditingContextValue {
  isEditingGrid: boolean;
  setIsEditingGrid: (v: boolean | ((prev: boolean) => boolean)) => void;
}

const GridEditingContext = createContext<GridEditingContextValue | null>(null);

export function GridEditingProvider({ children }: { children: React.ReactNode }) {
  const [isEditingGrid, setIsEditingGrid] = useState(false);
  return (
    <GridEditingContext.Provider value={{ isEditingGrid, setIsEditingGrid }}>
      {children}
    </GridEditingContext.Provider>
  );
}

export function useGridEditing() {
  const ctx = useContext(GridEditingContext);
  return ctx ?? { isEditingGrid: false, setIsEditingGrid: () => {} };
}
