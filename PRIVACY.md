# Privacy Policy: ICP Intelligence MCP server

Last updated: 2026-09-24. The same policy is published at https://icp-intelligence.gtmhelix.com/privacy.html.

## Who we are

ICP Intelligence is built and run by Shashwat Ghosh, Helix GTM Consulting. Contact: shashwat@gtmhelix.com.

## What the hosted server receives

When an AI assistant such as Claude calls one of the tools, the server at `https://icp-intelligence.gtmhelix.com/mcp` receives the tool name and the inputs for that call. It does not receive your chat history, account details, files or anything else from your conversation.

## How it is used and stored

- Inputs are used only to build the text the tool returns, inside that one request.
- Nothing is kept: no database, no file storage, no cache. Each request starts from nothing.
- Our code does not log tool inputs or outputs.
- No accounts, cookies, analytics or advertising.

## Who else processes data

- **Netlify** hosts the server and web pages and processes each request (including your IP address) under its own policy: https://www.netlify.com/privacy/
- **Google Fonts:** the web pages (not the MCP server) load fonts from Google: https://policies.google.com/privacy
- Your AI assistant's provider handles your conversation under its own policy.

We do not sell or share data with anyone else.

## Retention

We keep no tool inputs or outputs, so there is nothing for us to delete. Netlify keeps its own platform logs under its policy.

## Local version (npm)

The npm package `@shashwatgtmalpha/icp-intelligence-mcp` runs entirely on your computer over stdio and sends nothing to us.

## Changes and contact

We will update this policy if the handling of data changes. Questions: shashwat@gtmhelix.com.
