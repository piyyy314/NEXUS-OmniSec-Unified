export type ModuleId =
  | 'dns'
  | 'rf_spectrum'
  | 'dsss'
  | 'packet_smith'
  | 'log_scrubber'
  | 'ids_heuristics'
  | 'port_prober'
  | 'base58'
  | 'file_extractor'
  | 'array_formatter'
  | 'satcom_telemetry'
  | 'crypto_vault';

export interface ModuleInfo {
  id: ModuleId;
  name: string;
  shortLabel: string;
  category: 'Signals' | 'Network L3/L4' | 'Defense' | 'Crypto' | 'Diagnostics';
  description: string;
  badge?: string;
  iconName: string;
}

export interface DnsParsedResult {
  transactionId: string;
  queryResponse: 'QUERY' | 'RESPONSE';
  opCode: string;
  responseCode: string;
  truncated: boolean;
  recursionDesired: boolean;
  recursionAvailable: boolean;
  questionsCount: number;
  answersCount: number;
  authorityCount: number;
  additionalCount: number;
  domainName: string;
  queryType: string;
  queryClass: string;
  rawHex: string;
}

export interface IdsRule {
  id: string;
  name: string;
  pattern: RegExp;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}
