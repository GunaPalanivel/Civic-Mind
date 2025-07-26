export interface CivicReportInput {
  title: string;
  description: string;
  category: 'traffic' | 'safety' | 'infrastructure' | 'environment' | 'social';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  mediaFiles?: File[];
  tags?: string[];
}

export interface SynthesizedAlert {
  id: string;
  summary: string;
  recommendation: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: Location;
  eventIds: string[];
  confidence: number;
}
