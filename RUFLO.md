# Ruflo integration for NEVERA

This repository is prepared for Ruflo as an external development/orchestration layer.

## Local setup

Requirements: Node.js 20+ and npm 9+. Ruflo documentation recommends the command:

npx ruflo@latest init wizard

Then:

npx ruflo@latest doctor --fix

For Claude Code MCP integration:

claude mcp add ruflo -- npx ruflo@latest mcp start

## NEVERA swarm

Use a hierarchical, specialized swarm with at most 6 agents:

- coordinator
- architect
- coder
- tester
- security
- reviewer

Do not give the swarm permission to bypass NEVERA's application safety policies.

## First validation task

After Ruflo is initialized, use it to audit the repository without changing production behavior:

1. map architecture and dependencies;
2. identify highest-risk modules;
3. inspect test coverage;
4. propose a prioritized hardening plan;
5. run tests;
6. report findings.

Only after that audit should autonomous code changes be enabled.
