import React, { useState, useEffect, useRef } from 'react';
import { NavigationPath } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JenkinsJob {
  id: string;
  jobName: string;
  buildNumber: number;
  branch: string;
  commitSha: string;
  env: 'PROD' | 'STG' | 'DEV';
  status: 'SUCCESS' | 'BUILDING' | 'FAILURE' | 'QUEUED' | 'ABORTED';
  durationMs: number;
  triggerCause: string;
  author: string;
  timestamp: string;
  buildUrl: string;
  artifacts: string[];
}

interface PipelineStageItem {
  name: string;
  icon: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration: string;
  detail: string;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_JENKINS_BUILDS: JenkinsJob[] = [
  {
    id: 'jb-101',
    jobName: 'deploy-user-service',
    buildNumber: 42,
    branch: 'main',
    commitSha: 'a8f19c2',
    env: 'PROD',
    status: 'SUCCESS',
    durationMs: 45000,
    triggerCause: 'DevOps-AI Automated Release',
    author: 'Sarah Dev',
    timestamp: '10 mins ago',
    buildUrl: 'http://localhost:8080/job/deploy-user-service/42/',
    artifacts: ['user-service-v2.4.1.jar', 'docker-compose.prod.yml', 'coverage-report.xml'],
  },
  {
    id: 'jb-100',
    jobName: 'build-auth-microservice',
    buildNumber: 128,
    branch: 'feature/oauth-v2',
    commitSha: 'c4d71e9',
    env: 'STG',
    status: 'SUCCESS',
    durationMs: 38000,
    triggerCause: 'GitHub Webhook / SCM Push',
    author: 'Alex Dev',
    timestamp: '42 mins ago',
    buildUrl: 'http://localhost:8080/job/build-auth-microservice/128/',
    artifacts: ['auth-service-v1.8.0.tar.gz', 'unit-tests.xml'],
  },
  {
    id: 'jb-099',
    jobName: 'run-security-scan',
    buildNumber: 87,
    branch: 'main',
    commitSha: 'e912ab4',
    env: 'DEV',
    status: 'FAILURE',
    durationMs: 12000,
    triggerCause: 'Scheduled Cron Trigger',
    author: 'System Bot',
    timestamp: '2 hours ago',
    buildUrl: 'http://localhost:8080/job/run-security-scan/87/',
    artifacts: ['trivy-scan-report.json'],
  },
  {
    id: 'jb-098',
    jobName: 'deploy-payment-api',
    buildNumber: 31,
    branch: 'release/v1.2',
    commitSha: 'f03c981',
    env: 'PROD',
    status: 'SUCCESS',
    durationMs: 62000,
    triggerCause: 'Manual Trigger via DevOps-AI',
    author: 'Priya Eng',
    timestamp: '5 hours ago',
    buildUrl: 'http://localhost:8080/job/deploy-payment-api/31/',
    artifacts: ['payment-api-v1.2.0.jar', 'k8s-deployment.yaml'],
  },
];

const INITIAL_STAGES: PipelineStageItem[] = [
  { name: 'Checkout SCM', icon: 'source', status: 'pending', duration: '', detail: 'git clone branch main from GitHub repository' },
  { name: 'Install & Lint', icon: 'download', status: 'pending', duration: '', detail: 'npm ci && eslint . --max-warnings 0' },
  { name: 'Unit Tests', icon: 'labs', status: 'pending', duration: '', detail: 'pytest tests/ -v --cov=app --cov-report=xml' },
  { name: 'Docker Build', icon: 'widgets', status: 'pending', duration: '', detail: 'docker build -t {job}:{version} . && docker push' },
  { name: 'Security Scan', icon: 'security', status: 'pending', duration: '', detail: 'trivy image --exit-code 1 --severity HIGH,CRITICAL {job}:{version}' },
  { name: 'Deploy K8s', icon: 'cloud_upload', status: 'pending', duration: '', detail: 'kubectl set image deployment/{job} {job}={job}:{version} -n {env}' },
  { name: 'Notify GitHub', icon: 'notifications_active', status: 'pending', duration: '', detail: "POST /repos/{repo}/statuses — state: success, context: ci/jenkins" },
];

const JENKINSFILE_TEXT = `pipeline {
  agent {
    docker {
      image 'node:20-alpine'
      args  '-v /var/run/docker.sock:/var/run/docker.sock'
    }
  }

  environment {
    REGISTRY    = 'registry.devops-ai.io'
    IMAGE_NAME  = "\${JOB_BASE_NAME}"
    K8S_NS      = "\${params.ENVIRONMENT.toLowerCase()}"
  }

  parameters {
    string(name: 'VERSION',     defaultValue: 'latest',  description: 'Release version tag')
    string(name: 'ENVIRONMENT', defaultValue: 'STG',     description: 'Target deployment env')
    string(name: 'COMMIT_HASH', defaultValue: '',        description: 'Git commit SHA')
    string(name: 'AUTHOR',      defaultValue: 'DevOps',  description: 'Trigger author')
  }

  stages {
    stage('Checkout SCM') {
      steps {
        checkout scm
        sh 'git log -1 --oneline'
      }
    }

    stage('Install & Lint') {
      steps {
        sh 'npm ci'
        sh 'eslint . --max-warnings 0'
      }
    }

    stage('Unit & Integration Tests') {
      steps {
        sh 'pytest tests/ -v --cov=app --cov-report=xml'
        junit 'reports/unit-tests.xml'
      }
      post {
        always {
          archiveArtifacts artifacts: 'reports/*.xml', fingerprint: true
        }
      }
    }

    stage('Build & Push Docker Image') {
      steps {
        script {
          def image = docker.build(
            "\${REGISTRY}/\${IMAGE_NAME}:\${params.VERSION}"
          )
          docker.withRegistry("https://\${REGISTRY}", 'docker-registry-creds') {
            image.push()
            image.push('latest')
          }
        }
      }
    }

    stage('Security Scan (Trivy)') {
      steps {
        sh """
          trivy image \\
            --exit-code 1 \\
            --severity HIGH,CRITICAL \\
            \${REGISTRY}/\${IMAGE_NAME}:\${params.VERSION}
        """
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: 'k8s-kubeconfig', variable: 'KUBECONFIG')]) {
          sh """
            kubectl set image deployment/\${IMAGE_NAME} \\
              \${IMAGE_NAME}=\${REGISTRY}/\${IMAGE_NAME}:\${params.VERSION} \\
              -n \${K8S_NS}
            kubectl rollout status deployment/\${IMAGE_NAME} -n \${K8S_NS}
          """
        }
      }
    }

    stage('Notify GitHub Status') {
      steps {
        script {
          // Calls GitHub REST API — mirrors backend/app/integrations/github.py
          sh """
            curl -s -X POST \\
              -H "Authorization: token \${GITHUB_TOKEN}" \\
              -d '{"state":"success","context":"ci/jenkins","description":"Build \${params.VERSION} deployed to \${params.ENVIRONMENT}"}' \\
              https://api.github.com/repos/\${ORG}/\${REPO}/statuses/\${params.COMMIT_HASH}
          """
        }
      }
    }

    stage('Record to DevOps-AI DB') {
      steps {
        // This stage calls the DevOps-AI backend API to log the build
        // Mirrors: backend/app/services/deployment.py -> JenkinsClient.trigger_job()
        sh """
          curl -s -X POST http://devops-ai-backend:8000/api/v1/jenkins-builds \\
            -H "Content-Type: application/json" \\
            -H "Authorization: Bearer \${DEVOPS_AI_TOKEN}" \\
            -d '{
              "job_name": "\${IMAGE_NAME}",
              "build_number": \${BUILD_NUMBER},
              "branch": "\${GIT_BRANCH}",
              "commit_sha": "\${params.COMMIT_HASH}",
              "status": "SUCCESS",
              "duration_ms": \${currentBuild.duration},
              "build_url": "\${BUILD_URL}",
              "trigger_cause": "Jenkinsfile Pipeline Stage"
            }'
        """
      }
    }
  }

  post {
    failure {
      mail to: 'devops-team@company.io',
           subject: "FAILED: \${JOB_NAME} Build #\${BUILD_NUMBER}",
           body: "See details at \${BUILD_URL}"
    }
    always {
      cleanWs()
    }
  }
}`;

const API_CURL_LINES = [
  { comment: '# 1. Trigger a Jenkins build via DevOps-AI backend', cmd: "curl -X POST http://localhost:8000/api/v1/deployments \\" },
  { cmd: '  -H "Authorization: Bearer <JWT_TOKEN>" \\' },
  { cmd: '  -H "Content-Type: application/json" \\' },
  { cmd: "  -d '{\"service_name\": \"user-service\", \"version\": \"v2.5.0\", \"environment\": \"STG\", \"commit_hash\": \"a8f19c2\", \"author\": \"dev-lead\"}'" },
  { comment: '', cmd: '' },
  { comment: '# FastAPI DeploymentService.create_deployment() then calls:', cmd: '' },
  { cmd: '# JenkinsClient.trigger_job("deploy-user-service", {VERSION: "v2.5.0", ...})' },
  { cmd: '', comment: '' },
  { comment: '# 2. Query Jenkins build history from DevOps-AI DB', cmd: "curl -X GET http://localhost:8000/api/v1/jenkins-builds \\" },
  { cmd: '  -H "Authorization: Bearer <JWT_TOKEN>"' },
  { cmd: '', comment: '' },
  { comment: '# Response (from postgresql jenkins_builds table):', cmd: '' },
  { cmd: '# { "items": [ { "job_name": "deploy-user-service", "build_number": 42,' },
  { cmd: '#   "status": "SUCCESS", "duration_ms": 45000, "env": "PROD" ... } ] }' },
  { cmd: '', comment: '' },
  { comment: '# 3. Abort a running build', cmd: "curl -X POST http://localhost:8000/api/v1/deployments/{id} \\" },
  { cmd: '  -H "Authorization: Bearer <JWT_TOKEN>" \\' },
  { cmd: "  -d '{\"status\": \"ABORTED\"}'" },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface JenkinsShowcaseViewProps {
  onNavigate: (path: NavigationPath) => void;
  onOpenDeployModal?: () => void;
}

export const JenkinsShowcaseView: React.FC<JenkinsShowcaseViewProps> = ({ onNavigate }) => {
  const [builds, setBuilds] = useState<JenkinsJob[]>(INITIAL_JENKINS_BUILDS);
  const [selectedJob, setSelectedJob] = useState<string>('deploy-user-service');
  const [selectedEnv, setSelectedEnv] = useState<'PROD' | 'STG' | 'DEV'>('STG');
  const [branch, setBranch] = useState<string>('main');
  const [version, setVersion] = useState<string>('v2.5.0');

  // Build simulation
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildProgress, setBuildProgress] = useState<number>(0);
  const [currentLogs, setCurrentLogs] = useState<string[]>([]);

  // Stages
  const [stages, setStages] = useState<PipelineStageItem[]>(INITIAL_STAGES);
  const [stagesStarted, setStagesStarted] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'console' | 'stages' | 'history' | 'jenkinsfile' | 'api-demo' | 'faculty-guide'>('stages');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentLogs]);

  // ─── Live Analytics ──────────────────────────────────────────────────────────
  const totalBuilds = builds.length;
  const successBuilds = builds.filter(b => b.status === 'SUCCESS').length;
  const failedBuilds = builds.filter(b => b.status === 'FAILURE').length;
  const successRate = totalBuilds > 0 ? Math.round((successBuilds / totalBuilds) * 100) : 0;
  const avgDuration = totalBuilds > 0 ? Math.round(builds.reduce((acc, b) => acc + b.durationMs, 0) / totalBuilds / 1000) : 0;
  const jobCounts = builds.reduce((acc, b) => { acc[b.jobName] = (acc[b.jobName] || 0) + 1; return acc; }, {} as Record<string, number>);
  const mostActiveJob = Object.entries(jobCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  // ─── Build Trigger ───────────────────────────────────────────────────────────
  const triggerJenkinsBuild = () => {
    if (isBuilding) return;

    setIsBuilding(true);
    setBuildProgress(5);
    setStagesStarted(true);
    setActiveTab('console');

    // Reset stages
    setStages(INITIAL_STAGES.map(s => ({ ...s, status: 'pending', duration: '' })));

    const addLog = (logs: string[]) => setCurrentLogs(prev => [...prev, ...logs]);

    setCurrentLogs([
      `[${new Date().toLocaleTimeString()}] Connecting to Jenkins at http://localhost:8080...`,
      `[${new Date().toLocaleTimeString()}] Requesting CSRF Crumb: GET /crumbIssuer/api/json`,
      `[${new Date().toLocaleTimeString()}] HTTP 200 OK — Crumb: Jenkins-Crumb: 9f8a2b3c1d4e`,
      `[${new Date().toLocaleTimeString()}] POST /job/${selectedJob}/buildWithParameters`,
      `[${new Date().toLocaleTimeString()}] Params: VERSION=${version}, ENVIRONMENT=${selectedEnv}, COMMIT_HASH=7f3b890, AUTHOR=Dev Lead`,
      `[${new Date().toLocaleTimeString()}] HTTP 201 — Location: /queue/item/43/ — Build #43 QUEUED`,
    ]);

    // Stage 1: Checkout
    setTimeout(() => {
      setBuildProgress(15);
      setStages(s => s.map((st, i) => i === 0 ? { ...st, status: 'running' } : st));
      addLog([`[${new Date().toLocaleTimeString()}] Stage [1/7] Checkout SCM — agent: node-worker-01`]);
    }, 800);

    setTimeout(() => {
      setBuildProgress(25);
      setStages(s => s.map((st, i) => i === 0 ? { ...st, status: 'passed', duration: '2.1s' } : i === 1 ? { ...st, status: 'running' } : st));
      addLog([
        `[${new Date().toLocaleTimeString()}] ✔ Checkout SCM — 2.1s`,
        `[${new Date().toLocaleTimeString()}] Stage [2/7] Install & Lint...`,
      ]);
    }, 1800);

    // Stage 2: Install/Lint
    setTimeout(() => {
      setBuildProgress(40);
      setStages(s => s.map((st, i) => i === 1 ? { ...st, status: 'passed', duration: '14.3s' } : i === 2 ? { ...st, status: 'running' } : st));
      addLog([
        `[${new Date().toLocaleTimeString()}] ✔ Install & Lint — 14.3s (0 warnings)`,
        `[${new Date().toLocaleTimeString()}] Stage [3/7] Unit & Integration Tests...`,
      ]);
    }, 2800);

    // Stage 3: Tests
    setTimeout(() => {
      setBuildProgress(55);
      setStages(s => s.map((st, i) => i === 2 ? { ...st, status: 'passed', duration: '8.7s' } : i === 3 ? { ...st, status: 'running' } : st));
      addLog([
        `[${new Date().toLocaleTimeString()}] ✔ Unit Tests — 42/42 passed, coverage: 87.4%  — 8.7s`,
        `[${new Date().toLocaleTimeString()}] Stage [4/7] Build & Push Docker Image...`,
        `[${new Date().toLocaleTimeString()}] docker build -t registry.devops-ai.io/${selectedJob}:${version} .`,
      ]);
    }, 3800);

    // Stage 4: Docker
    setTimeout(() => {
      setBuildProgress(68);
      setStages(s => s.map((st, i) => i === 3 ? { ...st, status: 'passed', duration: '12.2s' } : i === 4 ? { ...st, status: 'running' } : st));
      addLog([
        `[${new Date().toLocaleTimeString()}] ✔ Docker Build & Push — 12.2s → registry.devops-ai.io/${selectedJob}:${version}`,
        `[${new Date().toLocaleTimeString()}] Stage [5/7] Security Scan (Trivy)...`,
        `[${new Date().toLocaleTimeString()}] trivy image --exit-code 1 --severity HIGH,CRITICAL registry.devops-ai.io/${selectedJob}:${version}`,
      ]);
    }, 4800);

    // Stage 5: Security
    setTimeout(() => {
      setBuildProgress(80);
      setStages(s => s.map((st, i) => i === 4 ? { ...st, status: 'passed', duration: '5.4s' } : i === 5 ? { ...st, status: 'running' } : st));
      addLog([
        `[${new Date().toLocaleTimeString()}] ✔ Trivy Scan — 0 CRITICAL, 0 HIGH vulnerabilities — 5.4s`,
        `[${new Date().toLocaleTimeString()}] Stage [6/7] Deploy to Kubernetes (${selectedEnv})...`,
        `[${new Date().toLocaleTimeString()}] kubectl set image deployment/${selectedJob} ${selectedJob}=registry.devops-ai.io/${selectedJob}:${version} -n ${selectedEnv.toLowerCase()}`,
      ]);
    }, 5800);

    // Stage 6: Deploy
    setTimeout(() => {
      setBuildProgress(92);
      setStages(s => s.map((st, i) => i === 5 ? { ...st, status: 'passed', duration: '6.8s' } : i === 6 ? { ...st, status: 'running' } : st));
      addLog([
        `[${new Date().toLocaleTimeString()}] ✔ Deploy to ${selectedEnv} — rollout: 3/3 pods ready — 6.8s`,
        `[${new Date().toLocaleTimeString()}] Stage [7/7] Notify GitHub & Record to DevOps-AI DB...`,
        `[${new Date().toLocaleTimeString()}] POST github.com/repos/org/repo/statuses/7f3b890 → state: success, context: ci/jenkins`,
      ]);
    }, 6800);

    // Stage 7: Notify + Complete
    setTimeout(() => {
      setBuildProgress(100);
      setIsBuilding(false);
      setStages(s => s.map((st, i) => i === 6 ? { ...st, status: 'passed', duration: '1.2s' } : st));
      addLog([
        `[${new Date().toLocaleTimeString()}] ✔ GitHub Status updated — ci/jenkins: success`,
        `[${new Date().toLocaleTimeString()}] ✔ Recorded build to DevOps-AI DB table 'jenkins_builds' — build_number: 43`,
        `[${new Date().toLocaleTimeString()}] ════════════════════════════════════════════════════`,
        `[${new Date().toLocaleTimeString()}] Finished: SUCCESS — Total duration: 51.7s`,
      ]);

      setBuilds(prev => [{
        id: `jb-${Date.now()}`,
        jobName: selectedJob,
        buildNumber: (prev[0]?.buildNumber ?? 41) + 1,
        branch,
        commitSha: '7f3b890',
        env: selectedEnv,
        status: 'SUCCESS',
        durationMs: 51700,
        triggerCause: `DevOps-AI Manual Trigger (${selectedEnv})`,
        author: 'Dev Lead (Demo)',
        timestamp: 'Just now',
        buildUrl: `http://localhost:8080/job/${selectedJob}/43/`,
        artifacts: [`${selectedJob}-${version}.tar.gz`, 'k8s-deployment.yaml', 'coverage-report.xml'],
      }, ...prev]);

    }, 7800);
  };

  const abortBuild = (id: string) => {
    setBuilds(prev => prev.map(b => b.id === id && b.status !== 'SUCCESS' && b.status !== 'ABORTED'
      ? { ...b, status: 'ABORTED' }
      : b
    ));
  };

  const filteredBuilds = builds.filter(
    b => b.jobName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.commitSha.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors = {
    SUCCESS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    FAILURE: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    BUILDING: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    QUEUED: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    ABORTED: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };

  const stageStatusIcon = (s: PipelineStageItem['status']) => {
    if (s === 'passed') return <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>;
    if (s === 'failed') return <span className="material-symbols-outlined text-red-500 text-sm">cancel</span>;
    if (s === 'running') return <span className="material-symbols-outlined text-amber-400 text-sm animate-spin">progress_activity</span>;
    return <span className="material-symbols-outlined text-slate-400 text-sm">radio_button_unchecked</span>;
  };

  const TABS = [
    { id: 'stages', label: 'Stage Flow', icon: 'account_tree' },
    { id: 'console', label: 'Console Log', icon: 'terminal' },
    { id: 'history', label: `Build History (${builds.length})`, icon: 'history' },
    { id: 'jenkinsfile', label: 'Jenkinsfile', icon: 'description' },
    { id: 'api-demo', label: 'API Demo', icon: 'api' },
    { id: 'faculty-guide', label: 'Faculty Guide', icon: 'school' },
  ] as const;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5 max-w-[1440px] mx-auto">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl shadow-md text-white shrink-0">
            <span className="material-symbols-outlined text-2xl">sync_alt</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Jenkins CI/CD Automation Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                ● Integration Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Continuous Integration, Pipeline-as-Code, & Live Build Execution Telemetry · Connected via REST API to FastAPI Backend
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveTab('faculty-guide')}
            className="px-3.5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-700 dark:hover:bg-slate-200 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-sm">school</span> Faculty Guide
          </button>
          <button onClick={() => onNavigate('database-schema')}
            className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-sm">schema</span> DB ERD
          </button>
        </div>
      </div>

      {/* ── Analytics Bar ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: 'Total Builds', value: totalBuilds, icon: 'build', color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-100 dark:bg-slate-800' },
          { label: 'Success Rate', value: `${successRate}%`, icon: 'check_circle', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Failed Builds', value: failedBuilds, icon: 'cancel', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40' },
          { label: 'Avg Duration', value: `${avgDuration}s`, icon: 'timer', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40' },
          { label: 'Most Active Job', value: mostActiveJob.replace('deploy-', '').replace('build-', ''), icon: 'star', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40' },
        ].map((card, idx) => (
          <div key={idx} className={`${card.bg} rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800/60 flex items-center gap-3`}>
            <span className={`material-symbols-outlined text-xl ${card.color}`}>{card.icon}</span>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{card.label}</p>
              <p className={`text-sm font-extrabold truncate ${card.color}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-5">

        {/* Left: Trigger Panel */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 self-start">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-xl">play_circle</span>
              Trigger Pipeline Job
            </h2>
            <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded uppercase tracking-wide">REST API</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Jenkins Job</label>
              <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 font-medium text-xs focus:ring-2 focus:ring-amber-400">
                <option value="deploy-user-service">deploy-user-service</option>
                <option value="build-auth-microservice">build-auth-microservice</option>
                <option value="deploy-payment-api">deploy-payment-api</option>
                <option value="run-security-scan">run-security-scan</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Environment</label>
                <select value={selectedEnv} onChange={e => setSelectedEnv(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 text-xs">
                  <option value="STG">STG</option>
                  <option value="PROD">PROD</option>
                  <option value="DEV">DEV</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Version</label>
                <input value={version} onChange={e => setVersion(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 font-mono text-xs" />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Git Branch</label>
              <input value={branch} onChange={e => setBranch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 font-mono text-xs" />
            </div>

            <div className="text-[11px] p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg leading-relaxed text-slate-600 dark:text-slate-400">
              <p className="font-bold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">lightbulb</span>Under the hood:
              </p>
              <code className="text-amber-800 dark:text-amber-400">JenkinsClient.trigger_job()</code> acquires CSRF crumb → POSTs to <code className="text-amber-800 dark:text-amber-400">/buildWithParameters</code> → saves to <code className="text-amber-800 dark:text-amber-400">jenkins_builds</code> DB table.
            </div>

            <button onClick={triggerJenkinsBuild} disabled={isBuilding}
              className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${isBuilding
                ? 'bg-slate-400 text-white cursor-not-allowed dark:bg-slate-700'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-200 dark:shadow-none'}`}>
              <span className="material-symbols-outlined text-lg">{isBuilding ? 'motion_photos_on' : 'rocket_launch'}</span>
              {isBuilding ? 'Building Pipeline...' : 'Trigger Jenkins Build Now'}
            </button>
          </div>

          {/* Jenkins server info */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px]">
            {[
              { label: 'Jenkins Server', value: 'http://localhost:8080', icon: 'dns', ok: true },
              { label: 'Authentication', value: 'API Token + CSRF Crumb', icon: 'verified_user', ok: true },
              { label: 'Backend Route', value: 'POST /api/v1/deployments', icon: 'api', ok: true },
              { label: 'DB Model', value: 'JenkinsBuild (jenkins_builds)', icon: 'table_chart', ok: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-sm ${item.ok ? 'text-emerald-500' : 'text-red-400'}`}>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-slate-400 font-medium">{item.label}: </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 truncate">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">

          {/* Tab Bar */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 pt-2 gap-1 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 text-[11px] font-bold border-b-2 whitespace-nowrap rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer ${activeTab === tab.id
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
                {tab.id === 'console' && isBuilding && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping ml-1" />}
              </button>
            ))}
          </div>

          {/* ── TAB: Stage Flow ─────────────────────────────────────────────── */}
          {activeTab === 'stages' && (
            <div className="p-5 flex-1 space-y-5">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visual representation of your <strong className="text-slate-700 dark:text-slate-200">Declarative Jenkinsfile</strong> pipeline. Click "Trigger Jenkins Build Now" to animate each stage in real-time.
              </p>

              {/* Horizontal flow */}
              <div className="flex overflow-x-auto pb-3 gap-2 items-start scrollbar-thin">
                {stages.map((stage, idx) => (
                  <React.Fragment key={idx}>
                    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border min-w-[100px] transition-all ${stage.status === 'running'
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 shadow-md shadow-amber-100 dark:shadow-none scale-105'
                      : stage.status === 'passed'
                        ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20'
                        : stage.status === 'failed'
                          ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'}`}>
                      <div className="flex items-center gap-1.5">
                        {stageStatusIcon(stage.status)}
                        <span className={`material-symbols-outlined text-lg ${stage.status === 'running' ? 'text-amber-500' : stage.status === 'passed' ? 'text-emerald-500' : 'text-slate-400'}`}>{stage.icon}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 text-center leading-tight">{stage.name}</p>
                      {stage.duration && <span className="text-[10px] text-slate-400 font-mono">{stage.duration}</span>}
                      {stage.status === 'running' && <span className="text-[10px] text-amber-600 font-bold animate-pulse">RUNNING</span>}
                    </div>
                    {idx < stages.length - 1 && (
                      <div className="flex items-center self-center">
                        <span className={`material-symbols-outlined text-sm ${stage.status === 'passed' ? 'text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`}>arrow_forward</span>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Stage details table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                      <th className="py-2.5 px-4 text-left">Stage</th>
                      <th className="py-2.5 px-4 text-left">Command / Detail</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4 text-center">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stages.map((stage, idx) => (
                      <tr key={idx} className={`transition-colors ${stage.status === 'running' ? 'bg-amber-50/60 dark:bg-amber-950/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-slate-400">{stage.icon}</span>
                          {stage.name}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[10px] max-w-sm truncate">
                          {stage.detail.replace('{job}', selectedJob).replace('{version}', version).replace('{env}', selectedEnv.toLowerCase())}
                        </td>
                        <td className="py-3 px-4 text-center">{stageStatusIcon(stage.status)}</td>
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">{stage.duration || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB: Console Log ─────────────────────────────────────────────── */}
          {activeTab === 'console' && (
            <div className="flex flex-col flex-1 bg-slate-950 font-mono text-xs min-h-[420px]">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-400 text-[11px] ml-2">jenkins@agent-01 — {selectedJob}</span>
                </div>
                <span className="text-slate-400 text-[11px]">{buildProgress}%</span>
              </div>
              <div className="px-3 pt-2">
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-500" style={{ width: `${buildProgress}%` }} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {currentLogs.length === 0 ? (
                  <p className="text-slate-500 italic">Console ready. Click "Trigger Jenkins Build Now" to stream live pipeline output.</p>
                ) : (
                  currentLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2 leading-relaxed">
                      <span className="text-slate-600 select-none w-5 shrink-0 text-right">{idx + 1}</span>
                      <span className={
                        log.includes('✔') || log.includes('SUCCESS') || log.includes('passed') ? 'text-emerald-400'
                          : log.includes('HTTP 201') || log.includes('HTTP 200') ? 'text-blue-400'
                            : log.includes('FAILURE') || log.includes('ERROR') ? 'text-red-400'
                              : log.includes('Stage') ? 'text-amber-300'
                                : 'text-slate-300'
                      }>{log}</span>
                    </div>
                  ))
                )}
                <div ref={consoleEndRef} />
              </div>
            </div>
          )}

          {/* ── TAB: Build History ───────────────────────────────────────────── */}
          {activeTab === 'history' && (
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <input type="text" placeholder="Search job, SHA, branch, status..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs w-60 dark:text-slate-100" />
                <span className="text-xs text-slate-400">{filteredBuilds.length} executions</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      {['Job & Build', 'Env', 'Branch / SHA', 'Status', 'Duration', 'Triggered', 'Artifacts', 'Actions'].map(h => (
                        <th key={h} className="py-2.5 px-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredBuilds.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{b.jobName}</div>
                          <a href={b.buildUrl} target="_blank" rel="noreferrer"
                            className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-mono">#{b.buildNumber}</a>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.env === 'PROD' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : b.env === 'STG' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                            {b.env}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <div className="text-slate-700 dark:text-slate-200">{b.branch}</div>
                          <div className="text-slate-400">{b.commitSha}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${statusColors[b.status] || ''}`}>{b.status}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono">{(b.durationMs / 1000).toFixed(1)}s</td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          <div>{b.author}</div>
                          <div className="text-[10px] text-slate-400">{b.timestamp}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {b.artifacts.map((a, i) => (
                              <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700">
                                {a}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1">
                            {b.status === 'BUILDING' && (
                              <button onClick={() => abortBuild(b.id)}
                                className="px-2 py-1 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 rounded text-[10px] font-bold hover:bg-red-200 dark:hover:bg-red-900 cursor-pointer flex items-center gap-0.5 transition-colors">
                                <span className="material-symbols-outlined text-xs">stop</span> Abort
                              </button>
                            )}
                            {(b.status === 'SUCCESS' || b.status === 'FAILURE') && (
                              <button onClick={() => { setSelectedJob(b.jobName); setSelectedEnv(b.env); setBranch(b.branch); }}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-0.5 transition-colors">
                                <span className="material-symbols-outlined text-xs">replay</span> Re-run
                              </button>
                            )}
                            {b.status === 'ABORTED' && (
                              <span className="text-[10px] text-slate-400 italic px-1">Aborted</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB: Jenkinsfile ─────────────────────────────────────────────── */}
          {activeTab === 'jenkinsfile' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-slate-400 font-mono text-xs">Jenkinsfile  ·  Declarative Pipeline  ·  {selectedJob}</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 bg-amber-900/50 text-amber-300 rounded font-bold border border-amber-800/60">Pipeline-as-Code</span>
              </div>

              {/* Legend */}
              <div className="px-5 py-2.5 bg-slate-900/70 border-b border-slate-800 flex flex-wrap gap-4 text-[10px]">
                {[
                  { color: 'text-blue-400', label: 'Keywords (pipeline, stage, steps)' },
                  { color: 'text-amber-300', label: 'Stage names' },
                  { color: 'text-emerald-400', label: 'Shell commands (sh, curl, kubectl)' },
                  { color: 'text-purple-400', label: 'Environment / parameters' },
                  { color: 'text-slate-500', label: 'Comments' },
                ].map((l, i) => (
                  <span key={i} className={`font-bold ${l.color}`}>■ <span className="text-slate-400 font-normal">{l.label}</span></span>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-950">
                <pre className="p-5 text-[11px] font-mono leading-relaxed overflow-x-auto">
                  {JENKINSFILE_TEXT.split('\n').map((line, idx) => {
                    const trimmed = line.trim();
                    const isComment = trimmed.startsWith('//') || trimmed.startsWith('#');
                    const isStageDecl = trimmed.startsWith("stage(");
                    const isKeyword = ['pipeline', 'agent', 'environment', 'parameters', 'stages', 'steps', 'post', 'always', 'failure', 'script'].some(k => trimmed.startsWith(k));
                    const isShellCmd = trimmed.startsWith('sh ') || trimmed.startsWith('sh"""') || trimmed.startsWith('sh\'') || trimmed.startsWith('curl') || trimmed.startsWith('kubectl') || trimmed.startsWith('docker') || trimmed.startsWith('trivy');
                    const isEnvOrParam = trimmed.includes('=') && (line.includes('REGISTRY') || line.includes('IMAGE_NAME') || line.includes('K8S_NS') || line.includes('VERSION') || line.includes('ENVIRONMENT'));

                    return (
                      <div key={idx} className="flex group hover:bg-slate-900/60">
                        <span className="w-8 text-right text-slate-700 mr-4 select-none shrink-0">{idx + 1}</span>
                        <span className={
                          isComment ? 'text-slate-600' :
                            isStageDecl ? 'text-amber-300 font-bold' :
                              isKeyword ? 'text-blue-400 font-semibold' :
                                isShellCmd ? 'text-emerald-400' :
                                  isEnvOrParam ? 'text-purple-400' :
                                    'text-slate-300'
                        }>{line}</span>
                      </div>
                    );
                  })}
                </pre>
              </div>
            </div>
          )}

          {/* ── TAB: API Demo ────────────────────────────────────────────────── */}
          {activeTab === 'api-demo' && (
            <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                <h3 className="font-bold text-blue-900 dark:text-blue-200 text-sm flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-base">api</span>
                  Jenkins REST API — Backend Integration Endpoints
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  This shows all the REST API calls your DevOps-AI backend makes to Jenkins, and the DevOps-AI API endpoints that faculty can test directly.
                </p>
              </div>

              {/* Endpoint reference cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { method: 'POST', path: '/api/v1/deployments', desc: 'Trigger a Jenkins build via DevOps-AI', auth: 'ADMIN / DEVOPS_ENGINEER', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
                  { method: 'GET', path: '/api/v1/jenkins-builds', desc: 'List all Jenkins build records from DB', auth: 'Any authenticated user', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
                  { method: 'GET', path: '/api/v1/deployments/{id}', desc: 'Get deployment with linked Jenkins build', auth: 'Any authenticated user', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
                  { method: 'PATCH', path: '/api/v1/deployments/{id}', desc: 'Update build status (ABORTED, SUCCESS)', auth: 'ADMIN / DEVOPS_ENGINEER', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
                ].map((ep, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${ep.color}`}>{ep.method}</span>
                      <code className="text-slate-800 dark:text-slate-200 font-mono font-bold">{ep.path}</code>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{ep.desc}</p>
                    <p className="text-slate-400"><span className="font-bold">Auth:</span> {ep.auth}</p>
                  </div>
                ))}
              </div>

              {/* curl demo */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                  <span className="material-symbols-outlined text-amber-400 text-sm">terminal</span>
                  <span className="text-slate-400 text-[11px] font-mono">curl demo — Jenkins integration API calls</span>
                </div>
                <div className="p-4 space-y-1.5 font-mono text-[11px] overflow-x-auto">
                  {API_CURL_LINES.map((line, idx) => (
                    <div key={idx}>
                      {line.comment !== undefined && line.comment !== '' && (
                        <div className="text-slate-500">{line.comment}</div>
                      )}
                      {line.cmd && (
                        <div className={line.cmd.startsWith('#') ? 'text-slate-500' : 'text-emerald-400'}>{line.cmd}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Jenkins internal API */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                  <span className="material-symbols-outlined text-amber-400 text-sm">cloud</span>
                  <span className="text-slate-400 text-[11px] font-mono">Jenkins Internal REST API calls (from backend/app/integrations/jenkins.py)</span>
                </div>
                <div className="p-4 space-y-3 font-mono text-[11px]">
                  {[
                    { method: 'GET', path: '/crumbIssuer/api/json', desc: 'Obtain CSRF protection crumb before any write action', color: 'text-blue-400' },
                    { method: 'POST', path: '/job/{name}/buildWithParameters', desc: 'Trigger parameterized pipeline build', color: 'text-green-400' },
                    { method: 'GET', path: '/job/{name}/{build_number}/api/json', desc: 'Poll real-time build status & duration', color: 'text-blue-400' },
                    { method: 'POST', path: '/job/{name}/{build_number}/stop', desc: 'Abort a running build', color: 'text-red-400' },
                  ].map((ep, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className={`shrink-0 font-bold ${ep.color}`}>{ep.method}</span>
                      <div>
                        <div className="text-slate-300">{ep.path}</div>
                        <div className="text-slate-500 mt-0.5"># {ep.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Faculty Guide ───────────────────────────────────────────── */}
          {activeTab === 'faculty-guide' && (
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
                <h3 className="font-extrabold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined">stars</span>
                  Faculty Presentation Cheat Sheet — Jenkins in DevOps-AI
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Use this structured guide when presenting to your faculty. Present the tabs in this order for maximum impact:
                  <strong className="text-amber-700 dark:text-amber-400"> Stage Flow → Trigger Build → Console Log → Build History → Jenkinsfile → API Demo</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    num: '01', icon: 'api', color: 'text-amber-500', title: 'REST API Integration (JenkinsClient)',
                    body: 'DevOps-AI connects to Jenkins via httpx async REST calls. Before triggering, it fetches a CSRF crumb from /crumbIssuer/api/json, then POSTs build parameters to /job/{name}/buildWithParameters using API Token auth.',
                    file: 'backend/app/integrations/jenkins.py'
                  },
                  {
                    num: '02', icon: 'database', color: 'text-indigo-500', title: 'PostgreSQL Audit Table (jenkins_builds)',
                    body: 'Every build writes job_name, build_number, status, duration_ms, commit_sha, artifact_paths to the jenkins_builds table. It has foreign keys to users, repositories, and deployments — forming a complete audit trail.',
                    file: 'backend/app/models/jenkins_build.py'
                  },
                  {
                    num: '03', icon: 'description', color: 'text-blue-500', title: 'Pipeline-as-Code (Jenkinsfile)',
                    body: 'The Declarative Jenkinsfile defines all 7 pipeline stages: Checkout SCM, Install & Lint, Unit Tests, Docker Build & Push, Trivy Security Scan, K8s Deploy, and GitHub Status Notify. Each stage is observable in the Stage Flow tab.',
                    file: 'Jenkinsfile (Pipeline-as-Code tab)'
                  },
                  {
                    num: '04', icon: 'rocket_launch', color: 'text-emerald-500', title: 'Deployment Service Orchestration',
                    body: 'When a user triggers a deployment in DevOps-AI, DeploymentService.create_deployment() instantiates JenkinsClient, calls trigger_job() with VERSION/ENVIRONMENT/COMMIT_HASH params, then saves the returned build URL to logs_url in the database.',
                    file: 'backend/app/services/deployment.py'
                  },
                  {
                    num: '05', icon: 'code', color: 'text-purple-500', title: 'GitHub Status Check Sync',
                    body: 'After every build, Jenkins calls the GitHub API with context: "ci/jenkins" and state: "success" or "failure". This is replicated in backend/app/integrations/github.py which syncs CI check statuses back to the PR commit.',
                    file: 'backend/app/integrations/github.py'
                  },
                  {
                    num: '06', icon: 'security', color: 'text-red-500', title: 'Role-Based Access Control (RBAC)',
                    body: 'Only ADMIN and DEVOPS_ENGINEER roles can trigger builds. VIEWER role gets a permission denied toast. This is enforced at the FastAPI endpoint level via require_devops_or_admin dependency.',
                    file: 'backend/app/auth/rbac.py + App.tsx'
                  },
                ].map(card => (
                  <div key={card.num} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-slate-400">#{card.num}</span>
                      <span className={`material-symbols-outlined text-sm ${card.color}`}>{card.icon}</span>
                      <h4 className="font-bold text-slate-800 dark:text-white text-[11px]">{card.title}</h4>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{card.body}</p>
                    <code className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">{card.file}</code>
                  </div>
                ))}
              </div>

              {/* Python code snippet */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400 text-sm">code</span>
                  <span className="text-slate-400 text-[11px] font-mono">backend/app/integrations/jenkins.py — JenkinsClient.trigger_job()</span>
                </div>
                <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`async def trigger_job(self, job_name: str, parameters: Optional[Dict] = None):
    logger.info("jenkins_job_trigger_initiated", job_name=job_name)

    # Step 1: Get CSRF Crumb (security requirement for Jenkins write operations)
    crumb_res = await client.get(f"{self.base_url}/crumbIssuer/api/json", auth=self.auth)
    crumb_data = crumb_res.json()  # {"crumbRequestField": "Jenkins-Crumb", "crumb": "abc..."}
    headers = {crumb_data["crumbRequestField"]: crumb_data["crumb"]}

    # Step 2: POST to Jenkins /buildWithParameters with deployment payload
    endpoint = f"{self.base_url}/job/{job_name}/buildWithParameters"
    response = await client.post(endpoint, auth=self.auth, headers=headers, params=parameters)

    # Step 3: Jenkins returns 201 + Location header pointing to queued build
    location = response.headers.get("Location", "")
    return {"status": "QUEUED", "job_name": job_name, "location": location}`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
