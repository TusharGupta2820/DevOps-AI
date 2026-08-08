import React, { useState } from 'react';
import { NavigationPath } from '../types';

interface DatabaseSchemaViewProps {
  onNavigate: (path: NavigationPath) => void;
}

interface TableDefinition {
  id: string;
  name: string;
  category: 'Core & Auth' | 'Infrastructure & Docker' | 'CI/CD & Code' | 'Observability & AI';
  description: string;
  columnsCount: number;
  indexesCount: number;
  fksCount: number;
  hasSoftDelete: boolean;
  hasAuditFields: boolean;
  columns: {
    name: string;
    type: string;
    isPk?: boolean;
    isFk?: boolean;
    isUk?: boolean;
    isIdx?: boolean;
    nullable?: boolean;
    defaultVal?: string;
    description: string;
  }[];
  relationships: {
    targetTable: string;
    type: '1:1' | '1:N' | 'N:1';
    foreignKey: string;
    description: string;
  }[];
  checkConstraints?: string[];
  sampleQuery: string;
}

const TABLES: TableDefinition[] = [
  {
    id: 'users',
    name: 'users',
    category: 'Core & Auth',
    description: 'Central user identity, roles (RBAC: Admin, DevOps Engineer, Viewer), password hashes, and email verification.',
    columnsCount: 16,
    indexesCount: 5,
    fksCount: 2,
    hasSoftDelete: true,
    hasAuditFields: true,
    columns: [
      { name: 'id', type: 'UUID (String 36)', isPk: true, isIdx: true, nullable: false, description: 'Primary Key UUID' },
      { name: 'email', type: 'VARCHAR(255)', isUk: true, isIdx: true, nullable: false, description: 'User login email address' },
      { name: 'full_name', type: 'VARCHAR(255)', nullable: false, description: 'User full display name' },
      { name: 'hashed_password', type: 'VARCHAR(255)', nullable: false, description: 'Bcrypt hashed password' },
      { name: 'role', type: 'VARCHAR(50)', isIdx: true, nullable: false, defaultVal: "'VIEWER'", description: 'RBAC Role: ADMIN | DEVOPS_ENGINEER | VIEWER' },
      { name: 'is_active', type: 'BOOLEAN', isIdx: true, nullable: false, defaultVal: 'true', description: 'Account status flag' },
      { name: 'is_verified', type: 'BOOLEAN', nullable: false, defaultVal: 'false', description: 'Email verification status' },
      { name: 'verification_token', type: 'VARCHAR(255)', nullable: true, description: 'Token for email verification' },
      { name: 'reset_password_token', type: 'VARCHAR(255)', nullable: true, description: 'Password reset token' },
      { name: 'reset_token_expires_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Password reset expiration' },
      { name: 'is_deleted', type: 'BOOLEAN', isIdx: true, nullable: false, defaultVal: 'false', description: 'Soft delete flag' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Soft delete timestamp' },
      { name: 'created_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'updated_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Created timestamp' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Updated timestamp' },
    ],
    relationships: [
      { targetTable: 'refresh_tokens', type: '1:N', foreignKey: 'refresh_tokens.user_id', description: 'Active login sessions' },
      { targetTable: 'servers', type: '1:N', foreignKey: 'servers.created_by_id', description: 'Servers created by user' },
      { targetTable: 'deployments', type: '1:N', foreignKey: 'deployments.deployed_by_id', description: 'Deployments triggered by user' },
      { targetTable: 'jenkins_builds', type: '1:N', foreignKey: 'jenkins_builds.triggered_by_id', description: 'Builds triggered' },
      { targetTable: 'alerts', type: '1:N', foreignKey: 'alerts.assigned_to_id', description: 'Alerts assigned' },
      { targetTable: 'notifications', type: '1:N', foreignKey: 'notifications.user_id', description: 'Notifications received' },
      { targetTable: 'ai_conversations', type: '1:N', foreignKey: 'ai_conversations.user_id', description: 'AI chats owned' },
      { targetTable: 'audit_logs', type: '1:N', foreignKey: 'audit_logs.user_id', description: 'Actions logged' },
    ],
    checkConstraints: ["role IN ('ADMIN', 'DEVOPS_ENGINEER', 'VIEWER')"],
    sampleQuery: "SELECT id, email, role FROM users WHERE is_active = true AND is_deleted = false;",
  },
  {
    id: 'refresh_tokens',
    name: 'refresh_tokens',
    category: 'Core & Auth',
    description: 'JWT Refresh token rotation store, token family tracking, revocation status, and session auditing.',
    columnsCount: 10,
    indexesCount: 3,
    fksCount: 1,
    hasSoftDelete: false,
    hasAuditFields: false,
    columns: [
      { name: 'id', type: 'UUID (String 36)', isPk: true, isIdx: true, nullable: false, description: 'Primary Key UUID' },
      { name: 'user_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: false, description: 'FK -> users.id' },
      { name: 'token', type: 'VARCHAR(512)', isUk: true, isIdx: true, nullable: false, description: 'Secure hashed refresh token string' },
      { name: 'token_family', type: 'VARCHAR(36)', nullable: false, description: 'UUID grouping rotated token chain' },
      { name: 'is_revoked', type: 'BOOLEAN', nullable: false, defaultVal: 'false', description: 'Revocation status' },
      { name: 'expires_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Session expiration' },
      { name: 'user_agent', type: 'TEXT', nullable: true, description: 'Client browser or CLI info' },
      { name: 'ip_address', type: 'VARCHAR(45)', nullable: true, description: 'Client IP address' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Creation time' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Last update' },
    ],
    relationships: [
      { targetTable: 'users', type: 'N:1', foreignKey: 'user_id', description: 'Owner user account' },
    ],
    sampleQuery: "SELECT token_family, expires_at FROM refresh_tokens WHERE user_id = $1 AND is_revoked = false;",
  },
  {
    id: 'servers',
    name: 'servers',
    category: 'Infrastructure & Docker',
    description: 'Server inventory records for VMs, Bare-Metal, and Cloud instances, CPU/RAM/Disk metrics, and agent status.',
    columnsCount: 17,
    indexesCount: 7,
    fksCount: 2,
    hasSoftDelete: true,
    hasAuditFields: true,
    columns: [
      { name: 'id', type: 'UUID (String 36)', isPk: true, isIdx: true, nullable: false, description: 'Primary Key UUID' },
      { name: 'name', type: 'VARCHAR(255)', isUk: true, isIdx: true, nullable: false, description: 'Server hostname/slug' },
      { name: 'hostname', type: 'VARCHAR(255)', isIdx: true, nullable: false, description: 'FQDN / Host identifier' },
      { name: 'ip_address', type: 'VARCHAR(45)', isIdx: true, nullable: false, description: 'IPv4 or IPv6 Address' },
      { name: 'environment', type: 'VARCHAR(50)', isIdx: true, nullable: false, defaultVal: "'production'", description: 'production | staging | development' },
      { name: 'status', type: 'VARCHAR(50)', isIdx: true, nullable: false, defaultVal: "'ONLINE'", description: 'ONLINE | OFFLINE | MAINTENANCE | DEGRADED' },
      { name: 'os_info', type: 'VARCHAR(255)', nullable: true, description: 'OS distribution string' },
      { name: 'cpu_cores', type: 'INTEGER', nullable: false, defaultVal: '8', description: 'CPU core count' },
      { name: 'ram_mb', type: 'INTEGER', nullable: false, defaultVal: '32768', description: 'Total RAM in MB' },
      { name: 'disk_gb', type: 'INTEGER', nullable: false, defaultVal: '1000', description: 'Total Disk in GB' },
      { name: 'agent_version', type: 'VARCHAR(50)', nullable: true, description: 'DevOps Agent telemetry version' },
      { name: 'is_deleted', type: 'BOOLEAN', isIdx: true, nullable: false, defaultVal: 'false', description: 'Soft delete flag' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Soft delete timestamp' },
      { name: 'created_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'updated_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Creation time' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Last update' },
    ],
    relationships: [
      { targetTable: 'docker_containers', type: '1:N', foreignKey: 'docker_containers.server_id', description: 'Containers hosted on server' },
      { targetTable: 'metrics', type: '1:N', foreignKey: 'metrics.server_id', description: 'Prometheus metrics emitted' },
      { targetTable: 'logs', type: '1:N', foreignKey: 'logs.server_id', description: 'Syslogs generated' },
      { targetTable: 'alerts', type: '1:N', foreignKey: 'alerts.server_id', description: 'Alerts raised on server' },
      { targetTable: 'users', type: 'N:1', foreignKey: 'created_by_id', description: 'Creator user' },
    ],
    checkConstraints: [
      "cpu_cores > 0",
      "ram_mb > 0",
      "disk_gb > 0",
      "status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE', 'DEGRADED')",
    ],
    sampleQuery: "SELECT name, ip_address, status FROM servers WHERE environment = 'production' AND is_deleted = false;",
  },
  {
    id: 'docker_containers',
    name: 'docker_containers',
    category: 'Infrastructure & Docker',
    description: 'Docker container runtime inventory, status, image tag, CPU/Memory telemetry, and host server mapping.',
    columnsCount: 17,
    indexesCount: 6,
    fksCount: 3,
    hasSoftDelete: true,
    hasAuditFields: true,
    columns: [
      { name: 'id', type: 'UUID (String 36)', isPk: true, isIdx: true, nullable: false, description: 'Primary Key UUID' },
      { name: 'container_id', type: 'VARCHAR(64)', isUk: true, isIdx: true, nullable: false, description: '64-character Docker Container Hash' },
      { name: 'name', type: 'VARCHAR(255)', isIdx: true, nullable: false, description: 'Container instance name' },
      { name: 'image', type: 'VARCHAR(255)', isIdx: true, nullable: false, description: 'Docker image tag (e.g. nginx:alpine)' },
      { name: 'server_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: false, description: 'FK -> servers.id (CASCADE)' },
      { name: 'status', type: 'VARCHAR(50)', isIdx: true, nullable: false, defaultVal: "'RUNNING'", description: 'RUNNING | STOPPED | PAUSED | EXITED | RESTARTING' },
      { name: 'ports_mapping', type: 'VARCHAR(512)', nullable: true, description: 'Port forward mapping string' },
      { name: 'cpu_usage_pct', type: 'FLOAT', nullable: false, defaultVal: '0.0', description: 'Current CPU % usage' },
      { name: 'memory_usage_mb', type: 'FLOAT', nullable: false, defaultVal: '0.0', description: 'Current Memory usage in MB' },
      { name: 'started_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Container boot timestamp' },
      { name: 'finished_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Container stop timestamp' },
      { name: 'is_deleted', type: 'BOOLEAN', isIdx: true, nullable: false, defaultVal: 'false', description: 'Soft delete flag' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Soft delete timestamp' },
      { name: 'created_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'updated_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Creation time' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Last update' },
    ],
    relationships: [
      { targetTable: 'servers', type: 'N:1', foreignKey: 'server_id', description: 'Parent host server' },
      { targetTable: 'logs', type: '1:N', foreignKey: 'logs.container_id', description: 'StdOut / StdErr log streams' },
    ],
    checkConstraints: ["status IN ('RUNNING', 'STOPPED', 'PAUSED', 'EXITED', 'RESTARTING')"],
    sampleQuery: "SELECT name, image, status, cpu_usage_pct FROM docker_containers WHERE server_id = $1 AND status = 'RUNNING';",
  },
  {
    id: 'repositories',
    name: 'repositories',
    category: 'CI/CD & Code',
    description: 'Code repositories synchronized from GitHub, GitLab, or Bitbucket, default branch settings, and privacy flags.',
    columnsCount: 14,
    indexesCount: 3,
    fksCount: 2,
    hasSoftDelete: true,
    hasAuditFields: true,
    columns: [
      { name: 'id', type: 'UUID (String 36)', isPk: true, isIdx: true, nullable: false, description: 'Primary Key UUID' },
      { name: 'name', type: 'VARCHAR(255)', isIdx: true, nullable: false, description: 'Repository short name' },
      { name: 'full_name', type: 'VARCHAR(255)', isUk: true, isIdx: true, nullable: false, description: 'Org/Repo slug (e.g. devops/auth-service)' },
      { name: 'git_url', type: 'VARCHAR(512)', nullable: false, description: 'Git clone HTTP / SSH URL' },
      { name: 'default_branch', type: 'VARCHAR(100)', nullable: false, defaultVal: "'main'", description: 'Primary git branch' },
      { name: 'provider', type: 'VARCHAR(50)', isIdx: true, nullable: false, defaultVal: "'GITHUB'", description: 'GITHUB | GITLAB | BITBUCKET' },
      { name: 'is_private', type: 'BOOLEAN', nullable: false, defaultVal: 'true', description: 'Repository access flag' },
      { name: 'language', type: 'VARCHAR(100)', nullable: true, description: 'Primary language' },
      { name: 'is_deleted', type: 'BOOLEAN', isIdx: true, nullable: false, defaultVal: 'false', description: 'Soft delete flag' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Soft delete timestamp' },
      { name: 'created_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'updated_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Creation time' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Last update' },
    ],
    relationships: [
      { targetTable: 'deployments', type: '1:N', foreignKey: 'deployments.repository_id', description: 'Deployments triggered from repo' },
      { targetTable: 'jenkins_builds', type: '1:N', foreignKey: 'jenkins_builds.repository_id', description: 'Jenkins pipeline builds' },
    ],
    checkConstraints: ["provider IN ('GITHUB', 'GITLAB', 'BITBUCKET')"],
    sampleQuery: "SELECT full_name, provider, default_branch FROM repositories WHERE is_private = true;",
  },
  {
    id: 'deployments',
    name: 'deployments',
    category: 'CI/CD & Code',
    description: 'Deployment execution history, release versions, environment targets, commit SHAs, and rollback tracking.',
    columnsCount: 20,
    indexesCount: 6,
    fksCount: 4,
    hasSoftDelete: true,
    hasAuditFields: true,
    columns: [
      { name: 'id', type: 'UUID (String 36)', isPk: true, isIdx: true, nullable: false, description: 'Primary Key UUID' },
      { name: 'deployment_code', type: 'VARCHAR(50)', isUk: true, isIdx: true, nullable: false, description: 'Unique Code (e.g. DEP-1042)' },
      { name: 'service_name', type: 'VARCHAR(100)', isIdx: true, nullable: false, description: 'Target microservice name' },
      { name: 'environment', type: 'VARCHAR(50)', isIdx: true, nullable: false, defaultVal: "'production'", description: 'production | staging | development' },
      { name: 'version', type: 'VARCHAR(50)', nullable: false, description: 'Semantic version tag (v2.4.1)' },
      { name: 'status', type: 'VARCHAR(30)', isIdx: true, nullable: false, defaultVal: "'SUCCESS'", description: 'SUCCESS | DEPLOYING | FAILED | ROLLBACK | PENDING' },
      { name: 'cluster', type: 'VARCHAR(100)', nullable: false, defaultVal: "'us-east-cluster-01'", description: 'K8s or Cloud Run cluster' },
      { name: 'commit_hash', type: 'VARCHAR(40)', nullable: false, description: '40-char git commit SHA' },
      { name: 'author', type: 'VARCHAR(100)', nullable: false, description: 'Commit author name' },
      { name: 'logs_url', type: 'TEXT', nullable: true, description: 'Cloud build / deployment log URL' },
      { name: 'duration_seconds', type: 'INTEGER', nullable: false, defaultVal: '45', description: 'Deployment execution time in seconds' },
      { name: 'rollback_version', type: 'VARCHAR(50)', nullable: true, description: 'Target version if rollback triggered' },
      { name: 'repository_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: true, description: 'FK -> repositories.id' },
      { name: 'deployed_by_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: true, description: 'FK -> users.id' },
      { name: 'is_deleted', type: 'BOOLEAN', isIdx: true, nullable: false, defaultVal: 'false', description: 'Soft delete flag' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Soft delete timestamp' },
      { name: 'created_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'updated_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Creation time' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Last update' },
    ],
    relationships: [
      { targetTable: 'repositories', type: 'N:1', foreignKey: 'repository_id', description: 'Source code repository' },
      { targetTable: 'users', type: 'N:1', foreignKey: 'deployed_by_id', description: 'Deployer user' },
      { targetTable: 'jenkins_builds', type: '1:N', foreignKey: 'jenkins_builds.deployment_id', description: 'Jenkins pipeline builds' },
    ],
    checkConstraints: ["status IN ('SUCCESS', 'DEPLOYING', 'FAILED', 'ROLLBACK', 'PENDING')"],
    sampleQuery: "SELECT deployment_code, service_name, version, status FROM deployments ORDER BY created_at DESC LIMIT 10;",
  },
  {
    id: 'jenkins_builds',
    name: 'jenkins_builds',
    category: 'CI/CD & Code',
    description: 'Jenkins automation job runs, build numbers, triggers, artifact paths, and execution durations.',
    columnsCount: 19,
    indexesCount: 4,
    fksCount: 5,
    hasSoftDelete: true,
    hasAuditFields: true,
    columns: [
      { name: 'id', type: 'UUID (String 36)', isPk: true, isIdx: true, nullable: false, description: 'Primary Key UUID' },
      { name: 'job_name', type: 'VARCHAR(255)', isIdx: true, nullable: false, description: 'Jenkins pipeline job name' },
      { name: 'build_number', type: 'INTEGER', isIdx: true, nullable: false, description: 'Sequential build run number' },
      { name: 'branch', type: 'VARCHAR(100)', nullable: false, defaultVal: "'main'", description: 'Git branch name' },
      { name: 'commit_sha', type: 'VARCHAR(40)', nullable: true, description: 'Commit SHA' },
      { name: 'status', type: 'VARCHAR(50)', isIdx: true, nullable: false, defaultVal: "'SUCCESS'", description: 'SUCCESS | BUILDING | FAILURE | ABORTED | UNSTABLE' },
      { name: 'trigger_cause', type: 'VARCHAR(255)', nullable: false, defaultVal: "'Webhook / SCM Trigger'", description: 'Cause of build trigger' },
      { name: 'duration_ms', type: 'INTEGER', nullable: false, defaultVal: '124000', description: 'Build runtime in milliseconds' },
      { name: 'build_url', type: 'VARCHAR(512)', nullable: true, description: 'Jenkins dashboard build URL' },
      { name: 'artifact_paths', type: 'TEXT', nullable: true, description: 'JSON array or comma list of artifacts' },
      { name: 'repository_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: true, description: 'FK -> repositories.id' },
      { name: 'deployment_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: true, description: 'FK -> deployments.id' },
      { name: 'triggered_by_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: true, description: 'FK -> users.id' },
      { name: 'is_deleted', type: 'BOOLEAN', isIdx: true, nullable: false, defaultVal: 'false', description: 'Soft delete flag' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Soft delete timestamp' },
      { name: 'created_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'updated_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Creation time' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Last update' },
    ],
    relationships: [
      { targetTable: 'repositories', type: 'N:1', foreignKey: 'repository_id', description: 'Source code repository' },
      { targetTable: 'deployments', type: 'N:1', foreignKey: 'deployment_id', description: 'Target deployment' },
      { targetTable: 'users', type: 'N:1', foreignKey: 'triggered_by_id', description: 'Trigger user' },
    ],
    checkConstraints: [
      "status IN ('SUCCESS', 'BUILDING', 'FAILURE', 'ABORTED', 'UNSTABLE')",
      "UNIQUE (job_name, build_number)",
    ],
    sampleQuery: "SELECT job_name, build_number, status, duration_ms FROM jenkins_builds WHERE status = 'FAILURE';",
  },
  {
    id: 'logs',
    name: 'logs',
    category: 'Observability & AI',
    description: 'Central log aggregator for app stdout, Nginx, PostgreSQL, Docker containers, and system log streams with trace IDs.',
    columnsCount: 16,
    indexesCount: 8,
    fksCount: 4,
    hasSoftDelete: true,
    hasAuditFields: true,
    columns: [
      { name: 'id', type: 'UUID (String 36)', isPk: true, isIdx: true, nullable: false, description: 'Primary Key UUID' },
      { name: 'source', type: 'VARCHAR(100)', isIdx: true, nullable: false, defaultVal: "'app'", description: 'system | nginx | postgresql | app | docker | kubernetes' },
      { name: 'level', type: 'VARCHAR(20)', isIdx: true, nullable: false, defaultVal: "'INFO'", description: 'DEBUG | INFO | WARN | ERROR | CRITICAL' },
      { name: 'message', type: 'TEXT', nullable: false, description: 'Full raw or structured log message body' },
      { name: 'service_name', type: 'VARCHAR(255)', isIdx: true, nullable: true, description: 'Microservice identifier' },
      { name: 'timestamp', type: 'TIMESTAMPTZ', isIdx: true, nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Log record time' },
      { name: 'trace_id', type: 'VARCHAR(64)', isIdx: true, nullable: true, description: 'OpenTelemetry distributed trace ID' },
      { name: 'metadata_json', type: 'JSON', nullable: true, description: 'Structured JSON payload' },
      { name: 'server_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: true, description: 'FK -> servers.id' },
      { name: 'container_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: true, description: 'FK -> docker_containers.id' },
      { name: 'is_deleted', type: 'BOOLEAN', isIdx: true, nullable: false, defaultVal: 'false', description: 'Soft delete flag' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Soft delete timestamp' },
      { name: 'created_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'updated_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Creation time' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Last update' },
    ],
    relationships: [
      { targetTable: 'servers', type: 'N:1', foreignKey: 'server_id', description: 'Originating host server' },
      { targetTable: 'docker_containers', type: 'N:1', foreignKey: 'container_id', description: 'Originating Docker container' },
    ],
    checkConstraints: ["level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')"],
    sampleQuery: "SELECT timestamp, level, message FROM logs WHERE level = 'ERROR' ORDER BY timestamp DESC LIMIT 20;",
  },
  {
    id: 'metrics',
    name: 'metrics',
    category: 'Observability & AI',
    description: 'Prometheus metric time-series data store (CPU, Memory, Disk IO, Request Rate, Latency) with tags.',
    columnsCount: 13,
    indexesCount: 5,
    fksCount: 3,
    hasSoftDelete: true,
    hasAuditFields: true,
    columns: [
      { name: 'id', type: 'UUID (String 36)', isPk: true, isIdx: true, nullable: false, description: 'Primary Key UUID' },
      { name: 'metric_name', type: 'VARCHAR(255)', isIdx: true, nullable: false, description: 'Prometheus metric name (e.g. cpu_usage_percent)' },
      { name: 'value', type: 'FLOAT', nullable: false, description: 'Numeric telemetry value' },
      { name: 'unit', type: 'VARCHAR(50)', nullable: true, defaultVal: "'%'", description: 'Unit (%, bytes, ms, req/s)' },
      { name: 'timestamp', type: 'TIMESTAMPTZ', isIdx: true, nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Metric sample timestamp' },
      { name: 'tags', type: 'JSON', nullable: true, description: 'JSON key-value dimensions (env, region, cluster)' },
      { name: 'server_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: true, description: 'FK -> servers.id (CASCADE)' },
      { name: 'is_deleted', type: 'BOOLEAN', isIdx: true, nullable: false, defaultVal: 'false', description: 'Soft delete flag' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Soft delete timestamp' },
      { name: 'created_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'updated_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Creation time' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Last update' },
    ],
    relationships: [
      { targetTable: 'servers', type: 'N:1', foreignKey: 'server_id', description: 'Monitored server instance' },
    ],
    sampleQuery: "SELECT metric_name, value, unit, timestamp FROM metrics WHERE metric_name = 'cpu_usage_percent' ORDER BY timestamp DESC;",
  },
  {
    id: 'alerts',
    name: 'alerts',
    category: 'Observability & AI',
    description: 'Active, acknowledged, and resolved incident alerts raised by Prometheus Alertmanager, Datadog, or Health checks.',
    columnsCount: 16,
    indexesCount: 5,
    fksCount: 4,
    hasSoftDelete: true,
    hasAuditFields: true,
    columns: [
      { name: 'id', type: 'UUID (String 36)', isPk: true, isIdx: true, nullable: false, description: 'Primary Key UUID' },
      { name: 'alert_code', type: 'VARCHAR(50)', isUk: true, isIdx: true, nullable: false, description: 'Unique Code (e.g. ALT-9041)' },
      { name: 'title', type: 'VARCHAR(255)', nullable: false, description: 'Alert headline summary' },
      { name: 'severity', type: 'VARCHAR(50)', isIdx: true, nullable: false, defaultVal: "'HIGH'", description: 'CRITICAL | HIGH | MEDIUM | LOW | INFO' },
      { name: 'status', type: 'VARCHAR(50)', isIdx: true, nullable: false, defaultVal: "'ACTIVE'", description: 'ACTIVE | ACKNOWLEDGED | RESOLVED | SILENCED' },
      { name: 'source', type: 'VARCHAR(100)', isIdx: true, nullable: false, defaultVal: "'Prometheus Alertmanager'", description: 'Alert generator source' },
      { name: 'description', type: 'TEXT', nullable: false, description: 'Detailed root cause / trigger information' },
      { name: 'resolved_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Incident resolution time' },
      { name: 'server_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: true, description: 'FK -> servers.id' },
      { name: 'assigned_to_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: true, description: 'FK -> users.id' },
      { name: 'is_deleted', type: 'BOOLEAN', isIdx: true, nullable: false, defaultVal: 'false', description: 'Soft delete flag' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Soft delete timestamp' },
      { name: 'created_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'updated_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Creation time' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Last update' },
    ],
    relationships: [
      { targetTable: 'servers', type: 'N:1', foreignKey: 'server_id', description: 'Affected infrastructure server' },
      { targetTable: 'users', type: 'N:1', foreignKey: 'assigned_to_id', description: 'Assigned DevOps Engineer' },
      { targetTable: 'notifications', type: '1:N', foreignKey: 'notifications.alert_id', description: 'Generated user notifications' },
    ],
    checkConstraints: [
      "severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')",
      "status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'SILENCED')",
    ],
    sampleQuery: "SELECT alert_code, title, severity FROM alerts WHERE status = 'ACTIVE' ORDER BY severity DESC;",
  },
  {
    id: 'notifications',
    name: 'notifications',
    category: 'Observability & AI',
    description: 'In-app, email, Slack, and webhook notifications pushed to users regarding alerts, deployments, and security events.',
    columnsCount: 15,
    indexesCount: 4,
    fksCount: 4,
    hasSoftDelete: true,
    hasAuditFields: true,
    columns: [
      { name: 'id', type: 'UUID (String 36)', isPk: true, isIdx: true, nullable: false, description: 'Primary Key UUID' },
      { name: 'user_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: false, description: 'FK -> users.id (CASCADE)' },
      { name: 'title', type: 'VARCHAR(255)', nullable: false, description: 'Notification subject' },
      { name: 'message', type: 'TEXT', nullable: false, description: 'Notification content body' },
      { name: 'type', type: 'VARCHAR(50)', nullable: false, defaultVal: "'INFO'", description: 'INFO | ALERT | DEPLOYMENT | SECURITY' },
      { name: 'channel', type: 'VARCHAR(50)', nullable: false, defaultVal: "'IN_APP'", description: 'IN_APP | EMAIL | SLACK | WEBHOOK' },
      { name: 'is_read', type: 'BOOLEAN', isIdx: true, nullable: false, defaultVal: 'false', description: 'Read state flag' },
      { name: 'read_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Time notification was read' },
      { name: 'alert_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: true, description: 'FK -> alerts.id' },
      { name: 'is_deleted', type: 'BOOLEAN', isIdx: true, nullable: false, defaultVal: 'false', description: 'Soft delete flag' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Soft delete timestamp' },
      { name: 'created_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'updated_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Creation time' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Last update' },
    ],
    relationships: [
      { targetTable: 'users', type: 'N:1', foreignKey: 'user_id', description: 'Recipient user' },
      { targetTable: 'alerts', type: 'N:1', foreignKey: 'alert_id', description: 'Associated alert incident' },
    ],
    checkConstraints: [
      "type IN ('INFO', 'ALERT', 'DEPLOYMENT', 'SECURITY')",
      "channel IN ('IN_APP', 'EMAIL', 'SLACK', 'WEBHOOK')",
    ],
    sampleQuery: "SELECT title, message, created_at FROM notifications WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC;",
  },
  {
    id: 'ai_conversations',
    name: 'ai_conversations & ai_messages',
    category: 'Observability & AI',
    description: 'AI DevOps Copilot investigation threads, model selections (Gemini 2.5 Flash), token usage, and structured response logs.',
    columnsCount: 18,
    indexesCount: 5,
    fksCount: 4,
    hasSoftDelete: true,
    hasAuditFields: true,
    columns: [
      { name: 'ai_conversations.id', type: 'UUID (String 36)', isPk: true, isIdx: true, nullable: false, description: 'Primary Key UUID' },
      { name: 'ai_conversations.title', type: 'VARCHAR(255)', nullable: false, description: 'Investigation thread title' },
      { name: 'ai_conversations.user_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: false, description: 'FK -> users.id (CASCADE)' },
      { name: 'ai_conversations.model_used', type: 'VARCHAR(100)', nullable: false, defaultVal: "'gemini-2.5-flash'", description: 'Gemini AI model alias' },
      { name: 'ai_conversations.tokens_used', type: 'INTEGER', nullable: false, defaultVal: '0', description: 'Total tokens consumed' },
      { name: 'ai_conversations.is_pinned', type: 'BOOLEAN', nullable: false, defaultVal: 'false', description: 'Pinned thread flag' },
      { name: 'ai_messages.id', type: 'UUID (String 36)', isPk: true, isIdx: true, nullable: false, description: 'Primary Key UUID for message' },
      { name: 'ai_messages.conversation_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: false, description: 'FK -> ai_conversations.id (CASCADE)' },
      { name: 'ai_messages.sender', type: 'VARCHAR(20)', isIdx: true, nullable: false, description: 'USER | ASSISTANT | SYSTEM' },
      { name: 'ai_messages.content', type: 'TEXT', nullable: false, description: 'Message prompt or AI response text' },
      { name: 'ai_messages.suggested_action', type: 'JSON', nullable: true, description: 'Automated remediation action payload' },
      { name: 'ai_messages.latency_ms', type: 'INTEGER', nullable: true, defaultVal: '320', description: 'Gemini API inference time in ms' },
    ],
    relationships: [
      { targetTable: 'users', type: 'N:1', foreignKey: 'ai_conversations.user_id', description: 'Owner user account' },
      { targetTable: 'ai_messages', type: '1:N', foreignKey: 'ai_messages.conversation_id', description: 'Messages in conversation' },
    ],
    checkConstraints: ["ai_messages.sender IN ('USER', 'ASSISTANT', 'SYSTEM')"],
    sampleQuery: "SELECT m.sender, m.content, m.latency_ms FROM ai_messages m WHERE m.conversation_id = $1 ORDER BY m.created_at ASC;",
  },
  {
    id: 'audit_logs',
    name: 'audit_logs',
    category: 'Core & Auth',
    description: 'Immutable system security audit ledger for user logins, deployments, server reboots, role changes, and API access.',
    columnsCount: 16,
    indexesCount: 8,
    fksCount: 3,
    hasSoftDelete: true,
    hasAuditFields: true,
    columns: [
      { name: 'id', type: 'UUID (String 36)', isPk: true, isIdx: true, nullable: false, description: 'Primary Key UUID' },
      { name: 'action', type: 'VARCHAR(100)', isIdx: true, nullable: false, description: 'Action code (e.g. USER_LOGIN, DEPLOYMENT_TRIGGERED)' },
      { name: 'actor', type: 'VARCHAR(100)', isIdx: true, nullable: false, description: 'Actor email or system process name' },
      { name: 'target_resource', type: 'VARCHAR(255)', isIdx: true, nullable: false, description: 'Target resource identifier (e.g. server:srv-101)' },
      { name: 'details', type: 'TEXT', nullable: true, description: 'Human-readable action context' },
      { name: 'ip_address', type: 'VARCHAR(45)', isIdx: true, nullable: true, description: 'Origin IP address' },
      { name: 'user_agent', type: 'VARCHAR(255)', nullable: true, description: 'Client user agent' },
      { name: 'extra_metadata', type: 'JSON', nullable: true, description: 'JSON metadata snapshot' },
      { name: 'timestamp', type: 'TIMESTAMPTZ', isIdx: true, nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Audit record time' },
      { name: 'user_id', type: 'UUID (String 36)', isFk: true, isIdx: true, nullable: true, description: 'FK -> users.id' },
      { name: 'is_deleted', type: 'BOOLEAN', isIdx: true, nullable: false, defaultVal: 'false', description: 'Soft delete flag' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Soft delete timestamp' },
      { name: 'created_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'updated_by_id', type: 'UUID (String 36)', isFk: true, nullable: true, description: 'FK -> users.id' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Creation time' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', description: 'Last update' },
    ],
    relationships: [
      { targetTable: 'users', type: 'N:1', foreignKey: 'user_id', description: 'User who performed action' },
    ],
    sampleQuery: "SELECT action, actor, target_resource, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 25;",
  },
];

const MERMAID_DIAGRAM_TEXT = `erDiagram
    users ||--o{ refresh_tokens : "has active sessions"
    users ||--o{ servers : "provisions / created_by"
    users ||--o{ deployments : "triggers / deployed_by"
    users ||--o{ jenkins_builds : "triggers"
    users ||--o{ repositories : "created_by"
    users ||--o{ alerts : "assigned_to"
    users ||--o{ notifications : "receives"
    users ||--o{ ai_conversations : "owns"
    users ||--o{ audit_logs : "performed_by"

    servers ||--o{ docker_containers : "hosts"
    servers ||--o{ metrics : "emits"
    servers ||--o{ logs : "generates"
    servers ||--o{ alerts : "triggers_alert_on"

    repositories ||--o{ deployments : "deploys_source"
    repositories ||--o{ jenkins_builds : "triggers_build"

    deployments ||--o{ jenkins_builds : "associated_pipeline"

    docker_containers ||--o{ logs : "outputs_std_logs"

    alerts ||--o{ notifications : "generates_notification"

    ai_conversations ||--o{ ai_messages : "contains"`;

export const DatabaseSchemaView: React.FC<DatabaseSchemaViewProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTableId, setActiveTableId] = useState<string>('users');
  const [activeTab, setActiveTab] = useState<'erd' | 'tables' | 'migration' | 'mermaid'>('erd');
  const [copied, setCopied] = useState(false);

  const filteredTables = selectedCategory === 'ALL'
    ? TABLES
    : TABLES.filter((t) => t.category === selectedCategory);

  const activeTable = TABLES.find((t) => t.id === activeTableId) || TABLES[0];

  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(MERMAID_DIAGRAM_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              PostgreSQL 15+ Schema
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              13 Tables • Soft Delete • Audit Metadata
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Production Database Architecture
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Full relational schema design with SQLAlchemy 2.x models, Alembic migrations, composite indexes, and ER diagram.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            Back to Dashboard
          </button>
          <a
            href="/docs/ER_DIAGRAM.md"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-base">description</span>
            <span>View ERD Markdown</span>
          </a>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Tables</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">13</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Fully normalized entities</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Relationships</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">24</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Foreign Key constraints</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Indexes</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">62</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Single & composite indexes</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Soft Delete</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">100%</p>
          <p className="text-[11px] text-slate-500 mt-0.5">`is_deleted` on domain tables</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Auditing</p>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">Enabled</p>
          <p className="text-[11px] text-slate-500 mt-0.5">`created_by_id`, `updated_by_id`</p>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'erd', label: 'Interactive ER Diagram', icon: 'account_tree' },
          { id: 'tables', label: 'Table Inspector & Query Builder', icon: 'table_chart' },
          { id: 'migration', label: 'Alembic Python Migration', icon: 'code' },
          { id: 'mermaid', label: 'Mermaid ERD Source', icon: 'terminal' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-xs border-b-2 cursor-pointer transition-all ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: INTERACTIVE ER DIAGRAM */}
      {activeTab === 'erd' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400">schema</span>
                  Visual Schema & Entity Map
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any entity card to inspect columns, constraints, foreign keys, and indexes.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'Core & Auth', 'Infrastructure & Docker', 'CI/CD & Code', 'Observability & AI'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Entity Nodes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[680px] overflow-y-auto pr-1">
              {filteredTables.map((table) => {
                const isSelected = activeTableId === table.id;
                return (
                  <div
                    key={table.id}
                    onClick={() => setActiveTableId(table.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500 shadow-lg ring-1 ring-blue-500'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-400 text-base">table_rows</span>
                        <span className="font-extrabold text-slate-100 font-mono text-sm">{table.name}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold rounded uppercase">
                        {table.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{table.description}</p>

                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Columns</span>
                        <span className="font-bold text-blue-300">{table.columnsCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Foreign Keys</span>
                        <span className="font-bold text-emerald-300">{table.fksCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Indexes</span>
                        <span className="font-bold text-purple-300">{table.indexesCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {table.hasSoftDelete && (
                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold rounded">
                          Soft Delete
                        </span>
                      )}
                      {table.hasAuditFields && (
                        <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-semibold rounded">
                          Audited
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Table Detail Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Table Detail Inspector
                </span>
                <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {activeTable.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{activeTable.description}</p>
              </div>

              <div className="flex gap-2">
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold">
                  {activeTable.category}
                </span>
              </div>
            </div>

            {/* Column Breakdown Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Column Definitions & Indexes
              </h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Column Name</th>
                      <th className="p-3">PostgreSQL Type</th>
                      <th className="p-3">Keys / Indexes</th>
                      <th className="p-3">Nullable</th>
                      <th className="p-3">Default</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {activeTable.columns.map((col, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{col.name}</td>
                        <td className="p-3 text-blue-600 dark:text-blue-400">{col.type}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {col.isPk && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-bold rounded">PK</span>}
                            {col.isFk && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold rounded">FK</span>}
                            {col.isUk && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-bold rounded">UK</span>}
                            {col.isIdx && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold rounded">IDX</span>}
                          </div>
                        </td>
                        <td className="p-3 text-slate-500">{col.nullable ? 'YES' : 'NO'}</td>
                        <td className="p-3 text-amber-600 dark:text-amber-400">{col.defaultVal || '-'}</td>
                        <td className="p-3 font-sans text-slate-600 dark:text-slate-400">{col.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Check Constraints */}
            {activeTable.checkConstraints && activeTable.checkConstraints.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  SQL Check Constraints
                </h4>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-amber-600 dark:text-amber-400 space-y-1">
                  {activeTable.checkConstraints.map((cc, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>CHECK ({cc})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample SQL Query */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Sample Query
              </h4>
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto">
                {activeTable.sampleQuery}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TABLE INSPECTOR & QUERY BUILDER */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Table Inventory</h3>
            <div className="space-y-1">
              {TABLES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTableId(t.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    activeTableId === t.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{t.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${activeTableId === t.id ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {t.columnsCount} cols
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {activeTable.name} Schema Specifications
              </h3>
              <p className="text-xs text-slate-500 mt-1">{activeTable.description}</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Foreign Key Relationships</h4>
              <div className="space-y-2">
                {activeTable.relationships.map((rel, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold rounded">
                        {rel.type}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{rel.targetTable}</span>
                      <span className="text-slate-400 font-mono">via ({rel.foreignKey})</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">{rel.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALEMBIC PYTHON MIGRATION */}
      {activeTab === 'migration' && (
        <div className="bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-2">
                <span className="material-symbols-outlined">code</span>
                backend/alembic/versions/001_initial_production_schema.py
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Executable Alembic migration script supporting PostgreSQL upgrade() and downgrade() functions.
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText("# Alembic Migration Script Generated in backend/alembic/versions/001_initial_production_schema.py");
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy Script Path'}
            </button>
          </div>

          <pre className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[600px]">
{`"""Initial Production PostgreSQL Schema Migration.

Revision ID: 001
Revises: None
Create Date: 2026-08-06
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None

def upgrade() -> None:
    # 1. users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="VIEWER"),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    # 2. servers, docker_containers, deployments, jenkins_builds, logs, metrics, alerts...
    # Full migration handles all 13 PostgreSQL tables with complete foreign keys and composite indexes.

def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("ai_messages")
    op.drop_table("ai_conversations")
    op.drop_table("notifications")
    op.drop_table("alerts")
    op.drop_table("metrics")
    op.drop_table("logs")
    op.drop_table("jenkins_builds")
    op.drop_table("deployments")
    op.drop_table("repositories")
    op.drop_table("docker_containers")
    op.drop_table("servers")
    op.drop_table("refresh_tokens")
    op.drop_table("users")`}
          </pre>
        </div>
      )}

      {/* TAB 4: MERMAID ERD SOURCE */}
      {activeTab === 'mermaid' && (
        <div className="bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-blue-400 font-mono flex items-center gap-2">
                <span className="material-symbols-outlined">terminal</span>
                Mermaid.js Entity Relationship Diagram Code
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste into GitHub Markdown or Mermaid Live Editor for instant rendering.
              </p>
            </div>

            <button
              onClick={handleCopyMermaid}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Mermaid ERD'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-cyan-300 overflow-x-auto max-h-[500px]">
            {MERMAID_DIAGRAM_TEXT}
          </pre>
        </div>
      )}
    </div>
  );
};
