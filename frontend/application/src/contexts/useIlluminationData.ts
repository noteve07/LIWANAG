import { useContext } from 'react';
import { IlluminationDataContext } from './illumination-data/context';

export const useIlluminationData = () => {
  const context = useContext(IlluminationDataContext);
  if (context === undefined) {
    throw new Error('useIlluminationData must be used within an IlluminationDataProvider');
  }
  return context;
};