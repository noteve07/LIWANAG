import { createContext } from 'react';
import type { PointData } from '../../components/Map/types/mapTypes';

export interface IlluminationDataContextType {
  points: PointData[];
  streetNames: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const IlluminationDataContext = createContext<IlluminationDataContextType | undefined>(undefined);