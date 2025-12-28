
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const fcm = admin.messaging();

/**
 * Sends a push notification to all admins when a new transaction
 * is created with a "Pending" status.
 */
export const onNewPendingTransaction = functions.firestore
  .document("users/{userId}/transactions/{transactionId}")
  .onCreate(async (snapshot, context) => {
    const transaction = snapshot.data();

    // Exit if the transaction is not pending
    if (transaction.status !== "Pending") {
      return null;
    }

    const amount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(transaction.amount);

    // Get all admin FCM tokens from the /fcmTokens collection
    const tokensSnapshot = await db.collection("fcmTokens").get();
    if (tokensSnapshot.empty) {
      functions.logger.log("No FCM tokens found for any admins.");
      return null;
    }

    const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

    // Notification payload
    const payload = {
      notification: {
        title: "New Pending Transaction",
        body: `A new ${transaction.type} of ${amount} is awaiting approval.`,
        icon: "/xavef-logo-512.png", // Public URL to an icon
        click_action: `https://${process.env.GCLOUD_PROJECT}.web.app/admin/pending-transactions`,
      },
    };
    
    functions.logger.log("Sending notification to tokens:", tokens);

    // Send notification to all tokens
    const response = await fcm.sendToDevice(tokens, payload);

    functions.logger.log("FCM response:", response);

    // Optional: Clean up stale tokens
    const tokensToRemove: Promise<any>[] = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        functions.logger.error(
          "Failure sending notification to",
          tokens[index],
          error
        );
        // Cleanup the tokens who are not registered anymore.
        if (
          error.code === "messaging/invalid-registration-token" ||
          error.code === "messaging/registration-token-not-registered"
        ) {
          const tokenId = tokensSnapshot.docs[index].id;
          tokensToRemove.push(db.collection("fcmTokens").doc(tokenId).delete());
        }
      }
    });

    return Promise.all(tokensToRemove);
  });
