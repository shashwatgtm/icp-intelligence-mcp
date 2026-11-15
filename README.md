# ICP Intelligence MCP v1.2.27
**Deep ICP Analysis with Pattern Detection**: 9 tools for ideal customer profiling, market sizing, buyer mapping, and account prioritization.

## Use it hosted (no install)

Add `https://icp-intelligence.gtmhelix.com/mcp` as a Streamable HTTP connector. It needs no sign in. On 15 November 2026 the hosted server reported version 1.2.27 and 9 tools. [Connection instructions](https://icp-intelligence.gtmhelix.com/connect/). You can also open the [web app](https://icp-intelligence.gtmhelix.com/).

For a local stdio connection, run `npx -y @shashwatgtmalpha/icp-intelligence-mcp`. On 15 November 2026 the latest published npm version was 1.2.26. Check the available version with `npm view @shashwatgtmalpha/icp-intelligence-mcp version`.


[![NPM Version](https://img.shields.io/npm/v/@shashwatgtmalpha/icp-intelligence-mcp)](https://www.npmjs.com/package/@shashwatgtmalpha/icp-intelligence-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io/?search=io.github.shashwatgtm%2Ficp-intelligence-mcp)

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

The 9 tools below come from `tools/list` in the 1.2.27 source build, checked on 15 November 2026. Each table shows the accepted fields. A dot marks a field inside an object and `[]` marks an array item. A nested field marked required is required when its parent is supplied.

| # | Tool | Title | What it does |
|---|---|---|---|
| 1 | `icp_deep_dive` | ICP Deep Dive | Helps you decide which customers to go after next. You give your best customers, as a list (industry, size, contract value, sales cycle, tech stack, buying trigger, champion title) or in your own words. You get the patterns they share, with ties named as ties, the budget shown as the contract value range seen in your customers, recommendations, and sector notes when your inputs name a supported sector. It works only from what you give and looks nothing up. |
| 2 | `icp_scoring_model` | ICP Scoring Model | Helps you decide which leads are worth a seller's time. You give the criteria that matter, how important each one is and, if you know it, what goes with success. You get a lead scoring template: example point weights set by importance level, example points for each value you list, a scorecard and tier bands to adjust, with sector notes when your inputs name a supported sector. Your success pattern is matched to your criteria; it does not set the weights. Ask for held-back test counts and the pre-agreed stop rule when a model has been tested. |
| 3 | `buyer_group_analyzer` | Buyer Group Analyzer | Helps you decide who else must agree before a deal can close. You give what you sell, the deal size, the company size, your champion and any stakeholders you know. You get a buying group map with your stakeholders placed by their titles (economic buyer, technical evaluator, reviewers, users), each role's concern and message prompts, an influence map and discovery questions, with sector roles and questions when your inputs name a supported sector. Roles from titles are hypotheses to confirm. |
| 4 | `tam_sam_som_calculator` | TAM SAM SOM Calculator | Helps you decide how big your market is, counted bottom up. You give how many companies could buy and your annual contract value in dollars, plus your ICP match rate and year 1 share if you have them. You get TAM, SAM and SOM with the arithmetic and assumptions shown and a summary for an investor deck. It is a calculator, not a data source: a rate you leave out is filled with a labelled example, and sector notes are added when your inputs name a supported sector. |
| 5 | `lookalike_signal_generator` | Lookalike Signal Generator | Helps you decide how to find more accounts like your best ones. You give your ICP's company profile, technologies, champion titles and buying triggers, and optionally what you sell and the platforms you use. You get targeting criteria and search queries for each platform, one signal for each trigger, and search keywords from what you sell and the sector. It writes criteria, not data: it finds no companies or contacts. |
| 6 | `account_prioritization` | Account Prioritization | Helps you decide which accounts to work first. You give your accounts with fit, intent and relationship scores from 0 to 100 and a timing, plus optional weights. You get a ranked list from a weighted score, with a tier for each account, the points its timing earned and the factor that added the most points. |
| 7 | `icp_gap_analysis` | ICP Gap Analysis | Helps you decide whether you are selling to the customers you meant to. You give your current customer base, your ideal customer profile and, if you have them, current and target metrics. You get what the ideal profile has that the current base lacks, metric gaps from your own figures, causes to check and actions that fit your business model, with sector notes when your inputs name a supported sector. |
| 8 | `icp_evolution_tracker` | ICP Evolution Tracker | Helps you decide whether your ICP should change after recent wins and losses. You give your current ICP, recent wins, recent losses and market changes. You get a candidate change for each (an addition to test, a disqualifier to test, an implication to check), a draft of the updated ICP, the roles your ICP does not name, the loss reasons to tag and what to pull from your CRM. It does not compute win rates; check each candidate against your CRM. |
| 9 | `icp_interview_synthesizer` | ICP Interview Synthesizer | Helps you decide what your customer interviews mean for your ICP. You give structured notes, one per interview: the customer, the role, pain points, buying triggers, value realized and key quotes. You get the pain points, objections, buying triggers, value realized and champion roles across the interviews, quotes kept word for word, discovery questions and sector notes. It does not take full transcripts; give only the points and quotes you want analyzed. |

### Inputs of each tool

#### 1. ICP Deep Dive (`icp_deep_dive`)

| Input | Required | Type | Description |
|---|---|---|---|
| `customers` | No | array of object | List of customer objects with available attributes |
| `customers[].name` | No | string |  |
| `customers[].industry` | No | string |  |
| `customers[].size` | No | string |  |
| `customers[].acv` | No | number (minimum 0) |  |
| `customers[].sales_cycle_days` | No | number (minimum 0) |  |
| `customers[].tech_stack` | No | array of string |  |
| `customers[].buying_trigger` | No | string |  |
| `customers[].champion_title` | No | string |  |
| `customer_descriptions` | No | string | Alternative: Describe your best customers in text format |
| `product_category` | No | string | What type of product you sell |
| `company` | No | string | Optional: your company or product name, so the answer can name it |
| `business_model` | No | one of `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge (software subscription, services, connectivity, per transaction, marketplace, hardware plus software, or investment management). Read from your other inputs when left out |

#### 2. ICP Scoring Model (`icp_scoring_model`)

| Input | Required | Type | Description |
|---|---|---|---|
| `scoring_criteria` | No | array of object | Criteria for scoring with importance levels |
| `scoring_criteria[].criterion` | No | string |  |
| `scoring_criteria[].importance` | No | one of `critical`, `important`, `nice_to_have` |  |
| `scoring_criteria[].values` | No | array of string |  |
| `correlation_direction` | No | one of `positive`, `negative`, `unknown` | Optional confirmed direction of the success pattern. Ask the user whether the named values correlate with better or worse outcomes before filling this. Overrides word reading; unknown withholds a top-points recommendation. |
| `success_correlation` | No | string | What correlates with success? (e.g., "deals with VP Sales champion close 2x faster") |
| `product_category` | No | string | Optional: what you sell, as a product category, so the scoring notes use your sector |
| `company` | No | string | Optional: your company or product name, so the answer can name it |
| `held_back_test` | No | object | Optional results on deals held back before tuning. Ask for the counts and the stop rule set before the test. A missed rule holds the scoring model; do not tune on this set. |
| `held_back_test.wins_tested` | Yes | integer (minimum 0) |  |
| `held_back_test.wins_passing` | Yes | integer (minimum 0) |  |
| `held_back_test.non_wins_tested` | Yes | integer (minimum 0) |  |
| `held_back_test.non_wins_passing` | Yes | integer (minimum 0) |  |
| `held_back_test.minimum_win_pass_percent` | Yes | number (minimum 0, maximum 100) |  |
| `held_back_test.maximum_non_win_pass_percent` | Yes | number (minimum 0, maximum 100) |  |

#### 3. Buyer Group Analyzer (`buyer_group_analyzer`)

| Input | Required | Type | Description |
|---|---|---|---|
| `deal_size` | No | string | ACV range (e.g., "$50K-100K") |
| `target_company_size` | No | string | Company size (e.g., "500-1000 employees") |
| `product_category` | Yes | string | What you sell |
| `known_stakeholders` | No | array of string | Roles you know are involved. A title suggests a role, not confirmed authority. Confirm who owns this purchase budget. |
| `confirmed_budget_owner` | No | string | Optional confirmed fact: the person or role who owns the budget for this purchase. Ask the user; do not infer from title. Overrides candidate ordering. |
| `typical_champion` | No | string | Your typical champion role |
| `company` | No | string | Optional: your company or product name, so the answer can name it |
| `business_model` | No | one of `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge (software subscription, services, connectivity, per transaction, marketplace, hardware plus software, or investment management). Read from your other inputs when left out |

#### 4. TAM SAM SOM Calculator (`tam_sam_som_calculator`)

| Input | Required | Type | Description |
|---|---|---|---|
| `total_potential_companies` | Yes | number (minimum 0) | Estimated total companies that could buy (from LinkedIn, industry reports) |
| `average_contract_value` | Yes | number (greater than 0) | Your average ACV in dollars |
| `icp_percentage` | No | number (minimum 0, maximum 100) | Percentage of those companies that match your ICP, from 0 to 100. Left out, 30 is used and marked as an example |
| `year1_market_share_target` | No | number (minimum 0, maximum 100) | Assumed Year 1 share percentage, from 0 to 100. This is a planning assumption, not evidence of attainable share. Left out, 3 is used and marked as an example |
| `data_sources` | No | string | Where you got your numbers (for documentation) |
| `segment_name` | No | string | Name of the market segment |
| `product_category` | No | string | Optional: what you sell (for example "spend management software"), used for sector notes. The arithmetic does not use it |
| `company` | No | string | Optional: your company or product name, so the answer can name it |

#### 5. Lookalike Signal Generator (`lookalike_signal_generator`)

| Input | Required | Type | Description |
|---|---|---|---|
| `icp_firmographics` | No | object | Firmographic criteria |
| `icp_firmographics.industries` | No | array of string |  |
| `icp_firmographics.company_sizes` | No | array of string |  |
| `icp_firmographics.locations` | No | array of string |  |
| `icp_firmographics.funding_stages` | No | array of string |  |
| `icp_technographics` | No | array of string | Technologies your ICP typically uses |
| `champion_titles` | Yes | array of string | Job titles of your champions |
| `buying_triggers` | No | array of string | Events that trigger buying |
| `platforms` | No | array of string | Optional: the sections to include (linkedin, google_ads, 6sense, zoominfo). Left out, every section is included |
| `product_category` | No | string | Optional: what you sell (for example "spend management software"), used for search keywords and sector notes |
| `company` | No | string | Optional: your company or product name, so the answer can name it |

#### 6. Account Prioritization (`account_prioritization`)

| Input | Required | Type | Description |
|---|---|---|---|
| `accounts` | No | array of object | List of accounts to prioritize. Each account: name, fit score (0 to 100), intent signals (0 to 100), relationship (0 to 100), timing (now, soon, later or unknown) |
| `accounts[].name` | No | string |  |
| `accounts[].fit_score` | No | number (minimum 0, maximum 100) | 0 to 100. Left out, 50 is used |
| `accounts[].intent_signals` | No | number (minimum 0, maximum 100) | 0 to 100 (0 scores zero). Left out, 50 is used |
| `accounts[].relationship` | No | number (minimum 0, maximum 100) | 0 to 100, based on existing connections. Left out, 50 is used |
| `accounts[].timing` | No | string | Buying horizon: now, soon, later or unknown (100, 70, 40 and 50 points respectively). Equivalent phrases are read by clause; denied or conflicting horizons remain unknown. Confirm the horizon with the user. |
| `prioritization_weights` | No | object | Optional custom weights in percent for fit, intent, relationship and timing. A missing weight uses its default (40, 30, 15, 15); the tool does not check that the weights sum to 100 |
| `prioritization_weights.fit` | No | number |  |
| `prioritization_weights.intent` | No | number |  |
| `prioritization_weights.relationship` | No | number |  |
| `prioritization_weights.timing` | No | number |  |
| `product_category` | No | string | Optional: what you sell (for example "spend management software"), used for sector notes. The arithmetic does not use it |
| `company` | No | string | Optional: your company or product name, so the answer can name it |

#### 7. ICP Gap Analysis (`icp_gap_analysis`)

| Input | Required | Type | Description |
|---|---|---|---|
| `current_customers` | Yes | string | Description of your current customer base |
| `ideal_icp` | Yes | string | Description of your ideal customer profile |
| `current_metrics` | No | object | Current performance metrics |
| `current_metrics.avg_acv` | No | number (minimum 0) |  |
| `current_metrics.avg_sales_cycle` | No | number (minimum 0) |  |
| `current_metrics.win_rate` | No | number |  |
| `current_metrics.churn_rate` | No | number |  |
| `current_metrics.nps` | No | number |  |
| `target_metrics` | No | object | Target performance metrics |
| `target_metrics.avg_acv` | No | number (minimum 0) |  |
| `target_metrics.avg_sales_cycle` | No | number (minimum 0) |  |
| `target_metrics.win_rate` | No | number |  |
| `target_metrics.churn_rate` | No | number |  |
| `target_metrics.nps` | No | number |  |
| `product_category` | No | string | Optional: what you sell, used for sector notes |
| `company` | No | string | Optional: your company or product name, so the answer can name it |
| `business_model` | No | one of `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge (software subscription, services, connectivity, per transaction, marketplace, hardware plus software, or investment management). Read from your other inputs when left out |

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
| `interview_notes` | No | array of object | Structured interview notes: one object per interview with the customer (company or segment), the role of the person interviewed and the points and quotes to analyze |
| `interview_notes[].customer` | No | string |  |
| `interview_notes[].role` | No | string |  |
| `interview_notes[].key_quotes` | No | array of string |  |
| `interview_notes[].pain_points` | No | array of string |  |
| `interview_notes[].buying_triggers` | No | array of string |  |
| `interview_notes[].value_realized` | No | array of string |  |
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
| CRAFT GTM | GTM strategy | 10 | [GitHub](https://github.com/shashwatgtm/craft-gtm-mcp) |
| CRAFT Content | Content creation | 9 | [GitHub](https://github.com/shashwatgtm/craft-content-mcp) |
| IMPACT | B2B positioning | 9 | [GitHub](https://github.com/shashwatgtm/impact-mcp) |
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

The repository defines the stdio and hosted entry points using `createServer()` in `src/index.ts`.

The tool reference on the docs page (https://icp-intelligence.gtmhelix.com/docs/) is generated from the code. Where it differs from the parameter tables earlier in this README, the docs page is correct.

## Privacy Policy

Full policy: <https://icp-intelligence.gtmhelix.com/privacy/> (also in [PRIVACY.md](PRIVACY.md)).

- **Data collection:** the hosted server receives only the tool name and the inputs of each tool call. The npm package runs on your computer and sends nothing to us.
- **Use and storage:** inputs are used only to build that call's reply. Inputs and answers are not stored: no database, no files, no cache, no logging of inputs or outputs by our code. Each call adds one anonymous usage record (date and time, site and tool name, app kind, web form or assistant); see the privacy page.
- **Third-party sharing:** none by us. Netlify hosts the server and processes requests under its own policy (https://www.netlify.com/privacy/). Fonts are served from this site, so loading a page contacts no one else.
- **Retention:** we keep no tool inputs or outputs. Netlify keeps its own platform logs under its policy.
- **Contact:** shashwat@gtmhelix.com
