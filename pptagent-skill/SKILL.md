---
name: pptagent
description: Use PPTAgent to generate PowerPoint files from documents and outlines by running its MCP server and project workflows.
---

# PPTAgent Skill

Use this skill when the user wants to generate or edit PPT files with PPTAgent inside Codex.

## Workspace assumption

- PPTAgent repo path: `/Users/shaobohe/Documents/New project/PPTAgent`

If the path does not exist, ask to clone `https://github.com/Force1ess/PPTAgent.git` there.

## Quick run (MCP server)

Run these commands in the repo root:

```bash
uv pip install pptagent
uv pip install python-pptx@git+https://github.com/Force1ess/python-pptx@219513d7d81a61961fc541578c1857d08b43aa2a
```

Set runtime env vars before start:

```bash
export PPTAGENT_MODEL=openai/gpt-4.1
export PPTAGENT_API_BASE=http://localhost:8000/v1
export PPTAGENT_API_KEY=<your_key>
```

Start MCP server:

```bash
uv run pptagent-mcp
```

## When user asks to make slides

1. Confirm input source file/path and output file name.
2. Prefer existing examples under `runs/` to reuse format.
3. If dependencies are missing, install with `uv pip install -e .` (or `pip install -e .`).
4. Run the requested generation command in `/Users/shaobohe/Documents/New project/PPTAgent`.
5. Return output path and next verification steps.

## Notes

- Python 3.11+ is required.
- For PDF parsing, user may need `MINERU_API`.
- Template files are in `pptagent/templates/`.
