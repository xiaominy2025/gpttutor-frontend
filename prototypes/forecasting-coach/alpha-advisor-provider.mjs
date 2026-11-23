// Rates are integer micro-USD per million billed tokens. Charge all input
// at the approved conservative uncached/cache-write ceiling.
export function openAIAdvisorProvider({
  model, inputRate, outputRate, boundInputTokens, readCredential, fetcher = fetch
}) {
  if (!model || ![inputRate, outputRate].every(value => Number.isSafeInteger(value) && value > 0)) {
    throw new Error("Invalid Forecasting provider configuration.");
  }
  const price = (input, output) => Math.ceil((input * inputRate + output * outputRate) / 1_000_000);
  return {
    async plan(input, outputLimit) {
      const body = {
        model, input, max_output_tokens: outputLimit, store: false,
        service_tier: "default", reasoning: { effort: "none" }
      };
      const inputBound = await boundInputTokens(body);
      return { body, inputBound, reservation: price(inputBound, outputLimit) };
    },
    async prepare({ body }) {
      const credential = await readCredential();
      if (typeof credential !== "string" || !credential.trim()) throw new Error("Provider credential unavailable.");
      return () => dispatch(body, credential);
    }
  };

  async function dispatch(body, credential) {
    const response = await fetcher("https://api.openai.com/v1/responses", {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(15_000),
      headers: { Authorization: "Bearer " + credential, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error("Unconfirmed provider outcome.");
    const result = await response.json();
    const { input_tokens: input, output_tokens: output } = result.usage ?? {};
    if (![input, output].every(value => Number.isSafeInteger(value) && value >= 0)) {
      throw new Error("Unconfirmed provider usage.");
    }
    const draft = result.status === "completed" && Array.isArray(result.output)
      ? result.output.filter(item => item.type === "message" && item.role === "assistant")
        .flatMap(item => item.content ?? []).filter(part => part.type === "output_text")
        .map(part => part.text).join("\n").trim()
      : "";
    return { draft, cost: price(input, output), inputTokens: input, outputTokens: output };
  }
}
// The model tokenizes message content, not the JSON escapes used to transport it.
// Count each UTF-8 byte as a token and retain a fixed allowance for message framing.
export function boundAdvisorInputTokens({ input }) {
  return 256 + input.reduce((bytes, { content }) => bytes + Buffer.byteLength(content, "utf8"), 0);
}

