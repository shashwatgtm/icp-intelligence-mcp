# ICP Intelligence MCP v1.2.0
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

## Tools and inputs

Generated on 26 September 2026 from the server's own tool list (`tools/list` of icp-intelligence-mcp 1.2.0, the same code as the hosted MCP address), so every tool name, title, description and input below is exactly what the server accepts. Every tool is read-only.

| # | Tool | Title | What it does |
|---|---|---|---|
| 1 | `icp_deep_dive` | ICP Deep Dive | Analyze customer data to detect ICP patterns - firmographics, technographics, buying behavior |
| 2 | `icp_scoring_model` | ICP Scoring Model | Create a lead qualification scoring template: criteria with example point weights set by importance level, a scorecard and tier bands to adjust. Your success patterns are shown for reference; they do not set the weights |
| 3 | `buyer_group_analyzer` | Buyer Group Analyzer | Map buyer group dynamics, influence relationships, and decision-making process |
| 4 | `tam_sam_som_calculator` | TAM SAM SOM Calculator | Calculate TAM/SAM/SOM using bottom-up methodology from your data (calculation framework, not data source) |
| 5 | `lookalike_signal_generator` | Lookalike Signal Generator | Generate platform-specific targeting criteria and search queries (generates criteria, not data) |
| 6 | `account_prioritization` | Account Prioritization | Rank and prioritize accounts using multi-dimensional scoring |
| 7 | `icp_gap_analysis` | ICP Gap Analysis | Analyze gaps between current customer base and ideal ICP |
| 8 | `icp_evolution_tracker` | ICP Evolution Tracker | Checklist for reviewing how your ICP should evolve: shows your recent wins, losses and market changes next to what to check. It does not analyze the text |
| 9 | `icp_interview_synthesizer` | ICP Interview Synthesizer | Extract ICP patterns from customer interview notes or transcripts |

### Inputs of each tool

#### 1. ICP Deep Dive (`icp_deep_dive`)

| Input | Required | Type | Description |
|---|---|---|---|
| `customers` | No | array of object | List of customer objects with available attributes |
| `customer_descriptions` | No | string | Alternative: Describe your best customers in text format |
| `product_category` | No | string | What type of product you sell |

#### 2. ICP Scoring Model (`icp_scoring_model`)

| Input | Required | Type | Description |
|---|---|---|---|
| `scoring_criteria` | No | array of object | Criteria for scoring with importance levels |
| `success_correlation` | No | string | What correlates with success? (e.g., "deals with VP Sales champion close 2x faster") |
| `product_category` | No | string |  |

#### 3. Buyer Group Analyzer (`buyer_group_analyzer`)

| Input | Required | Type | Description |
|---|---|---|---|
| `product_category` | Yes | string | What you sell |
| `deal_size` | No | string | ACV range (e.g., "$50K-100K") |
| `target_company_size` | No | string | Company size (e.g., "500-1000 employees") |
| `known_stakeholders` | No | array of string | Roles you know are involved |
| `typical_champion` | No | string | Your typical champion role |

#### 4. TAM SAM SOM Calculator (`tam_sam_som_calculator`)

| Input | Required | Type | Description |
|---|---|---|---|
| `total_potential_companies` | Yes | number (0 or more) | Estimated total companies that could buy (from LinkedIn, industry reports) |
| `average_contract_value` | Yes | number (0 or more) | Your average ACV in dollars |
| `icp_percentage` | No | number (0 or more) | Percentage that match your ICP (1-100) |
| `year1_market_share_target` | No | number (0 or more) | Realistic Year 1 market share percentage (typically 1-5%) |
| `data_sources` | No | string | Where you got your numbers (for documentation) |
| `segment_name` | No | string | Name of the market segment |

#### 5. Lookalike Signal Generator (`lookalike_signal_generator`)

| Input | Required | Type | Description |
|---|---|---|---|
| `champion_titles` | Yes | array of string | Job titles of your champions |
| `icp_firmographics` | No | object | Firmographic criteria |
| `icp_technographics` | No | array of string | Technologies your ICP typically uses |
| `buying_triggers` | No | array of string | Events that trigger buying |
| `platforms` | No | array of string | Accepted but not used yet: the output always includes every platform section (linkedin, google_ads, 6sense, zoominfo) |

#### 6. Account Prioritization (`account_prioritization`)

| Input | Required | Type | Description |
|---|---|---|---|
| `accounts` | No | array of object | List of accounts to prioritize. Each account: name, fit_score (0 to 100), intent_signals (0 to 100), relationship, timing |
| `prioritization_weights` | No | object | Optional custom weights in percent for fit, intent, relationship and timing. A missing weight uses its default (40, 30, 15, 15); the tool does not check that the weights sum to 100 |

#### 7. ICP Gap Analysis (`icp_gap_analysis`)

| Input | Required | Type | Description |
|---|---|---|---|
| `current_customers` | Yes | string | Description of your current customer base |
| `ideal_icp` | Yes | string | Description of your ideal customer profile |
| `current_metrics` | No | object | Current performance metrics |
| `target_metrics` | No | object | Target performance metrics |

#### 8. ICP Evolution Tracker (`icp_evolution_tracker`)

| Input | Required | Type | Description |
|---|---|---|---|
| `current_icp` | Yes | string | Your current ICP definition |
| `recent_wins` | No | string | Description of recent successful customers |
| `recent_losses` | No | string | Description of recent lost deals |
| `market_changes` | No | string | Recent market or competitive changes |
| `time_period` | No | string | Time period for analysis (e.g., "Q4 2024") |

#### 9. ICP Interview Synthesizer (`icp_interview_synthesizer`)

| Input | Required | Type | Description |
|---|---|---|---|
| `interview_notes` | No | array of object | Structured interview notes |
| `raw_transcripts` | No | string | Alternative: Paste raw interview transcripts or notes |
| `analysis_focus` | No | string | Accepted but not used yet: every run gives the complete analysis (pain_points, buying_journey, value_props, all) |

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

**Shashwat Ghosh**, Co-Founder and Fractional CMO, Helix GTM Consulting

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://linkedin.com/in/shashwatghosh)
[![Twitter](https://img.shields.io/badge/Twitter-Follow-1DA1F2)](https://twitter.com/Shashwat_Ghosh)
[![Website](https://img.shields.io/badge/Website-gtmhelix.com-green)](https://gtmhelix.com)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

*Part of the Helix GTM Consulting MCP suite: rule-based B2B go-to-market tools (no AI model runs inside them)*


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
