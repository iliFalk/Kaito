
export async function* generateOpenAIChatStream(
  prompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  apiKey: string,
  baseUrl: string,
  model: string,
  temperature?: number
) {
  if (!baseUrl) {
    throw new Error("OpenAI API base URL is not configured.");
  }
  
  const response = await fetch(baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [...history, { role: 'user', content: prompt }],
      temperature: temperature ?? 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to get response reader');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.substring(6);
        if (data.trim() === '[DONE]') {
          return;
        }
        try {
          const json = JSON.parse(data);
          const content = json.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch (e) {
          console.error('Failed to parse stream chunk:', data, e);
        }
      }
    }
  }
}
