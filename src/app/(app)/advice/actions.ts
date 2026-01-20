"use server";

// We define a simple type here to avoid breaking the form after removing the AI flow.
export type FinancialSituation = {
  savingsBalance: number;
  loanBalance: number;
  loanInterestRate: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  financialGoals: string;
};


export async function generateAdvice(input: FinancialSituation): Promise<{
  success: boolean;
  advice?: string;
  error?: string;
}> {
  return {
    success: false,
    error: "The AI Advisor feature has been temporarily disabled to resolve a server issue. It will be re-enabled soon.",
  };
}
