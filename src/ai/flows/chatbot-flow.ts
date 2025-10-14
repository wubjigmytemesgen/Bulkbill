
'use server';

/**
 * @fileOverview A customer support chatbot that answers questions based on project documentation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { dbGetAllKnowledgeBaseArticles } from '@/lib/db-queries';
import {
  ChatbotRequestSchema,
  ChatbotResponseSchema,
  type ChatbotRequest,
  type ChatbotResponse
} from './chatbot-flow-types';

// This function retrieves the content from the knowledge base articles in the database.
const getDocumentationContext = async (): Promise<string> => {
    try {
        const articles: any[] = await dbGetAllKnowledgeBaseArticles();
        if (!articles || articles.length === 0) {
            return "No knowledge base articles found.";
        }

        // Format the articles into a single string for the chatbot context
        const context = articles.map(article => {
            return `Article Title: ${article.title}\nArticle Content:\n${article.content}`;
        }).join('\n\n---\n\n');

        return context;
    } catch (error) {
        console.error("Error reading documentation from database:", error);
        // Return a fallback message if the documentation can't be read.
        return "The application documentation is currently unavailable.";
    }
};

const documentationChatbot = ai.definePrompt({
    name: 'documentationChatbot',
    input: { schema: z.object({ query: z.string(), context: z.string() }) },
    output: { schema: ChatbotResponseSchema },
    system: `You are a helpful assistant for the AAWSA Billing Portal application. Your role is to answer user questions based ONLY on the provided knowledge base articles.

    - Be concise and clear in your answers.
    - If the answer is not in the knowledge base, say "I'm sorry, I don't have information about that in my knowledge base."
    - Do not make up answers or provide information not found in the context.
    - Format your answers with markdown for readability (e.g., use bullet points for lists, bold for key terms).
    - The user is a staff member, so address them professionally.`,
    prompt: `Context from Knowledge Base Articles:
    {{{context}}}
    
    User's Question:
    "{{{query}}}"`,
});

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotRequestSchema,
    outputSchema: ChatbotResponseSchema,
  },
  async ({ query }) => {
    const context = await getDocumentationContext();
    
    const response = await documentationChatbot({
        query,
        context,
    });
    
    if (!response || !response.output) {
      console.error("Chatbot AI response is missing output for query:", query);
      return { answer: "I'm sorry, I encountered an error and cannot answer at this time." };
    }

    return response.output;
  }
);

// This is the exported function that the UI will call.
export async function askChatbot(input: ChatbotRequest): Promise<ChatbotResponse> {
  return chatbotFlow(input);
}
