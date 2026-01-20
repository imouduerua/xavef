// import * as functions from "firebase-functions";
// import * as admin from "firebase-admin";

// admin.initializeApp();
// const firestore = admin.firestore();

// interface Transaction {
//   status: 'Pending' | 'Completed' | 'Failed';
//   type: 'Deposit' | 'Withdrawal';
//   amount: number;
//   targetAccount?: 'solidara' | 'annual';
// }

// // This function is now DEPRECATED because the logic has been moved to a Next.js Server Action
// // in src/app/(admin)/admin/actions.ts for a more modern, secure, and robust implementation.
// export const updateTransactionStatus = functions.https.onCall(async (data, context) => {
//     throw new functions.https.HttpsError('unimplemented', 'This function is deprecated. Please use the new server action.');
// });
