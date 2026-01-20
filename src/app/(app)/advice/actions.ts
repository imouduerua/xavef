"use server";

import {
  // getPersonalizedFinancialAdvice, // Temporarily disabled
  type FinancialSituation,
} from "@/ai/flows/personalized-financial-advice";

export async function generateAdvice(input: FinancialSituation): Promise<{
  success: boolean;
  advice?: string;
  error?: string;
}> {
  // The AI features are temporarily disabled to resolve a server authentication issue.
  return {
    success: false,
    error: "The AI Advisor is temporarily unavailable. Please try again later.",
  };
  /*
  try {
    const result = await getPersonalizedFinancialAdvice(input);
    if (!result || !result.advice) {
        throw new Error("AI failed to generate a response.");
    }
    return { success: true, advice: result.advice };
  } catch (error) {
    console.error("Error generating financial advice:", error);
    return {
      success: false,
      error:
        "Failed to generate advice at this time. Please check your input or try again later.",
    };
  }
  */
}
