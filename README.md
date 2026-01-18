# Bot Detection Proxy (Cloudflare‑Inspired)

# TODO LIST:
-Finished ML portion
-Tie everything up #3
-Auto-Decay #4
-Dashboard #2
-UI #1
## Overview

This project is a **Cloudflare‑inspired bot detection system** built with **Node.js and Express**. It behaves like a **lightweight Web Application Firewall (WAF)** sitting in front of an origin server.

Instead of directly serving content, this service:

1. Receives incoming HTTP requests
2. Extracts behavioral features (rate, burstiness, path diversity)
3. Makes a **real‑time decision** (ALLOW / CHALLENGE / BLOCK)
4. Forwards allowed traffic to an **origin server** via an HTTP proxy

This mirrors how real edge security systems (Cloudflare, Fastly, Akamai) work at a high level.

---

## High‑Level Architecture

```
Client
  ↓
Bot Detection API (Express)
  ├─ Event ingestion
  ├─ Feature extraction
  ├─ Decision engine (rules)
  └─ Proxy enforcement
  ↓
Origin Server (simulated backend)
```

---

## What Problem This Solves

Modern web services must defend against:

* Credential‑stuffing bots
* Web scrapers
* API abuse
* Crawlers masquerading as humans

This project demonstrates how **behavioral analysis** (not CAPTCHAs or signatures) can detect suspicious traffic.

---

## Directory Structure

```
bot-detection-api/
├── src/
│   ├── server.js          # App entrypoint
│   ├── app.js             # Express app wiring
│   ├── detection.js       # Feature extraction + decision logic
│   ├── routes/
│   │   ├── event.js       # Event ingestion + stats API
│   │   └── proxy.js       # Enforcement proxy
│
├── origin-server.js       # Simulated backend server
├── package.json
└── README.md
```

---

## Core Components Explained

### 1️⃣ server.js (Entrypoint)

* Reads environment variables
* Creates the Express app
* Starts the HTTP server

This clean separation allows production‑style deployments and testing.

---

### 2️⃣ app.js (Application Wiring)

Responsibilities:

* Create Express instance
* Register global middleware (JSON parsing)
* Mount route modules:

  * `/v1/event`
  * `/proxy`
* Central error handling

This mirrors how real backend services structure routing and concerns.

---

### 3️⃣ event.js (Event Ingestion & Metrics)

This route **records request behavior**.

#### POST `/v1/event`

Stores:

* IP address
* Request path
* HTTP method
* Headers (User‑Agent, Accept‑Language)
* Timestamp

Events are stored **in‑memory per IP**, with a fixed cap to prevent memory abuse.

#### GET `/v1/event/stats`

Returns:

* Requests in last 10s
* Requests in last 60s
* Requests per minute
* Unique paths accessed

This forms the **feature extraction layer**.

---

### 4️⃣ detection.js (Decision Engine)

This file represents the **security brain** of the system.

#### Feature Engineering

* `count_10s`: burst detection
* `rpm`: sustained traffic
* `unique_paths_60s`: crawler/scanner behavior

#### Rule‑Based Scoring

Each signal contributes to a suspicion score.

| Score | Action    |
| ----- | --------- |
| < 30  | ALLOW     |
| 30–79 | CHALLENGE |
| ≥ 80  | BLOCK     |

This design mirrors **fast‑path security decisions** used at the edge.

---

### 5️⃣ proxy.js (Enforcement Layer)

This is the most important piece.

The proxy:

1. Intercepts requests before reaching the origin
2. Logs behavior as events
3. Computes features
4. Applies decision logic
5. Either:

   * Forwards request to origin
   * Returns CHALLENGE response
   * Returns BLOCK response

Uses `http-proxy-middleware` to forward traffic when allowed.

This is how Cloudflare actually enforces decisions.

---

### 6️⃣ origin-server.js (Simulated Backend)

A simple Express server acting as the protected service.

It exists to prove:

* Allowed traffic reaches the backend
* Blocked traffic never does

---

## How to Run

### Start origin server

```
node origin-server.js
```

### Start bot detection service

```
npm run dev
```

---

## How to Test

### Normal request

```
curl http://localhost:3000/proxy/login
```

### Burst traffic (bot‑like)

```
for i in {1..50}; do curl -s http://localhost:3000/proxy/login > /dev/null; done
```

### Observe decisions

* ALLOW → forwarded to origin
* CHALLENGE → 401 response
* BLOCK → 403 response

---

## What You Have Built (Resume‑Level Summary)

You built a:

* **Behavior‑based bot detection system**
* **Edge‑style proxy with enforcement**
* **Rule‑based decision engine**
* **Low‑latency request pipeline**

This is not a CRUD API — it is **infrastructure software**.

---

## Skills Demonstrated

### Backend Engineering

* Express routing
* Middleware pipelines
* Error handling
* API design

### Systems Thinking

* Fast path vs slow path
* Bounded memory
* Rate limiting concepts
* Fail‑open vs fail‑closed decisions

### Security Engineering

* Behavioral bot detection
* IP‑based tracking
* Avoiding false positives
* Adversarial traffic modeling

### Distributed Systems Concepts

* Reverse proxying
* Edge enforcement
* Request interception

---

## Resume Gap Coverage

| Gap                   | Covered |
| --------------------- | ------- |
| Backend depth         | ✅       |
| Security              | ✅       |
| Performance awareness | ✅       |
| Infra‑style systems   | ✅       |
| Applied ML readiness  | ✅       |

---

## Why This Is FAANG‑Relevant

This project mirrors how:

* Cloudflare WAF
* Google Cloud Armor
* AWS Shield

actually work internally — **rules first, ML later**.

You can now credibly discuss:

* Tradeoffs in bot detection
* Why ML is not on the hot path
* Latency budgets
* False positives

---

## Next Improvements (Optional)

* Redis instead of in‑memory Map
* Sliding window counters
* ML classifier for low‑and‑slow bots
* CAPTCHA challenge integration
* Metrics (Prometheus)

---

## Final Takeaway

You didn’t build a toy API.

You built a **security edge system**.

That’s exactly what top‑tier backend and infra teams look for.


🚀 The Evolution: Static Rules → Behavioral MLWe have transitioned from simple "if/else" rate limiting to a Predictive Inference Pipeline.The Problem: Sophisticated bots mimic humans by browsing "low and slow" to stay under traditional rate limits.The Solution: A Random Forest / Logistic Regression classifier that looks for "robotic" patterns in timing, path diversity, and header fingerprints.🏗️ High-Level ArchitecturePlaintextClient Request → [ Sentinel Proxy (Node.js) ]
                        ↓
             [ 1. Ingestion ] → Save to Access Logs / Redis
                        ↓
             [ 2. Feature Extraction ] → 31 Behavioral Data Points
                        ↓
             [ 3. Inference ] → Python ML Service / ONNX Bridge
                        ↓
             [ 4. Enforcement ] → ALLOW / CHALLENGE / BLOCK
📁 Updated Directory StructurePlaintextbot-detection-api/
├── data/                  # NEW: ML Training & Testing Data
│   ├── humans/            # Known human access logs
│   ├── bots/              # Known bot access logs
│   └── master_dataset.csv # Final labeled dataset for training
├── notebooks/             # NEW: Research & Development
│   └── analysis.ipynb     # Feature extraction & model assessment
├── src/
│   ├── classifier.js      # NEW: ML Model Bridge (Node-to-Python)
│   ├── featureMapper.js   # NEW: Real-time feature calculation
│   ├── detection.js       # Hybrid Decision Engine (Rules + ML)
│   └── proxy.js           # Enforcement proxy
└── origin-server.js       # Simulated backend
🧠 ML Feature Engineering GuideOur classifier doesn't just look at IP addresses; it analyzes 31 distinct signals categorized into behavioral groups:A. Timing & Cadence (Key for "Low & Slow" detection)Request Interval Variance: Humans are erratic; bots are perfectly rhythmic. Low variance = Bot.Burst Count: Number of requests sent in a single 1-second cluster.Min Request Interval: Detects sub-second automated clicking.B. Navigation EntropyRepeating Path Ratio: % of requests to the same URL. Bots often scrape one endpoint repeatedly.Path Depth Avg: Humans stay shallow; crawlers go deep into directory structures.Admin Recon: Binary check for attempts on /admin, /wp-admin, or /api/v1/config.C. Browser FingerprintingUA Headless Check: Detects "HeadlessChrome" or "Puppeteer" signatures.UA Length: Short or generic User-Agent strings are high-risk indicators.OS/Method Encoding: Mismatches between OS types and expected browsing behavior.🚦 How to Test the ML Pipeline1. Training (The Notebook)Open notebooks/analysis.ipynb to:Load the 186-row labeled dataset.Run Feature Extraction across the 31 available metrics.Train the RandomForest model and evaluate Accuracy, Precision, and Recall.Save the trained model as bot_model.joblib.2. Real-Time DetectionOnce the model is loaded into the proxy:Bash# Test robotic behavior (ML Trigger)
# This waits 1.5s between requests to stay under rate limits
for i in {1..10}; do 
  curl -H "x-api-key: your_key" http://localhost:3000/proxy/item-$i
  sleep 1.5
done
Observation: Even though you are below the RPM limit, the ML Logic will detect the perfectly consistent timing and linear path traversal, resulting in a 403 Forbidden.📈 Model Performance GoalsDataset SizeExpected AccuracyDetection TypeCurrent (186 rows)65-85%Clear signals (Headless/High RPM)Target (1000+ rows)90-98%Subtle "Low & Slow" behavioral shifts
