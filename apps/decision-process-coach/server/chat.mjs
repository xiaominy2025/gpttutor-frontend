import { readFileSync } from 'node:fs';
import { TOOLS } from '../src/tools.mjs';
import { MAX_MESSAGES, MAX_MESSAGE_LENGTH } from '../src/limits.mjs';

const instructions = readFileSync(new URL('./prompts/v1.md', import.meta.url), 'utf8');
// A JSON string can use six bytes per UTF-16 code unit when escaped.
const MAX_BODY_BYTES = 6 * MAX_MESSAGES * MAX_MESSAGE_LENGTH + 2048;

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'questions', 'tools'],
  properties: {
    reply: { type: 'string' },
    questions: { type: 'array', maxItems: 3, items: { type: 'string' } },
    tools: {
      type: 'array',
      maxItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'reason'],
        properties: { id: { type: 'string', enum: Object.keys(TOOLS) }, reason: { type: 'string' } },
      },
    },
  },
};

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function validateMessages(messages) {
  const valid = Array.isArray(messages) && messages.length > 0
    && messages.length <= MAX_MESSAGES && messages.length % 2 === 1
    && messages.every((message, index) =>
      message?.role === (index % 2 === 0 ? 'user' : 'assistant')
      && typeof message.content === 'string' && message.content.trim()
      && message.content.length <= MAX_MESSAGE_LENGTH);
  if (!valid) throw new RequestError(400, 'Send a valid conversation ending in a user message.');
  return messages.map(({ role, content }) => ({ role, content: content.trim() }));
}

function validateReply(result) {
  const shortText = (value, limit) => typeof value === 'string' && value.trim() && value.length <= limit;
  if (!shortText(result?.reply, MAX_MESSAGE_LENGTH)
    || !Array.isArray(result.questions) || result.questions.length > 3
    || !result.questions.every(question => shortText(question, 180))
    || !Array.isArray(result.tools) || result.tools.length > 1
    || !result.tools.every(tool => Object.hasOwn(TOOLS, tool?.id) && shortText(tool.reason, 240))) {
    throw new Error('Invalid coach response');
  }
  return {
    reply: result.reply.trim(),
    questions: [...new Set(result.questions.map(question => question.trim()))],
    tools: result.tools.map(({ id, reason }) => ({ id, reason: reason.trim() })),
  };
}

export function createOpenAiCoach({ apiKey, model, fetchResponse = fetch }) {
  if (!apiKey?.trim() || !model?.trim()) {
    throw new Error('OpenAI mode requires PROCESS_COACH_OPENAI_API_KEY and PROCESS_COACH_OPENAI_MODEL.');
  }
  return async messages => {
    const response = await fetchResponse('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(18_000),
      body: JSON.stringify({
        model,
        instructions,
        input: messages,
        store: false,
        max_output_tokens: 900,
        text: { format: { type: 'json_schema', name: 'process_coach_reply', strict: true, schema } },
      }),
    });
    if (response.status === 429) {
      throw new RequestError(429, 'The coach has reached its usage limit. Try again later.');
    }
    if (!response.ok) throw new Error('Model request failed');
    const body = await response.json();
    if (body.status !== 'completed') throw new Error('Model response did not complete');
    const content = body.output.flatMap(item => item.type === 'message' ? item.content : []);
    return JSON.parse(content.filter(item => item.type === 'output_text').map(item => item.text).join(''));
  };
}

export async function mockCoach(messages) {
  const current = messages.at(-1).content;
  if (messages.length === 1) {
    return {
      reply: 'Start by defining what a good outcome would look like and when you need to decide. Which result would still matter a year from now, and which constraints are firm?',
      questions: [
        'How can I distinguish a real objective from a constraint?',
        'What would make an option worth testing first?',
      ],
      tools: [],
    };
  }
  return {
    reply: `Let’s connect “${current.slice(0, 150)}” to the decision you started with: “${messages[0].content.slice(0, 150)}”. Pick one uncertainty that could change your choice and identify a small, reversible way to learn about it. Decide who should review that evidence before you act.`,
    questions: [
      'Which uncertainty should I resolve first?',
      'How can I design a reversible test?',
    ],
    tools: [],
  };
}

async function readBody(request) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    length += chunk.length;
    if (length > MAX_BODY_BYTES) {
      request.resume();
      throw new RequestError(413, 'This conversation request is too large.');
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RequestError(400, 'Send a valid JSON conversation.');
  }
}

export function createChatHandler(coach) {
  return async (request, response) => {
    const send = (status, body) => {
      response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify(body));
    };
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return send(405, { error: 'Use POST to send a message.' });
    }
    if (request.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      return send(415, { error: 'Send the conversation as JSON.' });
    }
    try {
      const body = await readBody(request);
      const messages = validateMessages(body?.messages);
      return send(200, validateReply(await coach(messages)));
    } catch (error) {
      if (error instanceof RequestError) return send(error.status, { error: error.message });
      return send(502, { error: 'The coach could not reply. Try sending your message again.' });
    }
  };
}
