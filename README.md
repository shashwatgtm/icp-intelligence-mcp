# ICP Intelligence MCP v1.0.0

**Deep ICP Analysis with Pattern Detection** - 9 tools for ideal customer profiling, market sizing, buyer mapping, and account prioritization.

[![NPM Version](https://img.shields.io/npm/v/@shashwatgtmalpha/icp-intelligence-mcp)](https://www.npmjs.com/package/@shashwatgtmalpha/icp-intelligence-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)

## 🚀 Quick Start

```bash
# Run directly with npx
npx -y @shashwatgtmalpha/icp-intelligence-mcp
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "icp-intelligence-mcp": {
      "command": "npx",
      "args": ["-y", "@shashwatgtmalpha/icp-intelligence-mcp"]
    }
  }
}
```

---

## 🛠️ Tools Overview

| Tool | Purpose | Primary Output |
|------|---------|----------------|
| `icp_deep_dive` | Pattern detection from customer data | ICP profile with attributes |
| `icp_scoring_model` | Auto-weighted qualification scorecards | Lead/account scoring model |
| `icp_gap_analysis` | Current vs ideal customer comparison | Metric gaps & recommendations |
| `icp_evolution_tracker` | Dynamic ICP monitoring | Win/loss pattern trends |
| `icp_interview_synthesizer` | Extract patterns from interviews | Voice of customer insights |
| `buyer_group_analyzer` | Decision dynamics mapping | Buying committee profiles |
| `tam_sam_som_calculator` | Bottom-up market sizing | Market size with deal targets |
| `lookalike_signal_generator` | Platform-specific targeting | Ad platform targeting criteria |
| `account_prioritization` | Multi-dimensional ranking | Prioritized account tiers |

---

## 👤 Who Is This For?

### Primary Users

| Role | Key Tools | Use Cases |
|------|-----------|-----------|
| **Founders/CEOs** | `tam_sam_som_calculator`, `icp_deep_dive` | Market sizing, customer definition |
| **CMOs/VPs Marketing** | `icp_gap_analysis`, `icp_evolution_tracker` | ICP health monitoring |
| **Product Marketing** | `buyer_group_analyzer`, `icp_interview_synthesizer` | Buying committee, VOC |
| **Demand Gen** | `lookalike_signal_generator`, `account_prioritization` | Targeting, ABM |
| **Sales Ops/RevOps** | `icp_scoring_model`, `account_prioritization` | Lead scoring, account tiering |
| **SDRs/BDRs** | `account_prioritization`, `icp_scoring_model` | Account qualification |

### Job-to-Tool Mapping

| Job To Be Done | Recommended Tool |
|----------------|------------------|
| "I need to define our ideal customer profile" | `icp_deep_dive` |
| "I need to create a lead scoring model" | `icp_scoring_model` |
| "I need to compare our actual vs ideal customers" | `icp_gap_analysis` |
| "I need to track how our ICP is changing" | `icp_evolution_tracker` |
| "I need to synthesize customer interview insights" | `icp_interview_synthesizer` |
| "I need to map the buying committee" | `buyer_group_analyzer` |
| "I need to calculate our TAM/SAM/SOM" | `tam_sam_som_calculator` |
| "I need targeting criteria for ad platforms" | `lookalike_signal_generator` |
| "I need to prioritize our target accounts" | `account_prioritization` |

### Recommended Agent Skills

This MCP is included in these user-focused Agent bundles:

| Agent Bundle | Tools Count | Best For |
|--------------|-------------|----------|
| **🎯 Founder GTM Copilot** | 10 tools | Founders, early-stage CEOs |
| **📞 SDR Toolkit** | 8 tools | SDRs, BDRs |
| **🎯 Product Marketing Engine** | 12 tools | PMMs |
| **📊 Demand Gen & Ops** | 10 tools | Demand gen, marketing ops |
| **💼 Account Executive Deal Desk** | 12 tools | AEs, account managers |

---

## 📖 Tool Details

### 1. ICP Deep Dive (`icp_deep_dive`)

Detect patterns from customer data to define ICP attributes.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `customer_data` | ✅ | Description of current customers |
| `best_customers` | ❌ | Characteristics of top customers |
| `industry_focus` | ❌ | Industry context |

**Output:** ICP profile with firmographics, technographics, behavioral signals, and champion characteristics.

### 2. ICP Scoring Model (`icp_scoring_model`)

Generate auto-weighted qualification scorecards.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `icp_attributes` | ✅ | Key ICP characteristics |
| `deal_data` | ❌ | Win/loss data for weighting |
| `scoring_type` | ❌ | lead, account, opportunity |

**Output:** Weighted scorecard with tiers, thresholds, and implementation guidance.

### 3. ICP Gap Analysis (`icp_gap_analysis`)

Compare current customers to ideal profile.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `current_customers` | ✅ | Current customer characteristics |
| `ideal_icp` | ✅ | Target ICP definition |
| `key_metrics` | ❌ | Metrics to compare (ACV, retention, etc.) |

**Output:** Gap matrix, metric comparison, recommendations for ICP refinement.

### 4. ICP Evolution Tracker (`icp_evolution_tracker`)

Monitor ICP changes over time.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `historical_data` | ✅ | Past customer/deal data |
| `time_period` | ❌ | Analysis timeframe |
| `win_loss_patterns` | ❌ | Recent win/loss trends |

**Output:** ICP drift analysis, emerging segments, recommended adjustments.

### 5. ICP Interview Synthesizer (`icp_interview_synthesizer`)

Extract patterns from customer interviews.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `interview_notes` | ✅ | Interview transcripts or notes |
| `interview_type` | ❌ | discovery, win, loss, churn |
| `focus_areas` | ❌ | Specific areas to analyze |

**Output:** Pattern themes, quotes, ICP refinement recommendations.

### 6. Buyer Group Analyzer (`buyer_group_analyzer`)

Map buying committee decision dynamics.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `product` | ✅ | Your product/service |
| `target_company_size` | ✅ | SMB, mid-market, enterprise |
| `deal_complexity` | ❌ | simple, moderate, complex |

**Output:** Committee map (champion, economic, technical, user, blocker) with engagement strategies.

### 7. TAM SAM SOM Calculator (`tam_sam_som_calculator`)

Bottom-up market sizing with deal targets.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `product` | ✅ | Your product/service |
| `target_segments` | ✅ | Market segments |
| `pricing` | ✅ | Price point or ACV |
| `geographic_focus` | ❌ | Target geography |
| `data_sources` | ❌ | Available market data |

**Output:** TAM/SAM/SOM with methodology, assumptions, and quarterly deal targets.

### 8. Lookalike Signal Generator (`lookalike_signal_generator`)

Generate platform-specific targeting criteria.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `icp_profile` | ✅ | ICP characteristics |
| `platforms` | ✅ | linkedin, google_ads, 6sense, zoominfo, etc. |
| `budget_tier` | ❌ | low, medium, high |

**Output:** Platform-specific targeting fields, audience sizes, recommended exclusions.

### 9. Account Prioritization (`account_prioritization`)

Multi-dimensional account ranking.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `accounts` | ✅ | List of accounts to prioritize |
| `icp_criteria` | ✅ | Scoring criteria |
| `intent_signals` | ❌ | Available intent data |
| `relationship_data` | ❌ | Existing relationships |

**Output:** Tiered account list (Tier 1/2/3) with scoring rationale and engagement recommendations.

---

## 🔗 Related MCPs

| MCP | Focus | Tools | Link |
|-----|-------|-------|------|
| CRAFT GTM | GTM strategy | 8 | [GitHub](https://github.com/shashwatgtm/craft-gtm-mcp) |
| CRAFT Content | Content creation | 8 | [GitHub](https://github.com/shashwatgtm/craft-content-mcp) |
| IMPACT | B2B positioning | 8 | [GitHub](https://github.com/shashwatgtm/impact-mcp) |
| Revenue Enablement | Sales execution | 12 | [GitHub](https://github.com/shashwatgtm/revenue-enablement-mcp) |

---

## 📚 ICP Intelligence Philosophy

This MCP is built on the principle that **ICP is dynamic, not static**. The best B2B companies continuously refine their ICP based on:

- Win/loss patterns
- Customer success metrics
- Market evolution
- Product capabilities

**Key Principles:**
- Data-driven: Ground ICP in actual customer data
- Multi-dimensional: Beyond firmographics to behavior
- Actionable: Translate ICP to targeting criteria
- Iterative: Regular refinement cycles

---

## 👨‍💻 Author

**Shashwat Ghosh** - Founder, Helix GTM Consulting

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://linkedin.com/in/shashwatghosh)
[![Twitter](https://img.shields.io/badge/Twitter-Follow-1DA1F2)](https://twitter.com/Shashwat_Ghosh)
[![Website](https://img.shields.io/badge/Website-gtmhelix.com-green)](https://gtmhelix.com)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

*Part of the GTM Helix MCP Suite - AI-powered B2B go-to-market tools*


## Hosted connector (Streamable HTTP)

The same tools are also available as a hosted MCP server, so they work in Claude on the web, desktop and mobile without installing anything.

- Server URL: `https://icp-intelligence.gtmhelix.com/mcp`
- Transport: Streamable HTTP (stateless, JSON responses). Authentication: none.
- Setup guide: https://icp-intelligence.gtmhelix.com/
- In Claude: Customize, then Connectors, then Add custom connector, and paste the server URL.
- In Claude Code: `claude mcp add --transport http icp-intelligence https://icp-intelligence.gtmhelix.com/mcp`

The npm package (stdio) and the hosted server run the same `createServer()` code in `src/index.ts`.

The tool reference on the setup page (https://icp-intelligence.gtmhelix.com/) is generated from the code. Where it differs from the parameter tables earlier in this README, the setup page is correct.

## Privacy Policy

Full policy: https://icp-intelligence.gtmhelix.com/privacy.html (also in [PRIVACY.md](PRIVACY.md)).

- **Data collection:** the hosted server receives only the tool name and the inputs of each tool call. The npm package runs on your computer and sends nothing to us.
- **Use and storage:** inputs are used only to build that call's reply. Nothing is stored: no database, no files, no cache, no logging of inputs or outputs by our code.
- **Third-party sharing:** none by us. Netlify hosts the server and processes requests under its own policy (https://www.netlify.com/privacy/). The web pages load fonts from Google Fonts.
- **Retention:** we keep no tool inputs or outputs. Netlify keeps its own platform logs under its policy.
- **Contact:** shashwat@gtmhelix.com
