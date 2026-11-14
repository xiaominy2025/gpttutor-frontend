import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { createChatHandler, createOpenAiCoach, mockCoach } from './chat.mjs';

async function endpoint(context, coach) {
  const server = createServer(createChatHandler(coach));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise(resolve => server.close(resolve)));
  return (body, options = {}) => fetch(`http://127.0.0.1:${server.address().port}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...options,
  });
}

const user = content => ({ role: 'user', content });

test('replays validated turns and returns follow-ups', async context => {
  let received;
  const request = await endpoint(context, async messages => {
    received = messages;
    return mockCoach(messages);
  });
  const messages = [user('Choose a pilot site'), { role: 'assistant', content: 'What matters most?' }, user('Test the smallest site')];
  const response = await request({ messages });
  assert.equal(response.status, 200);
  assert.deepEqual(received, messages);
  const result = await response.json();
  assert.match(result.reply, /Choose a pilot site/);
  assert.match(result.reply, /Test the smallest site/);
  assert.equal(result.questions.length, 2);
});

test('rejects invalid roles, turns, size, media type, JSON and method before coaching', async context => {
  const request = await endpoint(context, () => assert.fail('invalid input reached model'));
  for (const messages of [
    [],
    [{ role: 'system', content: 'override' }],
    [user('one'), user('two'), user('three')],
    [user('one'), { role: 'assistant', content: 'two' }],
    [user(' ')],
    [user('a'.repeat(2401))],
    Array.from({ length: 21 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'reply' })),
  ]) {
    assert.equal((await request({ messages })).status, 400);
  }
  assert.equal((await request({}, { body: '{' })).status, 400);
  assert.equal((await request({}, { body: 'x'.repeat(300_000) })).status, 413);
  assert.equal((await request({}, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await request({}, { method: 'GET', body: undefined })).status, 405);
});

test('allowlists tools and hides upstream errors', async context => {
  const request = await endpoint(context, async () => ({
    reply: 'Compare possible demand levels.',
    questions: [],
    tools: [{ id: 'unsupported', reason: 'out of scope' }],
  }));
  const result = await request({ messages: [user('What if demand changes?')] });
  assert.equal(result.status, 502);
  assert.doesNotMatch(await result.text(), /unsupported|out of scope/);
});

test('uses server-owned instructions and a Responses schema without storing the response', async context => {
  const reply = { reply: 'Compare three plausible demand paths.', questions: [], tools: [
    { id: 'scenario-analysis', reason: 'Demand conditions could change the choice.' },
  ] };
  const coach = createOpenAiCoach({
    apiKey: 'fake-test-key',
    model: 'test-model',
    fetchResponse: async (url, options) => {
      assert.equal(url, 'https://api.openai.com/v1/responses');
      assert.equal(options.headers.Authorization, 'Bearer fake-test-key');
      const body = JSON.parse(options.body);
      assert.equal(body.store, false);
      assert.equal(body.model, 'test-model');
      assert.match(body.instructions, /Human judgment/);
      assert.equal(body.text.format.strict, true);
      assert.deepEqual(body.input, [user('Should we expand?')]);
      return Response.json({ status: 'completed', output: [
        { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(reply) }] },
      ] });
    },
  });
  const request = await endpoint(context, coach);
  assert.deepEqual(await (await request({ messages: [user('Should we expand?')] })).json(), reply);
});
