'use server';

export async function makeTransfer(data: {
  recipientId: string;
  amount: number;
}): Promise<{ success: boolean; error?: string }> {
  console.log('Attempted transfer to another user:', data);
  // This feature is complex and requires secure, server-side logic
  // which is not fully implemented yet.
  return {
    success: false,
    error: 'Transferring funds to another user is not enabled at this time.',
  };
}
