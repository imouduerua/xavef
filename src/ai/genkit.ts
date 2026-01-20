'use server';
import {genkit} from 'genkit';
// import {googleAI} from '@genkit-ai/google-genai';

// The googleAI() plugin is temporarily disabled to resolve a server-side
// authentication conflict that is preventing admin login.
export const ai = genkit({
  plugins: [],
  // model: 'googleai/gemini-2.5-flash', // Temporarily removed to debug auth conflict
});
