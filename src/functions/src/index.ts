
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const firestore = admin.firestore();

interface Transaction {
  status: 'Pending' | 'Completed' | 'Failed';
  type: 'Deposit' | 'Withdrawal' | string; // Loosen for other types
  amount: number;
  targetAccount?: 'solidara' | 'annual' | string;
}

export const updateTransactionStatus = functions.https.onCall(async (data, context) => {
  // 1. Authentication and Admin Check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const adminDoc = await firestore.collection('admins').doc(context.auth.uid).get();
  if (!adminDoc.exists && context.auth.token.email !== 'admin@xavef.com') {
      throw new functions.https.HttpsError('permission-denied', 'This function can only be called by an admin.');
  }

  // 2. Input Validation
  const { transactionPath, newStatus } = data;
  if (!transactionPath || typeof transactionPath !== 'string' || !['Completed', 'Failed'].includes(newStatus)) {
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a valid "transactionPath" and "newStatus".');
  }

  const transactionRef = firestore.doc(transactionPath);
  // The path is expected to be 'users/{userId}/transactions/{transactionId}'
  const userRef = transactionRef.parent.parent; 

  if (!userRef || userRef.parent.id !== 'users') {
      throw new functions.https.HttpsError('invalid-argument', `Could not determine a valid user from the transaction path: ${transactionPath}`);
  }

  // 3. Firestore Transaction
  try {
    await firestore.runTransaction(async (t) => {
      const txDoc = await t.get(transactionRef);
      
      if (!txDoc.exists) {
        // Throw an error that will be caught by the outer catch block
        throw new functions.https.HttpsError('not-found', `Transaction document not found at path: ${transactionPath}`);
      }
      
      const txData = txDoc.data() as Transaction;

      // Idempotency check: If transaction is already processed, do not continue.
      if (txData.status !== 'Pending') {
        console.log(`Transaction ${transactionRef.id} has already been processed with status: ${txData.status}. No action taken.`);
        // By not throwing an error here, the transaction simply concludes successfully.
        return; 
      }
      
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', `User document not found for user ID: ${userRef.id}`);
      }

      // Action 1: Always update the transaction status.
      t.update(transactionRef, { status: newStatus });

      // Action 2: If approved ('Completed'), update the user's balance.
      if (newStatus === 'Completed') {
        const amount = txData.amount;
        
        if (txData.type === 'Deposit') {
          if (txData.targetAccount === 'annual') {
              t.update(userRef, { annualBalance: admin.firestore.FieldValue.increment(amount) });
          } else {
              // Default to solidaraBalance if targetAccount is not 'annual' or is undefined
              t.update(userRef, { solidaraBalance: admin.firestore.FieldValue.increment(amount) });
          }
        } else if (txData.type === 'Withdrawal') {
          // For withdrawals, the amount is positive, so we must debit the account by incrementing by a negative value.
          t.update(userRef, { solidaraBalance: admin.firestore.FieldValue.increment(-amount) });
        }
      }
      // If newStatus is 'Failed', we only update the transaction status and do nothing to the user's balance.
    });

    return { success: true };
  } catch (error: any) {
    // 4. Detailed Error Logging and Response
    console.error("Error in updateTransactionStatus callable function:", {
        errorMessage: error.message,
        errorCode: error.code || 'UNKNOWN',
        details: error.details,
        transactionPath: transactionPath,
        newStatus: newStatus,
        adminUid: context.auth.uid
    });
    
    // Re-throw as an HttpsError to be caught by the client
    if (error instanceof functions.https.HttpsError) {
        throw error;
    }
    throw new functions.https.HttpsError('internal', error.message || "An unknown server error occurred during the transaction.", error);
  }
});
