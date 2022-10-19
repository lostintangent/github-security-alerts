import { observable } from "mobx";
import { CodeScanningAlertNode, DependabotAlertNode } from "../tree/nodes";

export enum AlertState {
  dismissed = "dismissed",
  fixed = "fixed",
  open = "open",
}

export enum DependabotAlertDependencyEcosystem {
  composer = "composer",
  go = "go",
  maven = "maven",
  npm = "npm",
  nuget = "nuget",
  pip = "pip",
  rubygems = "rubygems",
  rust = "rust",
}

export enum DependabotAlertDependencyScope {
  development = "development",
  runtime = "runtime",
}

export enum AlertSeverity {
  low = "low",
  medium = "medium",
  high = "high",
  critical = "critical",
}

export interface DependabotAlertDependency {
  package: {
    ecosystem: DependabotAlertDependencyEcosystem;
    name: string;
  };
  manifest_path: string;
  scope: DependabotAlertDependencyScope;
}

export interface DependabotAlert {
  number: number;
  state: AlertState;
  dependency: DependabotAlertDependency;
  security_advisory: {
    ghsa_id: string;
    cve_id: string;
    summary: string;
    description: string;
    severity: AlertSeverity;
    references: { url: string }[];
    published_at: string;
    updated_at: string;
  };
  security_vulnerability: {
    package: {
      ecosystem: DependabotAlertDependencyEcosystem;
      name: string;
    };
    severity: AlertSeverity;
    vulnerable_version_range: string;
  };
  url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  dismissed_at: string;
  dismissed_reason: string;
  dismissed_comment: string;
  fixed_at: string;
}

export interface CodeScanningRule {
  id: string;
  severity: string;
  security_severity_level: string;
  name: string;
  description: string;
  help?: string | null;
}

export interface CodeScanningAlertLocation {
  path: string;
  start_line: number;
  end_line: number;
  start_column: number;
  end_column: number;
}

export interface CodeScanningAlert {
  number: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  state: string;
  rule: CodeScanningRule;
  most_recent_instance: {
    message: {
      text: string;
    };
    location: CodeScanningAlertLocation;
  };
  additionalLocations: CodeScanningAlertLocation[];
}

export interface Store {
  dependabotAlerts: DependabotAlert[] | null;
  codeScanningAlerts: CodeScanningAlert[] | null;
  visibleAlert?:{
    number: number;
    type: "dependabot" | "code-scanning"
  };
  isLoading: boolean;
  isSignedIn: boolean;
  token?: string;
  repo?: { owner: string; name: string };
}

export const store: Store = observable({
  dependabotAlerts: [],
  codeScanningAlerts: [],
  isLoading: false,
  isSignedIn: false,
});
