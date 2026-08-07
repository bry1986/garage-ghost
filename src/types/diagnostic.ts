export type RiskLevel = "STOP_NOW" | "DRIVE_CAREFULLY" | "BOOK_SERVICE";

export type Confidence = "low" | "medium" | "high";

export type ResponseLanguage = "English" | "German" | "French" | "Arabic";

export type DiagnosisSource = "puter" | "demo";

export interface PossibleCause {
  cause: string;
  likelihood: Confidence;
}

export interface DiagnosticResult {
  detectedWarning: string;
  confidence: Confidence;
  riskLevel: RiskLevel;
  summary: string;
  possibleCauses: PossibleCause[];
  safeChecks: string[];
  doNotDo: string[];
  questions: string[];
  mechanicReport: string;
  disclaimer: string;
}

export interface VehicleFormData {
  brand: string;
  model: string;
  year: string;
  fuelType?: string;
  mileage?: string;
  language: ResponseLanguage;
  symptoms: string;
  symptomChips: string[];
}

export interface SavedVehicle {
  brand: string;
  model: string;
  year: string;
  fuelType?: string;
  mileage?: string;
}

export interface SavedDiagnosis {
  id: string;
  createdAt: number;
  source: DiagnosisSource;
  vehicle: SavedVehicle;
  language: ResponseLanguage;
  symptoms: string;
  result: DiagnosticResult;
}
