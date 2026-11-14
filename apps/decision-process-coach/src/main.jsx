import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MAX_MESSAGES, MAX_MESSAGE_LENGTH } from './limits.mjs';
import { TOOLS } from './tools.mjs';
import './styles.css';

const starters = [
  'Help me frame a decision',
  'Help me compare my options',
  'Help me decide what to test first',
];

function DecisionProcessCoach() {
  const [turns, setTurns] = useState([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState('');
  const [failure, setFailure] = useState(null);
  const input = useRef(null);
  const activeRequest = useRef(null);
  const latest = turns.at(-1);

  async function send(text) {
    const content = text.trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH || activeRequest.current) return;

    const request = new AbortController();
    activeRequest.current = request;
    setDraft('');
    setFailure(null);
    setPending(content);
    input.current.focus();

    const retained = turns.length <= (MAX_MESSAGES - 1) / 2
      ? turns
      : [turns[0], ...turns.slice(-((MAX_MESSAGES - 3) / 2))];
    const messages = retained.flatMap(turn => [
      { role: 'user', content: turn.user },
      { role: 'assistant', content: turn.reply },
    ]);
    messages.push({ role: 'user', content });

    try {
      const response = await fetch('/api/decision-process/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(22_000)]),
      });
      const reply = await response.json();
      if (!response.ok) throw new Error(reply.error);
      if (activeRequest.current === request) setTurns(previous => [...previous, { ...reply, user: content }]);
    } catch {
      if (activeRequest.current === request) setFailure({ content });
    } finally {
      if (activeRequest.current === request) {
        activeRequest.current = null;
        setPending('');
      }
    }
  }

  function reset() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setTurns([]);
    setDraft('');
    setFailure(null);
    setPending('');
    input.current.focus();
  }

  function chooseStarter(prompt) {
    setDraft(`${prompt}. My decision is `);
    input.current.focus();
  }

  return (
    <>
      <header className="site-header">
        <div className="wordmark"><span className="brand-mark" aria-hidden="true" />Engent Labs</div>
        {(turns.length > 0 || pending || failure) && (
          <button type="button" className="reset" onClick={reset}>New conversation</button>
        )}
      </header>
      <main className="workspace">
        <header className="intro">
          <h1>Decision Process Coach</h1>
          <p>Make decisions systematically.</p>
        </header>

        <div className="conversation" role="log" aria-label="Conversation">
          {turns.map((turn, index) => (
            <React.Fragment key={index}>
              <div className="message user-message"><span>You</span><p>{turn.user}</p></div>
              <div className="message coach-message">
                <span>Coach</span><p>{turn.reply}</p>
                {turn.tools.map(tool => (
                  <div key={tool.id} className="tool"><strong>{TOOLS[tool.id]}</strong><p>{tool.reason}</p></div>
                ))}
              </div>
            </React.Fragment>
          ))}
          {pending && <div className="message user-message"><span>You</span><p>{pending}</p></div>}
        </div>
        {pending && <p role="status" className="status">Coach is preparing a reply…</p>}

        {failure && (
          <div className="failure">
            <p role="alert">The coach couldn’t reply. Your message is available to retry.</p>
            <button type="button" onClick={() => send(failure.content)}>Retry message</button>
            <button type="button" onClick={() => {
              setDraft(failure.content);
              setFailure(null);
              input.current.focus();
            }}>Edit message</button>
          </div>
        )}

        {!latest && !pending && !failure && (
          <section className="welcome" aria-labelledby="welcome-title">
            <h2 id="welcome-title">What are you deciding?</h2>
            <p>Tell me what you’re weighing and what matters most.</p>
            <div className="suggestions">
              {starters.map(prompt => <button type="button" key={prompt} onClick={() => chooseStarter(prompt)}>{prompt}</button>)}
            </div>
          </section>
        )}

        {latest?.questions.length > 0 && !pending && !failure && (
          <section className="follow-ups" aria-label="Suggested follow-up questions">
            <h2>Continue the conversation</h2>
            <div className="suggestions">
              {latest.questions.map(question => <button type="button" key={question} onClick={() => send(question)}>{question}</button>)}
            </div>
          </section>
        )}

        <form className="composer" onSubmit={event => { event.preventDefault(); send(draft); }}>
          <label htmlFor="message" className="sr-only">Your message</label>
          <textarea
            id="message"
            ref={input}
            rows={2}
            value={draft}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Describe your decision or ask a follow-up…"
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                send(draft);
              }
            }}
          />
          <button className="send" disabled={!draft.trim() || Boolean(pending)}>Send</button>
        </form>
        <p className="ownership">Use the coach to examine your options. You own the decision.</p>
      </main>
    </>
  );
}

createRoot(document.getElementById('root')).render(<DecisionProcessCoach />);
