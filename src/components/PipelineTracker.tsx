import React, { useState } from 'react';
import { Pipeline, PipelineStage, NavigationPath } from '../types';

interface PipelineTrackerProps {
  onNavigate?: (path: NavigationPath) => void;
  onOpenDeployModal?: () => void;
}

export const INITIAL_PIPELINES: Pipeline[] = [
  {
    id: 'pipe-101',
    name: 'payment-service-v2.4.1',
    repository: 'fintech/payment-gateway',
    branch: 'main',
    commit: 'c89a4e2',
    commitMsg: 'feat: add stripe webhook retries & idempotency',
    author: 'sarah.k',
    env: 'PROD',
    status: 'running',
    totalDuration: '3m 42s',
    startTime: '2 mins ago',
    stages: [
      {
        id: 'stg-1',
        name: 'Source',
        status: 'completed',
        duration: '12s',
        details: 'Git checkout commit c89a4e2',
        logs: ['[02:18:01] Fetching origin/main...', '[02:18:04] Checked out commit c89a4e2', '[02:18:08] Verified GPG signature']
      },
      {
        id: 'stg-2',
        name: 'Build',
        status: 'completed',
        duration: '1m 15s',
        details: 'Docker image built & pushed to ECR',
        logs: ['[02:18:15] Building Dockerfile (target: prod)...', '[02:19:10] Layer caching applied (8/12)', '[02:19:25] Tagged image payment-gateway:c89a4e2', '[02:19:30] Image pushed to registry.internal']
      },
      {
        id: 'stg-3',
        name: 'Test & Scan',
        status: 'running',
        duration: '1m 20s (in progress)',
        details: 'Running Integration Tests & Trivy vulnerability scan',
        logs: ['[02:19:35] Running Jest unit tests (148/148 passed)', '[02:20:10] Running Integration Suite on isolated container...', '[02:20:45] Trivy Vulnerability Scan: 0 Critical, 0 High', '[02:21:10] Executing database migration dry-run...']
      },
      {
        id: 'stg-4',
        name: 'Deploy',
        status: 'pending',
        details: 'Pending k8s Helm upgrade to prod-cluster-us-east',
        logs: ['[Waiting] Awaiting completion of Test & Scan stage']
      }
    ]
  },
  {
    id: 'pipe-102',
    name: 'auth-service-v3.1.0',
    repository: 'core/auth-service',
    branch: 'release/3.1',
    commit: 'f92b71d',
    commitMsg: 'fix: patch JWT token expiry edge case in OAuth handler',
    author: 'devin.m',
    env: 'STG',
    status: 'passed',
    totalDuration: '4m 10s',
    startTime: '18 mins ago',
    stages: [
      {
        id: 'stg-1',
        name: 'Source',
        status: 'completed',
        duration: '8s',
        details: 'Git checkout commit f92b71d',
        logs: ['[02:02:10] Git checkout successful']
      },
      {
        id: 'stg-2',
        name: 'Build',
        status: 'completed',
        duration: '1m 45s',
        details: 'Compiled TypeScript bundle & Docker artifact',
        logs: ['[02:02:20] tsc build succeeded without errors', '[02:04:00] Image tagged auth-service:f92b71d']
      },
      {
        id: 'stg-3',
        name: 'Test & Scan',
        status: 'completed',
        duration: '1m 10s',
        details: 'Passed 210 unit tests & SonarQube quality gate',
        logs: ['[02:04:10] Unit tests 100% pass rate', '[02:05:15] Quality gate PASSED']
      },
      {
        id: 'stg-4',
        name: 'Deploy',
        status: 'completed',
        duration: '1m 07s',
        details: 'Successfully deployed to staging-us-west K8s cluster',
        logs: ['[02:05:20] Rolling update initiated (replica: 3)', '[02:06:15] Readiness probes 3/3 passed', '[02:06:27] Deployment healthy']
      }
    ]
  },
  {
    id: 'pipe-103',
    name: 'analytics-worker-v1.0.4',
    repository: 'data/analytics-worker',
    branch: 'fix/kafka-lag',
    commit: 'e109d3a',
    commitMsg: 'perf: batch insert clickstream events into ClickHouse',
    author: 'elena.r',
    env: 'DEV',
    status: 'failed',
    totalDuration: '1m 52s',
    startTime: '45 mins ago',
    stages: [
      {
        id: 'stg-1',
        name: 'Source',
        status: 'completed',
        duration: '10s',
        details: 'Git checkout commit e109d3a',
        logs: ['[01:35:00] Source checkout completed']
      },
      {
        id: 'stg-2',
        name: 'Build',
        status: 'completed',
        duration: '1m 12s',
        details: 'Go binary compilation completed',
        logs: ['[01:35:15] go build -o worker . succeeded']
      },
      {
        id: 'stg-3',
        name: 'Test & Scan',
        status: 'failed',
        duration: '30s',
        details: 'Failed: Consumer lag integration test timeout',
        logs: [
          '[01:36:30] Running integration test suite...',
          '[01:36:50] FAIL: TestKafkaConsumerBatchAck (timeout after 20s)',
          '[01:36:55] Error: Expected 5000 messages processed, got 4812',
          '[01:37:00] Build failed with exit code 1'
        ]
      },
      {
        id: 'stg-4',
        name: 'Deploy',
        status: 'pending',
        details: 'Skipped due to test failure',
        logs: ['[Skipped] Stage aborted due to previous stage failure']
      }
    ]
  }
];

export const PipelineTracker: React.FC<PipelineTrackerProps> = ({
  onNavigate,
  onOpenDeployModal
}) => {
  const [pipelines, setPipelines] = useState<Pipeline[]>(INITIAL_PIPELINES);
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'passed' | 'failed'>('all');
  const [envFilter, setEnvFilter] = useState<'all' | 'PROD' | 'STG' | 'DEV'>('all');
  const [selectedStage, setSelectedStage] = useState<{ pipelineName: string; stage: PipelineStage } | null>(null);
  const [restartingId, setRestartingId] = useState<string | null>(null);

  const filteredPipelines = pipelines.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (envFilter !== 'all' && p.env !== envFilter) return false;
    return true;
  });

  const handleRerunPipeline = (id: string) => {
    setRestartingId(id);
    setTimeout(() => {
      setPipelines((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            return {
              ...p,
              status: 'running',
              startTime: 'Just now',
              stages: p.stages.map((s, idx) =>
                idx === 0
                  ? { ...s, status: 'completed', duration: '5s' }
                  : idx === 1
                  ? { ...s, status: 'running', duration: '10s (in progress)' }
                  : { ...s, status: 'pending' }
              )
            };
          }
          return p;
        })
      );
      setRestartingId(null);
    }, 1200);
  };

  const getStageIcon = (status: PipelineStage['status']) => {
    switch (status) {
      case 'completed':
        return <span className="material-symbols-outlined text-sm text-emerald-600 font-bold">check</span>;
      case 'running':
        return <span className="material-symbols-outlined text-sm text-blue-600 animate-spin font-bold">sync</span>;
      case 'failed':
        return <span className="material-symbols-outlined text-sm text-red-600 font-bold">close</span>;
      case 'pending':
      default:
        return <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>;
    }
  };

  const getStageBadgeStyles = (status: PipelineStage['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs';
      case 'running':
        return 'bg-blue-50 border-blue-400 text-blue-700 ring-2 ring-blue-100 shadow-xs animate-pulse';
      case 'failed':
        return 'bg-red-50 border-red-300 text-red-700 shadow-xs';
      case 'pending':
      default:
        return 'bg-slate-50 border-slate-200 text-slate-400';
    }
  };

  const getConnectorStyle = (currStatus: PipelineStage['status'], nextStatus: PipelineStage['status']) => {
    if (currStatus === 'completed' && (nextStatus === 'completed' || nextStatus === 'running')) {
      return 'bg-emerald-500';
    }
    if (currStatus === 'completed' && nextStatus === 'failed') {
      return 'bg-red-400';
    }
    if (currStatus === 'running') {
      return 'bg-gradient-to-r from-emerald-500 via-blue-500 to-slate-200 animate-pulse';
    }
    if (currStatus === 'failed') {
      return 'bg-red-200';
    }
    return 'bg-slate-200';
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-xs flex flex-col gap-5 border border-slate-200 dark:border-slate-800 w-full transition-colors">
      {/* Top Bar Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <span className="material-symbols-outlined text-xl">account_tree</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base text-slate-900 dark:text-slate-100 font-bold tracking-tight">
                Active CI/CD Pipelines
              </h2>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                Live Tracking
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time progress monitoring across Source, Build, Test, and Deployment stages.
            </p>
          </div>
        </div>

        {/* Filter Controls & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {(['all', 'running', 'passed', 'failed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Environment Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {(['all', 'PROD', 'STG', 'DEV'] as const).map((env) => (
              <button
                key={env}
                onClick={() => setEnvFilter(env)}
                className={`px-2.5 py-1 rounded-md uppercase transition-all cursor-pointer ${
                  envFilter === env
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {env}
              </button>
            ))}
          </div>

          {/* Trigger Deployment Action */}
          {onOpenDeployModal && (
            <button
              onClick={onOpenDeployModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              Run Pipeline
            </button>
          )}
        </div>
      </div>

      {/* Pipelines List with Horizontal Stage Timeline */}
      <div className="flex flex-col gap-4">
        {filteredPipelines.length === 0 ? (
          <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
            No active pipelines matching filters.
          </div>
        ) : (
          filteredPipelines.map((pipeline) => {
            const completedCount = pipeline.stages.filter((s) => s.status === 'completed').length;
            const progressPercent = Math.round((completedCount / pipeline.stages.length) * 100);

            return (
              <div
                key={pipeline.id}
                className={`bg-slate-50/70 rounded-xl border transition-all p-4 flex flex-col gap-3.5 hover:shadow-xs ${
                  pipeline.status === 'running'
                    ? 'border-blue-200 bg-blue-50/20'
                    : pipeline.status === 'failed'
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Pipeline Top Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Environment Pill */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        pipeline.env === 'PROD'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : pipeline.env === 'STG'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {pipeline.env}
                    </span>

                    {/* Name */}
                    <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                      {pipeline.name}
                    </span>

                    {/* Repo & Branch */}
                    <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                      <span className="material-symbols-outlined text-xs">code</span>
                      <span>{pipeline.repository}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-blue-600 font-bold">{pipeline.branch}</span>
                    </div>

                    {/* Commit Message snippet */}
                    <span className="text-slate-500 truncate max-w-xs text-[11px] italic hidden xl:inline">
                      "{pipeline.commitMsg}"
                    </span>
                  </div>

                  {/* Metadata & Quick Action */}
                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">person</span>
                      <span>{pipeline.author}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      <span>{pipeline.totalDuration}</span>
                    </div>

                    {/* Rerun Button */}
                    <button
                      onClick={() => handleRerunPipeline(pipeline.id)}
                      disabled={restartingId === pipeline.id}
                      className="flex items-center gap-1 text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 transition-colors cursor-pointer font-semibold"
                      title="Rerun pipeline"
                    >
                      <span
                        className={`material-symbols-outlined text-sm ${
                          restartingId === pipeline.id ? 'animate-spin text-blue-600' : ''
                        }`}
                      >
                        refresh
                      </span>
                      <span>Rerun</span>
                    </button>

                    {/* View Logs Button */}
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('logs')}
                        className="flex items-center gap-1 text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 transition-colors cursor-pointer font-semibold"
                        title="View pipeline logs"
                      >
                        <span className="material-symbols-outlined text-sm">terminal</span>
                        <span>Logs</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Overall Progress Bar Line */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-700 ease-out ${
                      pipeline.status === 'failed'
                        ? 'bg-red-500'
                        : pipeline.status === 'passed'
                        ? 'bg-emerald-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>

                {/* Horizontal Stages Timeline Track */}
                <div className="pt-1 pb-1">
                  <div className="grid grid-cols-4 gap-2 relative">
                    {pipeline.stages.map((stage, idx) => {
                      const nextStage = pipeline.stages[idx + 1];
                      const isLast = idx === pipeline.stages.length - 1;

                      return (
                        <div key={stage.id} className="relative flex flex-col items-center group">
                          {/* Horizontal Connector Line to next step */}
                          {!isLast && (
                            <div className="absolute top-4 left-1/2 w-full h-0.5 z-0 pointer-events-none px-4">
                              <div
                                className={`h-full transition-colors duration-500 ${getConnectorStyle(
                                  stage.status,
                                  nextStage?.status || 'pending'
                                )}`}
                              ></div>
                            </div>
                          )}

                          {/* Stage Node Button */}
                          <button
                            onClick={() => setSelectedStage({ pipelineName: pipeline.name, stage })}
                            className={`relative z-10 w-8 h-8 rounded-full border flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${getStageBadgeStyles(
                              stage.status
                            )}`}
                            title={`Click to inspect stage: ${stage.name}`}
                          >
                            {getStageIcon(stage.status)}
                          </button>

                          {/* Stage Title & Details */}
                          <div className="mt-2 text-center flex flex-col items-center">
                            <span className="text-xs font-bold text-slate-800 leading-tight">
                              {stage.name}
                            </span>

                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {stage.duration || (stage.status === 'pending' ? 'Queued' : '')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stage Inspection Logs Modal */}
      {selectedStage && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl max-w-2xl w-full p-5 border border-slate-800 text-slate-100 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-lg">view_timeline</span>
                <span className="font-bold text-white text-sm">
                  {selectedStage.pipelineName} &bull; Stage: {selectedStage.stage.name}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                    selectedStage.stage.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : selectedStage.stage.status === 'running'
                      ? 'bg-blue-950 text-blue-400 border border-blue-800'
                      : selectedStage.stage.status === 'failed'
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {selectedStage.stage.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedStage(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-slate-400">
                <span className="text-slate-500">Details:</span> {selectedStage.stage.details || 'N/A'}
              </p>
              {selectedStage.stage.duration && (
                <p className="text-slate-400">
                  <span className="text-slate-500">Duration:</span> {selectedStage.stage.duration}
                </p>
              )}
            </div>

            {/* Terminal output box */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1 max-h-60 overflow-y-auto text-[11px] text-slate-300">
              <div className="text-slate-600 pb-1 border-b border-slate-800 text-[10px] uppercase font-bold">
                Console Output
              </div>
              {selectedStage.stage.logs && selectedStage.stage.logs.length > 0 ? (
                selectedStage.stage.logs.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.includes('FAIL') || line.includes('Error') || line.includes('failed')
                        ? 'text-red-400 font-bold'
                        : line.includes('PASSED') || line.includes('passed') || line.includes('successful')
                        ? 'text-emerald-400'
                        : ''
                    }
                  >
                    {line}
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic">No output logs recorded for this stage yet.</div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              {onNavigate && (
                <button
                  onClick={() => {
                    setSelectedStage(null);
                    onNavigate('logs');
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Open full terminal log viewer
                </button>
              )}
              <button
                onClick={() => setSelectedStage(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
