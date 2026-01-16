
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const firestore = admin.firestore();
const messaging = admin.messaging();

interface Transaction {
  status: 'Pending' | 'Completed' | 'Failed';
  type: 'Deposit' | 'Withdrawal' | 'Loan Payment' | 'Interest' | 'Group Contribution' | 'Group Payout' | 'Internal Transfer';
  amount: number;
  userEmail: string;
  targetAccount?: 'solidara' | 'annual';
}

// This function is now DEPRECATED because the logic has been moved to a Next.js Server Action
// in src/app/(admin)/admin/actions.ts for a more modern, secure, and robust implementation.
export const updateTransactionStatus = functions.https.onCall(async (data, context) => {
    throw new functions.https.HttpsError('unimplemented', 'This function is deprecated. Please use the new server action.');
});

export const notifyAdminOnPendingTransaction = functions.firestore
  .document('users/{userId}/transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const transaction = snap.data() as Transaction;

    // Check if the new transaction is pending
    if (transaction.status !== 'Pending') {
      return null;
    }

    try {
      // Get all admin users
      const adminsSnapshot = await firestore.collection('admins').get();
      if (adminsSnapshot.empty) {
        console.log('No admins found to notify.');
        return null;
      }

      const adminUids = adminsSnapshot.docs.map(doc => doc.id);
      const notificationPromises: Promise<any>[] = [];
      const fcmTokens: string[] = [];

       // Fetch FCM tokens for all admins
      for (const adminUid of adminUids) {
          const tokenDoc = await firestore.collection('fcmTokens').doc(adminUid).get();
          if (tokenDoc.exists) {
              const tokenData = tokenDoc.data();
              if (tokenData?.token) {
                fcmTokens.push(tokenData.token);
              }
          }
      }

      const amountFormatted = (transaction.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // Create a notification for each admin
      adminUids.forEach(adminUid => {
        const notificationRef = firestore.collection(`users/${adminUid}/notifications`).doc();
        const notificationData = {
          userId: adminUid,
          title: `New Pending ${transaction.type}`,
          description: `A ${transaction.type.toLowerCase()} of ₦${amountFormatted} from ${transaction.userEmail} requires approval.`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
          actionUrl: '/admin/transactions?tab=pending'
        };
        notificationPromises.push(notificationRef.set(notificationData));
      });

      await Promise.all(notificationPromises);
      console.log(`Notified ${adminUids.length} admin(s) of new pending transaction.`);
      
      // Send push notifications
      if (fcmTokens.length > 0) {
          const message: admin.messaging.MulticastMessage = {
              notification: {
                  title: `New Pending ${transaction.type}`,
                  body: `A ${transaction.type.toLowerCase()} of ₦${amountFormatted} from ${transaction.userEmail} requires approval.`,
              },
              webpush: {
                  fcmOptions: {
                      link: '/admin/transactions?tab=pending'
                  }
              },
              tokens: fcmTokens,
          };

          const response = await messaging.sendEachForMulticast(message);
          console.log(`Sent ${response.successCount} push notifications successfully.`);
          if (response.failureCount > 0) {
             response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error('Failure sending notification to token:', fcmTokens[idx], resp.error);
                }
             });
          }
      }
      
      return null;
    } catch (error) {
      console.error('Error sending notification to admins:', error);
      return null;
    }
  });
