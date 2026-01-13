
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
  // Check if the user is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const adminDoc = await firestore.collection('admins').doc(context.auth.uid).get();
  if (!adminDoc.exists && context.auth.token.email !== 'admin@xavef.com') {
      throw new functions.https.HttpsError('permission-denied', 'This function can only be called by an admin.');
  }

  const { transactionPath, newStatus } = data;
  if (!transactionPath || !newStatus || !['Completed', 'Failed'].includes(newStatus)) {
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with "transactionPath" and "newStatus" arguments.');
  }

  const transactionRef = firestore.doc(transactionPath);
  const userRef = transactionRef.parent.parent;

  if (!userRef) {
      throw new functions.https.HttpsError('internal', 'Could not determine user from transaction path.');
  }

  try {
    await firestore.runTransaction(async (t) => {
      const txDoc = await t.get(transactionRef);

      if (!txDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Transaction document not found.');
      }

      const txData = txDoc.data() as Transaction;
      if (txData.status !== 'Pending') {
        throw new functions.https.HttpsError('failed-precondition', 'Transaction has already been processed.');
      }
      
      // Update transaction status
      t.update(transactionRef, { status: newStatus });

      // Update balances if completed
      if (newStatus === 'Completed') {
        const amount = txData.amount;
        
        if (txData.type === 'Deposit') {
          const targetBalanceField = txData.targetAccount === 'annual' ? 'annualBalance' : 'solidaraBalance';
          if (targetBalanceField === 'annualBalance') {
              t.update(userRef, { annualBalance: admin.firestore.FieldValue.increment(amount) });
          } else {
              t.update(userRef, { solidaraBalance: admin.firestore.FieldValue.increment(amount) });
          }
        } else if (txData.type === 'Withdrawal') {
          // On withdrawal, the amount is positive, so we make it negative for the increment.
          t.update(userRef, { solidaraBalance: admin.firestore.FieldValue.increment(-amount) });
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error in updateTransactionStatus callable function:", error);
    // Re-throw as an HttpsError to be caught by the client
    if (error instanceof functions.https.HttpsError) {
        throw error;
    }
    throw new functions.https.HttpsError('internal', error.message || "An unknown error occurred during the transaction.");
  }
});
