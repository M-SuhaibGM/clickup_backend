// backend/src/services/ai.service.ts
//
// Lightweight wrapper around the OpenAI Chat Completions API.
// Uses the global `fetch` (Node 18+) so no extra dependency is required.
//
// Requires an OPENAI_API_KEY in the backend environment (.env).

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const AI_TIMEOUT_MS = 30_000;

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

async function chat(messages: ChatMessage[], maxTokens = 500): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('AI is not configured. Set OPENAI_API_KEY in the backend environment.');
  }

  // Don't let a stalled upstream hold the request (and the user's spinner) open forever.
  let res: Response;
  try {
    res = await fetch(OPENAI_URL, {
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: maxTokens,
        messages,
      }),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new Error('The AI took too long to respond. Please try again.');
    }
    throw err;
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OpenAI request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data: any = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Empty response from AI');
  return content.trim();
}

/** Extract a JSON array of strings from a model response, tolerating code fences / prose. */
function parseStringArray(raw: string): string[] {
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  let items: unknown = [];
  if (start !== -1 && end !== -1 && end > start) {
    try {
      items = JSON.parse(raw.slice(start, end + 1));
    } catch {
      items = [];
    }
  }
  if (!Array.isArray(items) || items.length === 0) {
    // Fallback: split lines, strip bullets / numbering
    return raw
      .split('\n')
      .map((l) => l.replace(/^[\s\-*\d.)]+/, '').trim())
      .filter(Boolean)
      .slice(0, 10);
  }
  return (items as unknown[])
    .map((i) => String(i).trim())
    .filter(Boolean)
    .slice(0, 10);
}

export const AiService = {
  /** Free-form assistant chat, grounded in the user's own tasks. */
  async converse(
    message: string,
    history: { role: string; content: string }[],
    context: { userName?: string; tasks: string[] }
  ): Promise<string> {
    if (!message?.trim()) throw new Error('A message is required');

    const past: ChatMessage[] = (Array.isArray(history) ? history : [])
      .filter(
        (m) =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim()
      )
      .slice(-20)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.slice(0, 4000),
      }));

    const taskBlock = context.tasks.length
      ? context.tasks.join('\n')
      : '(no tasks are currently assigned to this user)';

    return chat(
      [
        {
          role: 'system',
          content:
            'You are the AI assistant inside a task-management app. ' +
            'Help the user plan work, prioritize, summarize their tasks, and draft content ' +
            '(task descriptions, project updates, messages). Be concise and practical. ' +
            'Reply in plain text; use "- " for bullets and no markdown headings, bold, or tables. ' +
            'Only state facts about the user\'s tasks that appear in the list below; ' +
            'if something is not there, say you cannot see it.\n\n' +
            `Today is ${new Date().toISOString().slice(0, 10)}.` +
            (context.userName ? ` The user's name is ${context.userName}.` : '') +
            `\n\nTasks assigned to the user:\n${taskBlock}`,
        },
        ...past,
        { role: 'user', content: message.trim().slice(0, 4000) },
      ],
      900
    );
  },

  /** Suggest a short checklist of concrete subtasks for a task. */
  async generateSubtasks(title: string, description?: string): Promise<string[]> {
    if (!title?.trim()) throw new Error('A task title is required');

    const raw = await chat([
      {
        role: 'system',
        content:
          'You are a senior project manager inside a task-management app. ' +
          'Break the given task into 3-6 small, concrete, actionable subtasks. ' +
          'Each subtask is a short imperative phrase (max ~8 words), no numbering. ' +
          'Respond with ONLY a JSON array of strings, nothing else.',
      },
      {
        role: 'user',
        content: `Task title: ${title.trim()}${
          description?.trim() ? `\nDescription: ${description.trim()}` : ''
        }`,
      },
    ]);

    const subtasks = parseStringArray(raw);
    if (subtasks.length === 0) throw new Error('AI did not return any subtasks');
    return subtasks;
  },

  /** Turn a free-text goal into a structured list of tasks. */
  async draftTasks(
    prompt: string
  ): Promise<{ title: string; priority: string; description: string }[]> {
    if (!prompt?.trim()) throw new Error('Describe what you want to plan');

    const raw = await chat(
      [
        {
          role: 'system',
          content:
            'You are a project planner inside a task-management app. ' +
            'Turn the user\'s goal into 5-8 concrete, ordered tasks. ' +
            'For each task provide a short "title" (max ~10 words), a one-sentence ' +
            '"description", and a "priority" that is exactly one of: LOW, NORMAL, HIGH, URGENT. ' +
            'Respond with ONLY a JSON array of objects {"title","description","priority"} and nothing else.',
        },
        { role: 'user', content: prompt.trim() },
      ],
      900
    );

    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    let parsed: any[] = [];
    if (start !== -1 && end !== -1 && end > start) {
      try {
        parsed = JSON.parse(raw.slice(start, end + 1));
      } catch {
        parsed = [];
      }
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('AI did not return a task list');
    }

    const VALID = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
    return parsed
      .map((t) => {
        const priority = String(t?.priority || 'NORMAL').toUpperCase();
        return {
          title: String(t?.title || '').trim(),
          description: String(t?.description || '').trim(),
          priority: VALID.includes(priority) ? priority : 'NORMAL',
        };
      })
      .filter((t) => t.title)
      .slice(0, 8);
  },

  /** Summarize a comment thread into a few crisp bullets. */
  async summarizeComments(comments: { author: string; text: string }[]): Promise<string> {
    if (!comments || comments.length === 0) {
      throw new Error('There are no comments to summarize');
    }

    const thread = comments
      .map((c) => `${c.author}: ${c.text}`)
      .join('\n')
      .slice(0, 6000);

    return chat(
      [
        {
          role: 'system',
          content:
            'Summarize the following task discussion into 2-4 short bullet points ' +
            'capturing decisions, blockers, and next steps. Be concise. ' +
            'Use "- " for each bullet. Do not add a preamble.',
        },
        { role: 'user', content: thread },
      ],
      300
    );
  },
};
