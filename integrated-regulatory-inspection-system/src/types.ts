export interface Licensee {
  id: string;
  name: string;
  sector: 'Telecommunications' | 'Broadcasting' | 'Postal/Courier' | 'Cybersecurity';
  licenseNumber: string;
  region: string;
  status: 'Active' | 'Warning' | 'Suspended';
  lastInspection: string;
  riskScore: number;
  contactEmail: string;
  contactPhone: string;
  documents: { name: string; type: string; expiry: string }[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  description: string;
  response: 'Pass' | 'Fail' | 'N/A';
  notes: string;
}

export interface InspectionChecklist {
  sector: string;
  items: ChecklistItem[];
}

export interface InspectionRecord {
  id: string;
  licenseeId: string;
  licenseeName: string;
  sector: string;
  date: string;
  officerName: string;
  location: string;
  coordinates: { lat: number; lng: number };
  checklist: ChecklistItem[];
  signature: string;
  status: 'Compliant' | 'Correction Order' | 'Escalated to Legal' | 'Pending Review';
  evidencePhotos: string[];
  notes: string;
}

export interface QoSMetric {
  licenseeId: string;
  licenseeName: string;
  timestamp: string;
  cdr: number; // Call Drop Rate (%)
  cssr: number; // Call Setup Success Rate (%)
  throughput: number; // Mbps
  latency: number; // ms
  signalStrength?: number; // dBm (Broadcasting)
  frequencyDeviation?: number; // kHz (Broadcasting)
}

export interface SpectrumAlert {
  id: string;
  frequency: number; // MHz
  location: string;
  level: number; // dBm
  status: 'Unidentified' | 'Authorized' | 'Investigating' | 'Cleared';
  timestamp: string;
}

export interface OperatorComplaint {
  id: string;
  licenseeName: string;
  source: 'Twitter' | 'Facebook' | 'Consumer Forum' | 'Direct Hotline';
  text: string;
  sentiment: 'negative' | 'neutral' | 'positive';
  sector: string;
  date: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Inspector' | 'Operator';
  avatar: string;
  department: string;
}

