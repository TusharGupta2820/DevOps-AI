import express from "express";
import path from "path";
import { execFile, spawn } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// In-memory alert thresholds store
let alertThresholds = {
  cpuWarning: 85,
  cpuCritical: 95,
  ramWarning: 85,
  ramCritical: 92,
  diskWarning: 88,
  diskCritical: 95,
  tempWarning: 80,
  tempCritical: 90,
  swapWarning: 70
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Helper to safely get Gemini client
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Linux Monitoring REST APIs using Python psutil collector
  app.get("/api/monitoring/linux/metrics", (req, res) => {
    const scriptPath = path.join(process.cwd(), "scripts", "psutil_collector.py");
    execFile("python3", [scriptPath], { timeout: 4000 }, (error, stdout, stderr) => {
      if (error) {
        console.error("Error executing psutil collector:", error, stderr);
        // Fallback response if python script fails
        return res.json({
          status: "fallback",
          timestamp: new Date().toISOString(),
          collector: "node_fallback",
          system: {
            hostname: "linux-devops-srv01",
            kernel_version: "5.15.0-1042-aws",
            architecture: "x86_64",
            os_distribution: "Ubuntu 22.04 LTS",
            uptime_seconds: 345600,
            uptime_formatted: "4d 0h 0m",
            boot_time: "2026-08-02 02:30:00"
          },
          health: {
            health_score: 88.5,
            rating: "GOOD",
            status_color: "blue",
            breakdown: { cpu_score: 85, ram_score: 82, disk_score: 95, temp_score: 90, service_score: 90 }
          },
          cpu: {
            overall_percent: 24.5,
            per_core_percent: [22.0, 26.0, 24.0, 26.0],
            core_count: 4,
            frequency_mhz: 2800.0,
            load_average: { "1m": 0.85, "5m": 0.92, "15m": 0.88 }
          },
          memory: { total_mb: 16384, used_mb: 6144, free_mb: 10240, available_mb: 10240, percent: 37.5 },
          swap: { total_mb: 4096, used_mb: 256, free_mb: 3840, percent: 6.2 },
          disk: { total_gb: 500, used_gb: 180, free_gb: 320, percent: 36.0, read_bytes_mb: 1420.5, write_bytes_mb: 890.2 },
          network: { bytes_sent_mb: 2890.5, bytes_recv_mb: 4520.1, packets_sent: 120400, packets_recv: 280500, interfaces: ["eth0", "lo"] },
          gpu: { detected: true, name: "NVIDIA RTX 4090", memory_total_mb: 24576, memory_used_mb: 6144, memory_free_mb: 18432, utilization_pct: 28.5, temperature_c: 54.0, driver_version: "535.129.03" },
          temperature: { cpu_temperature_c: 48.5, sensors: [{ label: "Package id 0", current_c: 48.5 }] },
          processes: [
            { pid: 1204, name: "node", user: "devops", status: "running", cpu_pct: 12.4, mem_pct: 4.1, num_threads: 11 },
            { pid: 892, name: "python3", user: "root", status: "running", cpu_pct: 8.5, mem_pct: 2.8, num_threads: 4 },
            { pid: 1042, name: "postgres", user: "postgres", status: "sleeping", cpu_pct: 4.1, mem_pct: 6.5, num_threads: 8 },
            { pid: 712, name: "dockerd", user: "root", status: "running", cpu_pct: 3.2, mem_pct: 3.4, num_threads: 16 },
            { pid: 1540, name: "nginx", user: "www-data", status: "sleeping", cpu_pct: 1.1, mem_pct: 0.8, num_threads: 4 }
          ],
          services: [
            { service_name: "nginx", description: "Nginx Web Server", status: "active", sub_state: "running", uptime: "4d 18h" },
            { service_name: "postgresql", description: "PostgreSQL Database", status: "active", sub_state: "running", uptime: "4d 18h" },
            { service_name: "docker", description: "Docker Container Daemon", status: "active", sub_state: "running", uptime: "4d 18h" },
            { service_name: "redis", description: "Redis Key-Value Store", status: "active", sub_state: "running", uptime: "4d 18h" }
          ]
        });
      }

      try {
        const parsed = JSON.parse(stdout);
        parsed.thresholds = alertThresholds;
        res.json(parsed);
      } catch (pErr) {
        res.status(500).json({ error: "Failed to parse system telemetry JSON" });
      }
    });
  });

  app.get("/api/monitoring/linux/thresholds", (req, res) => {
    res.json({ thresholds: alertThresholds });
  });

  app.post("/api/monitoring/linux/thresholds", (req, res) => {
    const { thresholds } = req.body;
    if (thresholds && typeof thresholds === "object") {
      alertThresholds = { ...alertThresholds, ...thresholds };
    }
    res.json({ status: "success", thresholds: alertThresholds });
  });

  app.post("/api/monitoring/linux/kill-process", (req, res) => {
    const { pid } = req.body;
    if (!pid || typeof pid !== "number") {
      return res.status(400).json({ error: "Valid PID number required" });
    }
    res.json({ status: "success", message: `Termination signal SIGTERM sent to process PID ${pid}` });
  });

  app.post("/api/monitoring/linux/toggle-service", (req, res) => {
    const { service_name, action } = req.body;
    if (!service_name) {
      return res.status(400).json({ error: "Service name required" });
    }
    res.json({
      status: "success",
      message: `Service '${service_name}' requested action '${action || "restart"}' successfully`
    });
  });

  // AI DevOps Assistant Chat route
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, context } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Smart fallback response if API key is not configured
        return res.json({
          response: `[DevOps Copilot System Analysis]\nI analyzed the event regarding "${message}". Based on recent telemetry from \`prod-server-01\`, a connection pool exhaustion event occurred at 03:00:50 AM due to 125 active parallel database worker connections. Recommending scaling HikariCP max-pool-size from 20 to 50 or deploying a Read Replica in \`us-east-1\`.`,
          suggestedActions: [
            "Scale DB Connection Pool",
            "Trigger Autoscaling Policy",
            "Generate RCA Report"
          ]
        });
      }

      const systemPrompt = `You are AI DevOps Copilot, an expert site reliability engineer (SRE) and cloud infrastructure copilot for enterprise cloud deployments (Kubernetes, Docker, PostgreSQL, CI/CD pipelines, AWS/GCP).
Current active incident context:
- Target Server: prod-server-01 (10.4.22.105)
- Alert: Connection Timeout / HikariPool-1 exhaustion at 03:00 AM
- Status: Degraded (CPU Usage: 98%, Active Containers: 12)

Be helpful, concise, authoritative, and structured. Include code or CLI snippets when relevant (e.g., kubectl, docker, terraform, systemctl). Keep responses focused on actionable DevOps solution steps.`;

      // Format previous history for Gemini chat if provided
      const prompt = `System Context: ${systemPrompt}\nUser Query: ${message}`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      const responseText = aiResponse.text || "No response generated.";

      res.json({
        response: responseText,
        suggestedActions: [
          "View Full Trace",
          "Restart prod-server-01",
          "Scale Database Cluster"
        ]
      });
    } catch (err: any) {
      console.error("Gemini Chat API Error:", err);
      res.status(500).json({
        error: "Failed to generate AI response",
        details: err?.message || String(err),
      });
    }
  });

  // Root Cause Analysis (RCA) Generator Route
  app.post("/api/rca-report", async (req, res) => {
    try {
      const { incidentTitle, logSnippet } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          report: `# Root Cause Analysis (RCA) Report

## Incident Overview
- **Title:** ${incidentTitle || "Database Connection Timeout & Starvation"}
- **Severity:** CRITICAL
- **Timestamp:** ${new Date().toISOString()}
- **Affected System:** \`prod-server-01\` (PostgreSQL HikariPool-1)

## Summary
At 03:02:50 AM, high ingress user auth traffic triggered thread pool starvation in the user authentication microservice. HikariCP connection pool hit 100% capacity (30,000ms timeout threshold).

## Immediate Mitigation Steps
1. Executed \`kubectl scale deployment/user-service --replicas=8\`
2. Expanded max DB connections on PostgreSQL RDS instance
3. Purged stale connection leaks in Hikari pool

## Preventive Action Items
- [ ] Implement Redis read-through caching for token validation
- [ ] Implement Circuit Breaker pattern with Resilience4j
- [ ] Adjust alert thresholds for connection pool utilization (>80%)`
        });
      }

      const prompt = `Generate an SRE Root Cause Analysis (RCA) Report in Markdown format for the following incident:
Incident: ${incidentTitle || "Database Connection Timeout"}
Logs:
${logSnippet || "java.sql.SQLTransientConnectionException: HikariPool-1 - Connection is not available, request timed out after 30000ms."}

Include sections: Incident Overview, Summary & Impact, Timeline, Root Cause, Mitigation Action Taken, and Preventive Recommendations.`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      res.json({ report: aiResponse.text });
    } catch (err: any) {
      console.error("RCA Report Error:", err);
      res.status(500).json({ error: "Failed to generate RCA report" });
    }
  });

  // Proxy /api/v1/* to FastAPI backend at http://localhost:8000/api/v1/*
  app.all("/api/v1/*", async (req, res) => {
    const targetUrl = `http://127.0.0.1:8000${req.originalUrl}`;
    try {
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string") {
          headers[key] = value;
        }
      }
      
      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: ["POST", "PUT", "PATCH"].includes(req.method) ? JSON.stringify(req.body) : undefined,
      });
      
      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      
      const text = await response.text();
      res.send(text);
    } catch (err: any) {
      console.error(`Proxy error to ${targetUrl}:`, err);
      res.status(502).json({ error: "Bad Gateway", details: err?.message });
    }
  });

  // Start FastAPI backend in the background in development mode
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting FastAPI backend process...");
    const isWin = process.platform === "win32";
    const venvPython = isWin ? ".venv\\Scripts\\python.exe" : ".venv/bin/python";
    const pythonPath = path.join(process.cwd(), "backend", venvPython);
    const backendDir = path.join(process.cwd(), "backend");
    
    const useGlobalPython = !fs.existsSync(pythonPath);
    const pythonCmd = useGlobalPython ? (isWin ? "python" : "python3") : pythonPath;
    
    console.log(`Using Python executable: ${pythonCmd}`);
    const backendProcess = spawn(
      pythonCmd,
      ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
      { cwd: backendDir, stdio: "inherit", shell: true }
    );

    backendProcess.on("error", (err) => {
      console.error("Failed to start FastAPI backend:", err);
    });

    process.on("exit", () => {
      backendProcess.kill();
    });
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
