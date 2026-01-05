# Bot Detection Proxy (Cloudflare‑Inspired)

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
