
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const firestore = admin.firestore();

interface Transaction {
  status: 'Pending' | 'Completed' | 'Failed';
  type: 'Deposit' | 'Withdrawal';
  amount: number;
  targetAccount?: 'solidara' | 'annual';
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
  if (!transactionPath || typeof transactionPath !== 'string' || !newStatus || !['Completed', 'Failed'].includes(newStatus)) {
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a valid "transactionPath" and "newStatus".');
  }

  const transactionRef = firestore.doc(transactionPath);
  const userRef = transactionRef.parent.parent;

  if (!userRef || userRef.parent.id !== 'users') {
      throw new functions.https.HttpsError('invalid-argument', 'Could not determine a valid user from the transaction path.');
  }

  // 3. Firestore Transaction
  try {
    await firestore.runTransaction(async (t) => {
      const txDoc = await t.get(transactionRef);
      const userDoc = await t.get(userRef);

      if (!txDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Transaction document not found.');
      }
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', `User document not found for user ID: ${userRef.id}`);
      }

      const txData = txDoc.data() as Transaction;

      if (txData.status !== 'Pending') {
        // This transaction has already been processed, so we can just stop.
        // It's not an error, just a duplicate request.
        console.log(`Transaction ${transactionRef.id} has already been processed. Current status: ${txData.status}`);
        return; 
      }
      
      // Action 1: Always update the transaction status.
      t.update(transactionRef, { status: newStatus });

      // Action 2: If approved ('Completed'), update the user's balance.
      if (newStatus === 'Completed') {
        const amount = txData.amount;
        
        if (txData.type === 'Deposit') {
          const targetBalanceField = txData.targetAccount === 'annual' ? 'annualBalance' : 'solidaraBalance';
          // Use explicit if/else to avoid dynamic keys unsupported in this context
          if (targetBalanceField === 'annualBalance') {
              t.update(userRef, { annualBalance: admin.firestore.FieldValue.increment(amount) });
          } else {
              t.update(userRef, { solidaraBalance: admin.firestore.FieldValue.increment(amount) });
          }
        } else if (txData.type === 'Withdrawal') {
          // On withdrawal, the transaction `amount` is positive. We debit the account, so we increment by a negative value.
          t.update(userRef, { solidaraBalance: admin.firestore.FieldValue.increment(-amount) });
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    // 4. Detailed Error Logging and Response
    console.error("Error in updateTransactionStatus callable function:", {
        errorMessage: error.message,
        errorCode: error.code,
        transactionPath: transactionPath,
        newStatus: newStatus,
        adminUid: context.auth.uid
    });
    
    // Re-throw as an HttpsError to be caught by the client
    if (error instanceof functions.https.HttpsError) {
        throw error;
    }
    throw new functions.https.HttpsError('internal', error.message || "An unknown server error occurred during the transaction.");
  }
});
