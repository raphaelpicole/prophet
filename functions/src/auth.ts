import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

/**
 * Firebase Auth Trigger — fires when a new user is created.
 * Creates a Firestore document in users/{uid} with plan:'free'.
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  try {
    await db.collection("users").doc(uid).set({
      email: email ?? null,
      displayName: displayName ?? null,
      photoURL: photoURL ?? null,
      plan: "free",
      stripeCustomerId: null,
      subscriptionId: null,
      subscriptionStatus: null,
      expiresAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info(`User document created for uid=${uid}, plan=free`);
  } catch (err) {
    functions.logger.error("Failed to create user document", { uid, error: err });
    throw err;
  }
});

/**
 * Firebase Auth Trigger — fires when a user is deleted.
 * Cleans up the corresponding Firestore document.
 */
export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;

  try {
    await db.collection("users").doc(uid).delete();
    functions.logger.info(`User document deleted for uid=${uid}`);
  } catch (err) {
    functions.logger.error("Failed to delete user document", { uid, error: err });
    throw err;
  }
});
