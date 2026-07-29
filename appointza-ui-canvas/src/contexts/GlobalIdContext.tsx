import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalIdContextType {
  id: string | number | null;
  setId: (id: string | number | null) => void;
  clearId: () => void;
}

const GlobalIdContext = createContext<GlobalIdContextType | undefined>(undefined);

interface GlobalIdProviderProps {
  children: ReactNode;
}

export const GlobalIdProvider: React.FC<GlobalIdProviderProps> = ({ children }) => {
  const [id, setIdState] = useState<string | number | null>(null);

  const setId = (newId: string | number | null) => {
    setIdState(newId);
  };

  const clearId = () => {
    setIdState(null);
  };

  return (
    <GlobalIdContext.Provider value={{ id, setId, clearId }}>
      {children}
    </GlobalIdContext.Provider>
  );
};

export const useGlobalId = (): GlobalIdContextType => {
  const context = useContext(GlobalIdContext);
  if (context === undefined) {
    throw new Error('useGlobalId must be used within a GlobalIdProvider');
  }
  return context;
};

