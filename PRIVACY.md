# ICP Intelligence privacy policy

The published version is at https://icp-intelligence.gtmhelix.com/privacy/.

Last updated 29 October 2026

## Who we are

ICP Intelligence is built and run by Shashwat Ghosh, Helix GTM Consulting. Contact: [shashwat@gtmhelix.com](mailto:shashwat@gtmhelix.com).

## What this site receives

- **Web forms.** When you press Run on a tool page, your browser sends the fields you filled in to `https://icp-intelligence.gtmhelix.com/api/tools/<tool>`. The form also has one hidden field that people never see or fill in; it exists to catch automated spam.
- **AI assistants.** When Claude or another assistant calls a tool through `https://icp-intelligence.gtmhelix.com/mcp`, the server receives the tool name and that call's inputs. It does not receive your chat history, account details or files.

## How it is used and stored

- The inputs are used once, inside that request, to build the answer. The web form and the MCP address are two small functions that call the same tool code.
- Inputs and answers are not stored: there is no database, file storage or cache for them. Web and MCP answers are sent with `Cache-Control: no-store`.
- Our code does not log your inputs or the answers.
- The page does not save what you type in your browser either. It is gone when you close or reload the page.
- There are no accounts, cookies, advertising or tracking scripts. The only analytics is the usage count below. Fonts are served from this site, so loading a page contacts no one else.

## Usage counts

Since 17 October 2026, each call to a tool adds one record to a usage count, kept in Netlify's storage for this site. It shows us which tools people use. Each record holds only:

- The date and time of the call.
- This site's name and the tool's name.
- One word for the kind of app that made the call, such as `claude`, `chatgpt` or `browser`. It is read from the User-Agent header the app sends.
- Whether the call came from a web form or an AI assistant.

It never holds your inputs, the answer, your IP address or the full User-Agent. Nothing in a record says who you are. To use the tools without being counted, use the local version described below.

## Limits that protect the service

- Rate limits: 30 web form requests and 300 MCP requests per minute from one IP address. Netlify counts requests per IP address for this; we do not see or keep those counts.
- On the web forms, requests larger than 32,000 bytes, and top-level text fields longer than 6,000 characters or lists longer than 50 items, are refused before the tool runs (fields inside a list or object count toward the 32,000 bytes). MCP calls larger than 262,144 bytes, batches of several calls, the document field customer_descriptions longer than 100,000 characters and other text fields longer than 4,000 characters are refused before the tool runs.

## Who else processes data

- **Netlify** hosts the site and the functions, and stores the usage counts. Like any web host it processes each request, including your IP address, and keeps its own platform logs under its policy: [netlify.com/privacy](https://www.netlify.com/privacy/).
- If you use an AI assistant, its provider (for example Anthropic for Claude) handles your conversation under its own policy.

We do not sell or share data with anyone else.

## Retention and your rights

We keep no inputs or answers, so there is nothing of yours for us to find, correct or delete. Usage counts have no set end date. They cannot be linked to you, so we cannot find or delete one person's records. Netlify's platform logs are kept by Netlify under its policy. Questions: [shashwat@gtmhelix.com](mailto:shashwat@gtmhelix.com).

## Local version

The npm package (@shashwatgtmalpha/icp-intelligence-mcp) runs entirely on your own computer and sends nothing to us.

## Changes

We will update this page if the handling of data changes. The date at the top shows the latest version.
