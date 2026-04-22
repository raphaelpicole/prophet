import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const db = admin.firestore();

// Lazy-initialize Stripe to allow env var to be set at runtime
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new functions.https.HttpsError("internal", "STRIPE_SECRET_KEY not configured");
    _stripe = new Stripe(key, { apiVersion: "2024-06-20" });
  }
  return _stripe;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getUserDoc(uid: string) {
  const doc = await db.collection("users").doc(uid).get();
  if (!doc.exists) throw new functions.https.HttpsError("not-found", `User doc not found: ${uid}`);
  return doc;
}

function requireAuth(authUid: string | undefined, paramUid: string): string {
  if (!authUid) throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  if (authUid !== paramUid) throw new functions.https.HttpsError("permission-denied", "Access denied");
  return paramUid;
}

/** Retrieves or creates a Stripe Customer for the given user. */
async function getOrCreateStripeCustomer(
  stripe: Stripe,
  uid: string,
  email: string | null
): Promise<string> {
  const userDoc = await getUserDoc(uid);
  const data = userDoc.data()!;

  if (data.stripeCustomerId) return data.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { firebaseUid: uid },
  });

  await db.collection("users").doc(uid).update({
    stripeCustomerId: customer.id,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return customer.id;
}

// ─── API Endpoints ─────────────────────────────────────────────────────────────

/**
 * POST /api/create-checkout-session
 * Body: { uid: string }
 * Returns: { url: string }
 *
 * Creates a Stripe Checkout Session for the Pro plan and returns the URL.
 * Requires ID token from Firebase Auth sent in Authorization header (Bearer token).
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "Authentication required");

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) throw new functions.https.HttpsError("internal", "STRIPE_PRO_PRICE_ID not configured");

  const userDoc = await getUserDoc(uid);
  const userEmail = userDoc.data()!.email ?? undefined;

  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(stripe, uid, userEmail);

  const baseUrl = process.env.STRIPE_SUCCESS_URL ?? "https://prophet-olive.vercel.app";
  const cancelUrl = `${baseUrl}/subscription?canceled=true`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: { firebaseUid: uid },
    subscription_data: {
      metadata: { firebaseUid: uid },
    },
  });

  functions.logger.info(`Checkout session created for uid=${uid}, sessionId=${session.id}`);
  return { url: session.url };
});

/**
 * POST /api/create-portal-session
 * Body: { uid: string, returnUrl?: string }
 * Returns: { url: string }
 *
 * Opens Stripe Customer Portal so users can manage/cancel their subscription.
 */
export const createPortalSession = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "Authentication required");

  const returnUrl = data?.returnUrl ?? "https://prophet-olive.vercel.app/subscription";

  const userDoc = await getUserDoc(uid);
  const stripeCustomerId = userDoc.data()!.stripeCustomerId;
  if (!stripeCustomerId) throw new functions.https.HttpsError("failed-precondition", "No Stripe customer found");

  const stripe = getStripe();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  functions.logger.info(`Portal session created for uid=${uid}`);
  return { url: portalSession.url };
});

/**
 * GET /api/subscription-status?uid=<uid>
 * Returns: { plan: 'free'|'pro', expiresAt: string|null, subscriptionStatus: string|null }
 *
 * Checks subscription status from Firestore (authoritative) and Stripe (live status).
 */
export const getSubscriptionStatus = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "Authentication required");

  const userDoc = await getUserDoc(uid);
  const userData = userDoc.data()!;

  const plan = userData.plan ?? "free";
  const expiresAt = userData.expiresAt
    ? (userData.expiresAt.toDate?.() ?? new Date(userData.expiresAt)).toISOString()
    : null;
  const subscriptionStatus = userData.subscriptionStatus ?? null;

  // If user has a live subscriptionId, verify with Stripe in case it changed
  if (plan === "pro" && userData.subscriptionId) {
    try {
      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(userData.subscriptionId);
      const stripeStatus = sub.status; // active, trialing, past_due, canceled, etc.

      if (stripeStatus !== "active" && stripeStatus !== "trialing") {
        // Subscription is no longer active — downgrade to free
        await db.collection("users").doc(uid).update({
          plan: "free",
          subscriptionStatus: stripeStatus,
          expiresAt: null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { plan: "free", expiresAt: null, subscriptionStatus: stripeStatus };
      }
    } catch {
      // Stripe call failed — trust Firestore
    }
  }

  return { plan, expiresAt, subscriptionStatus };
});

// ─── Webhook ───────────────────────────────────────────────────────────────────

/**
 * POST /api/webhook
 * Raw body required — registered as Firebase Functions v2 with raw body.
 *
 * Handles Stripe webhook events:
 *  - checkout.session.completed → activate pro plan
 *  - customer.subscription.updated → sync status
 *  - customer.subscription.deleted → revoke pro plan
 */
export const webhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripe();

  if (!sig || !webhookSecret) {
    functions.logger.error("Webhook missing signature or secret");
    res.status(400).send("Missing stripe-signature header or webhook secret");
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    functions.logger.error("Webhook signature verification failed", { error: err });
    res.status(400).send(`Webhook signature verification failed`);
    return;
  }

  functions.logger.info(`Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.firebaseUid;
        const subscriptionId = session.subscription as string;

        if (!uid) {
          functions.logger.warn("checkout.session.completed missing firebaseUid metadata");
          break;
        }

        // Retrieve full subscription details for period end
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

        await db.collection("users").doc(uid).update({
          plan: "pro",
          subscriptionId,
          subscriptionStatus: "active",
          expiresAt: admin.firestore.Timestamp.fromDate(currentPeriodEnd),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info(`User ${uid} upgraded to pro, subscriptionId=${subscriptionId}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const uid = sub.metadata.firebaseUid;

        if (!uid) {
          functions.logger.warn("subscription.updated missing firebaseUid metadata");
          break;
        }

        const isActive = sub.status === "active" || sub.status === "trialing";
        const currentPeriodEnd = new Date(sub.current_period_end * 1000);

        await db.collection("users").doc(uid).update({
          plan: isActive ? "pro" : "free",
          subscriptionStatus: sub.status,
          expiresAt: admin.firestore.Timestamp.fromDate(currentPeriodEnd),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info(`User ${uid} subscription updated: status=${sub.status}, plan=${isActive ? "pro" : "free"}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const uid = sub.metadata.firebaseUid;

        if (!uid) {
          functions.logger.warn("subscription.deleted missing firebaseUid metadata");
          break;
        }

        await db.collection("users").doc(uid).update({
          plan: "free",
          subscriptionId: null,
          subscriptionStatus: "canceled",
          expiresAt: null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info(`User ${uid} subscription deleted — downgraded to free`);
        break;
      }

      default:
        functions.logger.info(`Unhandled webhook event type: ${event.type}`);
    }
  } catch (err) {
    functions.logger.error(`Error processing webhook event ${event.type}`, { error: err });
    res.status(500).send("Internal error processing webhook");
    return;
  }

  res.json({ received: true });
});
