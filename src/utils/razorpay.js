/**
 * Lazily injects Razorpay's checkout.js (once) and resolves when window.Razorpay
 * is available. Rejects if the script fails to load.
 */
let loadingPromise = null;

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error("Razorpay failed to initialize"));
    };
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error("Couldn't load the payment gateway. Check your connection."));
    };
    document.body.appendChild(script);
  });
  return loadingPromise;
}

/**
 * Opens the Razorpay checkout for an order and resolves with the payment
 * handler response { razorpay_payment_id, razorpay_order_id, razorpay_signature }.
 * Rejects if the user dismisses the modal.
 */
export function openRazorpayCheckout({
  order,
  keyId,
  name,
  description,
  prefill,
  theme = { color: "#1763f5" },
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const Razorpay = await loadRazorpay();
      const rzp = new Razorpay({
        key: keyId,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name,
        description,
        prefill,
        theme,
        handler: (response) => resolve(response),
        modal: {
          ondismiss: () =>
            reject(new Error("Payment was cancelled before completion.")),
        },
      });
      rzp.on("payment.failed", (resp) =>
        reject(new Error(resp?.error?.description || "Payment failed.")),
      );
      rzp.open();
    } catch (e) {
      reject(e);
    }
  });
}
