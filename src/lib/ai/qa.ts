import { GoogleGenAI } from '@google/genai';
import type { IdentifiedComponent } from './schemas';

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const QA_MODEL = process.env.GEMINI_QA_MODEL ?? 'gemini-2.5-flash';

export interface QaMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_INSTRUCTION = `You are a senior electronics engineer answering follow-up questions about a specific identified component. You have already provided the initial identification. The user is now asking deeper questions.

## How to respond

- Be concise and accurate. Three to six sentences is usually right.
- Explain like you're talking to an Electronic & Computer Engineering student — assume basic circuit knowledge.
- If a question requires data you don't know with confidence, say so plainly rather than guess.
- Format responses as plain prose with simple line breaks between paragraphs. Use simple dashes for lists. Do not use Markdown bold, headers, or fenced code blocks.
- For circuit examples, describe the topology in words plus a simple ASCII sketch if useful.
- Stay focused on this component and adjacent electronics topics. Politely decline unrelated questions.

## What to draw on

You have the full identification JSON in context: the part name, markings, specifications, package, typical uses, alternatives. Use that as ground truth. If the user asks something the JSON already answers, reference it briefly rather than restating verbatim.`;

function buildContext(component: IdentifiedComponent): string {
  return `## Identified component

${JSON.stringify(component, null, 2)}`;
}

export async function* streamComponentQa(
  component: IdentifiedComponent,
  history: QaMessage[],
  question: string,
): AsyncGenerator<string, void, unknown> {
  const context = buildContext(component);

  const contents = [
    {
      role: 'user' as const,
      parts: [{ text: context }],
    },
    {
      role: 'model' as const,
      parts: [
        {
          text: `I have the identification details for ${component.identifiedAs}. What would you like to know about it?`,
        },
      ],
    },
    ...history.map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: m.content }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: question }],
    },
  ];

  const stream = await genAI.models.generateContentStream({
    model: QA_MODEL,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.4,
      maxOutputTokens: 1024,
    },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}