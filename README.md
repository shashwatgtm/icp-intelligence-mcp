# ICP Intelligence MCP v1.2.17
**Deep ICP Analysis with Pattern Detection**: 9 tools for ideal customer profiling, market sizing, buyer mapping, and account prioritization.

## Use it hosted (no install)

Add `https://icp-intelligence.gtmhelix.com/mcp` to Claude or ChatGPT as a custom connector. It needs no sign-in and always runs the newest version (1.2.17). The same tools run as a free web app with a form per tool at https://icp-intelligence.gtmhelix.com/, and the setup steps are at https://icp-intelligence.gtmhelix.com/connect/.

The npm package below is an older version (1.0.0 on npm on 27 September 2026) until the next npm release. Use it only if you need a local stdio server.


[![NPM Version](https://img.shields.io/npm/v/@shashwatgtmalpha/icp-intelligence-mcp)](https://www.npmjs.com/package/@shashwatgtmalpha/icp-intelligence-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)

## Quick Start

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

Generated on 27 September 2026 from the server's own tool list, and regenerated on 2 October 2026 from `tools/list` of icp-intelligence-mcp 1.2.17 (the same code as the hosted MCP address), so every tool name, title, description and input below is exactly what the server accepts. Every tool is read-only.

| # | Tool | Title | What it does |
|---|---|---|---|
| 1 | `icp_deep_dive` | ICP Deep Dive | Analyze customer data to detect ICP patterns (industry, size, deal size, sales cycle, tech stack, triggers, champion roles). Ties are named as ties, the budget is the ACV range seen in your customers, and sector notes are added when your inputs name one of the supported sectors |
| 2 | `icp_scoring_model` | ICP Scoring Model | Create a lead qualification scoring template: criteria with example point weights set by importance level, example points for each value you list, a scorecard and tier bands to adjust. Your success pattern is matched to your criteria; it does not set the weights. Sector notes are added when your inputs name one of the supported sectors |
| 3 | `buyer_group_analyzer` | Buyer Group Analyzer | Map the buyer group for a deal: the champion you name, your known stakeholders placed by their titles (economic buyer, technical evaluator, reviewers, users), each role's concern and message prompts, an influence map and discovery questions. Sector roles and questions are added when your inputs name one of the supported sectors |
| 4 | `tam_sam_som_calculator` | TAM SAM SOM Calculator | Calculate TAM/SAM/SOM bottom-up from your company count, ACV, ICP match rate and Year 1 share (calculation framework, not a data source). Sector notes are added when your inputs name one of the supported sectors |
| 5 | `lookalike_signal_generator` | Lookalike Signal Generator | Generate platform-specific targeting criteria and search queries from your firmographics, technographics, champion titles and buying triggers (generates criteria, not data). Each trigger gets its own signal; search keywords come from what you sell and the sector; platforms limits the sections |
| 6 | `account_prioritization` | Account Prioritization | Rank and prioritize accounts by a weighted score of fit, intent, relationship and timing; each account shows the points its timing earned and the factor that added the most points |
| 7 | `icp_gap_analysis` | ICP Gap Analysis | Analyze gaps between your current customer base and your ideal ICP: what the ideal profile has that the current base lacks, metric gaps from your current and target figures, causes to check and actions that fit your business model. Sector notes are added when your inputs name one of the supported sectors |
| 8 | `icp_evolution_tracker` | ICP Evolution Tracker | Review how your ICP should evolve: reads your recent wins, losses and market changes against your current ICP and states a candidate change for each (an addition to test, a disqualifier to test, an implication to check), with a review checklist. It does not compute win rates; check each candidate against your CRM |
| 9 | `icp_interview_synthesizer` | ICP Interview Synthesizer | Extract ICP patterns from customer interview notes: pain points, objections, buying triggers, value realized, champion roles and quotes kept word for word, with discovery questions and sector notes. Pasted notes are shown back (shortened) with a template to structure them; only structured notes are analyzed. |

### Inputs of each tool

#### 1. ICP Deep Dive (`icp_deep_dive`)

| Input | Required | Type | Description |
|---|---|---|---|
| `customers` | No | array of object | List of customer objects with available attributes |
| `customer_descriptions` | No | string | Alternative: Describe your best customers in text format |
| `product_category` | No | string | What type of product you sell |
| `company` | No | string | Optional: your company or product name, so the answer can name it |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge (software subscription, services, connectivity, per transaction, marketplace, hardware plus software, or investment management). Read from your other inputs when left out |

#### 2. ICP Scoring Model (`icp_scoring_model`)

| Input | Required | Type | Description |
|---|---|---|---|
| `scoring_criteria` | No | array of object | Criteria for scoring with importance levels |
| `success_correlation` | No | string | What correlates with success? (e.g., "deals with VP Sales champion close 2x faster") |
| `product_category` | No | string |  |
| `company` | No | string | Optional: your company or product name, so the answer can name it |

#### 3. Buyer Group Analyzer (`buyer_group_analyzer`)

| Input | Required | Type | Description |
|---|---|---|---|
| `product_category` | Yes | string | What you sell |
| `deal_size` | No | string | ACV range (e.g., "$50K-100K") |
| `target_company_size` | No | string | Company size (e.g., "500-1000 employees") |
| `known_stakeholders` | No | array of string | Roles you know are involved |
| `typical_champion` | No | string | Your typical champion role |
| `company` | No | string | Optional: your company or product name, so the answer can name it |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge (software subscription, services, connectivity, per transaction, marketplace, hardware plus software, or investment management). Read from your other inputs when left out |

#### 4. TAM SAM SOM Calculator (`tam_sam_som_calculator`)

| Input | Required | Type | Description |
|---|---|---|---|
| `total_potential_companies` | Yes | number (0 or more) | Estimated total companies that could buy (from LinkedIn, industry reports) |
| `average_contract_value` | Yes | number (more than 0) | Your average ACV in dollars |
| `icp_percentage` | No | number (0 to 100) | Percentage of those companies that match your ICP, from 0 to 100. Left out, 30 is used and marked as an example |
| `year1_market_share_target` | No | number (0 to 100) | Realistic Year 1 market share percentage, from 0 to 100 (typically 1-5%). Left out, 3 is used and marked as an example |
| `data_sources` | No | string | Where you got your numbers (for documentation) |
| `segment_name` | No | string | Name of the market segment |
| `company` | No | string | Optional: your company or product name, so the answer can name it |

#### 5. Lookalike Signal Generator (`lookalike_signal_generator`)

| Input | Required | Type | Description |
|---|---|---|---|
| `champion_titles` | Yes | array of string | Job titles of your champions |
| `icp_firmographics` | No | object | Firmographic criteria |
| `icp_technographics` | No | array of string | Technologies your ICP typically uses |
| `buying_triggers` | No | array of string | Events that trigger buying |
| `platforms` | No | array of string | Optional: the sections to include (linkedin, google_ads, 6sense, zoominfo). Left out, every section is included |
| `product_category` | No | string | Optional: what you sell (for example "spend management software"), used for search keywords and sector notes |
| `company` | No | string | Optional: your company or product name, so the answer can name it |

#### 6. Account Prioritization (`account_prioritization`)

| Input | Required | Type | Description |
|---|---|---|---|
| `accounts` | No | array of object | List of accounts to prioritize. Each account: name, fit_score (0 to 100), intent_signals (0 to 100), relationship (0 to 100), timing (now, soon, later or unknown) |
| `prioritization_weights` | No | object | Optional custom weights in percent for fit, intent, relationship and timing. A missing weight uses its default (40, 30, 15, 15); the tool does not check that the weights sum to 100 |
| `company` | No | string | Optional: your company or product name, so the answer can name it |

#### 7. ICP Gap Analysis (`icp_gap_analysis`)

| Input | Required | Type | Description |
|---|---|---|---|
| `current_customers` | Yes | string | Description of your current customer base |
| `ideal_icp` | Yes | string | Description of your ideal customer profile |
| `current_metrics` | No | object | Current performance metrics |
| `target_metrics` | No | object | Target performance metrics |
| `product_category` | No | string | Optional: what you sell, used for sector notes |
| `company` | No | string | Optional: your company or product name, so the answer can name it |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge (software subscription, services, connectivity, per transaction, marketplace, hardware plus software, or investment management). Read from your other inputs when left out |

#### 8. ICP Evolution Tracker (`icp_evolution_tracker`)

| Input | Required | Type | Description |
|---|---|---|---|
| `current_icp` | Yes | string | Your current ICP definition |
| `recent_wins` | No | string | Description of recent successful customers |
| `recent_losses` | No | string | Description of recent lost deals |
| `market_changes` | No | string | Recent market or competitive changes |
| `time_period` | No | string | Time period you are reviewing, in your own words (for example "last quarter") |
| `product_category` | No | string | Optional: what you sell, used for sector notes |
| `company` | No | string | Optional: your company or product name, so the answer can name it |

#### 9. ICP Interview Synthesizer (`icp_interview_synthesizer`)

| Input | Required | Type | Description |
|---|---|---|---|
| `interview_notes` | No | array of object | Structured interview notes |
| `raw_transcripts` | No | string | Alternative: paste interview notes or transcripts. This tool does not analyze pasted text: it shows up to 500 characters back with a template to structure them as interview_notes, which it does analyze |
| `analysis_focus` | No | string | Accepted but not used yet: every run gives the complete analysis (pain_points, buying_journey, value_props, all) |
| `product_category` | No | string | Optional: what you sell, used for sector notes |
| `company` | No | string | Optional: your company or product name, so the answer can name it |

## Who Is This For?

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

---

## Related MCPs

| MCP | Focus | Tools | Link |
|-----|-------|-------|------|
| CRAFT GTM | GTM strategy | 8 | [GitHub](https://github.com/shashwatgtm/craft-gtm-mcp) |
| CRAFT Content | Content creation | 8 | [GitHub](https://github.com/shashwatgtm/craft-content-mcp) |
| IMPACT | B2B positioning | 8 | [GitHub](https://github.com/shashwatgtm/impact-mcp) |
| Revenue Enablement | Sales execution | 12 | [GitHub](https://github.com/shashwatgtm/revenue-enablement-mcp) |

---

## ICP Intelligence Philosophy

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

## Author

**Shashwat Ghosh**, Co-Founder and Fractional CMO, Helix GTM Consulting, with 24+ years in B2B and 10+ years of fractional experience

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://www.linkedin.com/in/shashwatghosh-ai-b2b-gtm-fractionalcmo/)
[![X](https://img.shields.io/badge/X-Follow-1A0E10)](https://x.com/Shashwat_Ghosh)
[![Website](https://img.shields.io/badge/Website-gtmhelix.com-green)](https://gtmhelix.com)

---

## License

MIT License: see [LICENSE](LICENSE) for details.

---

*Part of the Helix GTM Consulting MCP suite: rule-based B2B go-to-market tools (no AI model runs inside them)*


## Hosted connector (Streamable HTTP)

The same tools are also available as a hosted MCP server, so they work in Claude on the web, desktop and mobile without installing anything.

- Server URL: `https://icp-intelligence.gtmhelix.com/mcp`
- Transport: Streamable HTTP (stateless, JSON responses). Authentication: none.
- Setup guide: https://icp-intelligence.gtmhelix.com/connect/
- In Claude: Customize, then Connectors, then Add custom connector, and paste the server URL.
- In Claude Code: `claude mcp add --transport http icp-intelligence https://icp-intelligence.gtmhelix.com/mcp`

The npm package (stdio) and the hosted server run the same `createServer()` code in `src/index.ts`.

The tool reference on the docs page (https://icp-intelligence.gtmhelix.com/docs/) is generated from the code. Where it differs from the parameter tables earlier in this README, the docs page is correct.

## Privacy Policy

Full policy: https://icp-intelligence.gtmhelix.com/privacy/ (also in [PRIVACY.md](PRIVACY.md)).

- **Data collection:** the hosted server receives only the tool name and the inputs of each tool call. The npm package runs on your computer and sends nothing to us.
- **Use and storage:** inputs are used only to build that call's reply. Nothing is stored: no database, no files, no cache, no logging of inputs or outputs by our code.
- **Third-party sharing:** none by us. Netlify hosts the server and processes requests under its own policy (https://www.netlify.com/privacy/). Fonts are served from this site, so loading a page contacts no one else.
- **Retention:** we keep no tool inputs or outputs. Netlify keeps its own platform logs under its policy.
- **Contact:** shashwat@gtmhelix.com
