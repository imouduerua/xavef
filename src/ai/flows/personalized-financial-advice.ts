'use server';

/**
 * @fileOverview Personalized financial advice flow.
 *
 * This flow provides personalized financial advice based on a user's savings and loan activities.
 * It takes a description of the user's financial situation as input and returns financial advice.
 *
 * @param {FinancialSituation} input - The user's financial situation, including savings and loan activities.
 * @returns {Promise<FinancialAdvice>} - Personalized financial advice.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const FinancialSituationSchema = z.object({
  savingsBalance: z.number().describe('The user\'s savings account balance.'),
  loanBalance: z.number().describe('The user\'s outstanding loan balance.'),
  loanInterestRate: z.number().describe('The interest rate on the user\'s loan.'),
  monthlyIncome: z.number().describe('The user\'s monthly income.'),
  monthlyExpenses: z.number().describe('The user\'s monthly expenses.'),
  financialGoals: z.string().describe('The user\'s financial goals.'),
});

export type FinancialSituation = z.infer<typeof FinancialSituationSchema>;

// Define the output schema
const FinancialAdviceSchema = z.object({
  advice: z.string().describe('Personalized financial advice for the user.'),
});

export type FinancialAdvice = z.infer<typeof FinancialAdviceSchema>;

// Define the financial advice flow
export async function getPersonalizedFinancialAdvice(input: FinancialSituation): Promise<FinancialAdvice> {
  if (!ai) {
    throw new Error('AI service is not configured.');
  }
  return personalizedFinancialAdviceFlow(input);
}

const personalizedFinancialAdvicePrompt = ai.definePrompt({
  name: 'personalizedFinancialAdvicePrompt',
  input: {schema: FinancialSituationSchema},
  output: {schema: FinancialAdviceSchema},
  prompt: `You are a financial advisor. Provide personalized financial advice to the user based on their financial situation.

  Savings Balance: {{savingsBalance}}
  Loan Balance: {{loanBalance}}
  Loan Interest Rate: {{loanInterestRate}}
  Monthly Income: {{monthlyIncome}}
  Monthly Expenses: {{monthlyExpenses}}
  Financial Goals: {{financialGoals}}

  Give advice on how they can improve their financial situation and achieve their goals.
  Focus on actionable steps they can take.
  Provide context to your suggestions and encourage financial responsibility.
  Limit your advice to 2-3 key points for clarity.
  If the user has not provided sufficient information, politely request more details to provide better guidance.
  `,
});

const personalizedFinancialAdviceFlow = ai.defineFlow(
  {
    name: 'personalizedFinancialAdviceFlow',
    inputSchema: FinancialSituationSchema,
    outputSchema: FinancialAdviceSchema,
  },
  async input => {
    const {output} = await personalizedFinancialAdvicePrompt(input);
    if (!output) {
      throw new Error('Failed to generate financial advice.');
    }
    return output;
  }
);
