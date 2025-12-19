'use server';

import { z } from 'zod';

const transferSchema = z.object({
  recipientId: z.string(),
  amount: z.number().positive(),
});

export async function makeTransfer(values: z.infer<typeof transferSchema>): Promise<{
  success: boolean;
  error?: string;
}> {
  const validation = transferSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }

  // In a real app, you would have logic here to:
  // 1. Authenticate the user
  // 2. Check if the user has sufficient balance
  // 3. Find the recipient by their ID
  // 4. Perform the database transaction to debit the sender and credit the recipient
  // 5. Record the transaction history

  console.log(
    `Simulating transfer of ₦${validation.data.amount} to ${validation.data.recipientId}`
  );

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate a potential error
  if (validation.data.recipientId === '0000') {
    return { success: false, error: 'This recipient is blocked.' };
  }

  return { success: true };
}
