# ICP Intelligence privacy policy

The published version is at https://icp-intelligence.gtmhelix.com/privacy/. This copy is generated from the same source.

Last updated 25 September 2026

## Who we are

ICP Intelligence is built and run by Shashwat Ghosh, Helix GTM Consulting. Contact: [shashwat@gtmhelix.com](mailto:shashwat@gtmhelix.com).

## What this site receives

- **Web forms.** When you press Run on a tool page, your browser sends the fields you filled in to `https://icp-intelligence.gtmhelix.com/api/tools/<tool>`. The form also has one hidden field that people never see or fill in; it exists to catch automated spam.
- **AI assistants.** When Claude or another assistant calls a tool through `https://icp-intelligence.gtmhelix.com/mcp`, the server receives the tool name and that call's inputs. It does not receive your chat history, account details or files.

## How it is used and stored

- The inputs are used once, inside that request, to build the answer. The same function serves the web form and the MCP address.
- Nothing is stored: there is no database, file storage or cache for inputs or answers. Answers are sent with `Cache-Control: no-store`.
- Our code does not log your inputs or the answers.
- The page does not save what you type in your browser either. It is gone when you close or reload the page.
- There are no accounts, cookies, analytics, advertising or tracking scripts. Fonts are served from this site, so loading a page contacts no one else.

## Limits that protect the service

- Rate limits: 30 web form requests and 300 MCP requests per minute from one IP address. Netlify counts requests per IP address for this; we do not see or keep those counts.
- Requests larger than 32,000 bytes, text fields longer than 6,000 characters and lists longer than 50 items are refused before the tool runs.

## Who else processes data

- **Netlify** hosts the site and the functions. Like any web host it processes each request, including your IP address, and keeps its own platform logs under its policy: [netlify.com/privacy](https://www.netlify.com/privacy/).
- If you use an AI assistant, its provider (for example Anthropic for Claude) handles your conversation under its own policy.

We do not sell or share data with anyone else.

## Retention and your rights

We keep no inputs or answers, so there is nothing of yours for us to find, correct or delete. Netlify's platform logs are kept by Netlify under its policy. Questions: [shashwat@gtmhelix.com](mailto:shashwat@gtmhelix.com).

## Local version

The npm package (@shashwatgtmalpha/icp-intelligence-mcp) runs entirely on your own computer and sends nothing to us.

## Changes

We will update this page if the handling of data changes. The date at the top shows the latest version.
