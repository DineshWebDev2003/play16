declare module 'react-native-razorpay' {
  export interface RazorpayCheckoutOptions {
    key: string;
    amount: number;
    currency: string;
    order_id?: string;
    name?: string;
    description?: string;
    image?: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    theme?: {
      color?: string;
      backdrop_color?: string;
    };
    notes?: Record<string, unknown>;
  }

  export interface RazorpayPaymentResponse {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }

  export interface RazorpayError {
    code: string | number;
    description: string;
    field?: string;
    source?: string;
    step?: string;
    reason?: string;
  }

  const RazorpayCheckout: {
    open(
      options: RazorpayCheckoutOptions,
      successCallback?: (data: RazorpayPaymentResponse) => void,
      errorCallback?: (error: RazorpayError) => void
    ): Promise<RazorpayPaymentResponse>;
    onExternalWalletSelection: (callback: (data: unknown) => void) => void;
  };

  export default RazorpayCheckout;
}