export type NavigationPath =
  | 'login'
  | 'dashboard'
  | 'ai-assistant'
  | 'servers'
  | 'docker'
  | 'kubernetes'
  | 'cicd'
  | 'github'
  | 'deployments'
  | 'monitoring'
  | 'logs'
  | 'analytics'
  | 'database-schema'
  | 'workspace-switcher'
  | 'settings';

export interface DeploymentItem {
  id: string;
  version: string;
  env: 'PROD' | 'STG' | 'DEV';
  status: 'Success' | 'Running' | 'Failed';
  duration: string;
  timestamp: string;
  commit: string;
  author: string;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  timeAgo: string;
  active?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  codeSnippet?: string;
  isAnalyzing?: boolean;
}

export interface LogLine {
  id: string;
  lineNumber: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  module: string;
  message: string;
  stackTrace?: string[];
}

export interface ActiveAlert {
  id: string;
  title: string;
  node: string;
  timeAgo: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
}

export interface PipelineStage {
  id: string;
  name: string; // e.g., 'Source', 'Build', 'Test', 'Deploy'
  status: 'completed' | 'running' | 'failed' | 'pending';
  duration?: string;
  details?: string;
  logs?: string[];
}

export interface Pipeline {
  id: string;
  name: string; // e.g. 'auth-service-v3.2.0'
  repository: string; // e.g. 'infra/auth-service'
  branch: string; // e.g. 'main'
  commit: string; // e.g. 'a8f19c2'
  commitMsg: string; // e.g. 'feat: implement JWT rotation'
  author: string; // e.g. 'alex.dev'
  env: 'PROD' | 'STG' | 'DEV';
  status: 'running' | 'passed' | 'failed' | 'queued';
  totalDuration: string;
  startTime: string;
  stages: PipelineStage[];
}

export interface LinuxTelemetry {
  status: string;
  timestamp: string;
  collector: string;
  thresholds?: {
    cpuWarning: number;
    cpuCritical: number;
    ramWarning: number;
    ramCritical: number;
    diskWarning: number;
    diskCritical: number;
    tempWarning: number;
    tempCritical: number;
    swapWarning: number;
  };
  system: {
    hostname: string;
    kernel_version: string;
    architecture: string;
    os_distribution: string;
    uptime_seconds: number;
    uptime_formatted: string;
    boot_time: string;
  };
  health: {
    health_score: number;
    rating: 'EXCELLENT' | 'GOOD' | 'DEGRADED' | 'CRITICAL';
    status_color: string;
    breakdown: {
      cpu_score: number;
      ram_score: number;
      disk_score: number;
      temp_score: number;
      service_score: number;
    };
  };
  cpu: {
    overall_percent: number;
    per_core_percent: number[];
    core_count: number;
    frequency_mhz: number;
    load_average: {
      '1m': number;
      '5m': number;
      '15m': number;
    };
  };
  memory: {
    total_mb: number;
    used_mb: number;
    free_mb: number;
    available_mb: number;
    percent: number;
  };
  swap: {
    total_mb: number;
    used_mb: number;
    free_mb: number;
    percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    free_gb: number;
    percent: number;
    read_bytes_mb: number;
    write_bytes_mb: number;
  };
  network: {
    bytes_sent_mb: number;
    bytes_recv_mb: number;
    packets_sent: number;
    packets_recv: number;
    interfaces: string[];
  };
  gpu: {
    detected: boolean;
    name: string;
    memory_total_mb: number;
    memory_used_mb: number;
    memory_free_mb: number;
    utilization_pct: number;
    temperature_c: number;
    driver_version: string;
  };
  temperature: {
    cpu_temperature_c: number;
    sensors: { label: string; current_c: number }[];
  };
  processes: {
    pid: number;
    name: string;
    user: string;
    status: string;
    cpu_pct: number;
    mem_pct: number;
    num_threads: number;
  }[];
  services: {
    service_name: string;
    description: string;
    status: 'active' | 'inactive' | 'failed' | 'reloading';
    sub_state: string;
    uptime: string;
  }[];
}

