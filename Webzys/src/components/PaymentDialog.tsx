import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentService } from "@/services/payment.service";
import { RazorpayOrder } from "@/models/payment.model";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { WebsiteService } from "@/services/website.service";

// Price per page for export (in rupees) - should match Builder.tsx
const PRICE_PER_PAGE = 1;

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  websiteId: number;
  pageCount: number;
  amount: number;
}

const PaymentDialog = ({ open, onClose, onSuccess, websiteId, pageCount, amount }: PaymentDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if (!open) return;

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to load Razorpay payment gateway",
        variant: "destructive"
      });
    };

    if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      document.body.appendChild(script);
    } else {
      setRazorpayLoaded(true);
    }

    return () => {
      // Don't remove script on cleanup as it might be used elsewhere
    };
  }, [open, toast]);

  const handlePayment = async () => {
    if (!user || !razorpayLoaded) {
      toast({
        title: "Error",
        description: "Please wait for payment gateway to load",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const paymentService = new PaymentService();
      const order = await paymentService.createWebsiteExportOrder({
        website_id: websiteId,
        user_id: user.id,
        page_count: pageCount
      });

      // Get Razorpay key from response (from ApplicationSettings)
      // This matches the booking flow pattern where key comes from backend
      if (!order.key) {
        toast({
          title: "Configuration Error",
          description: "Razorpay key is not configured in Application Settings. Please contact support.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const options = {
        key: order.key, // Key from ApplicationSettings (via backend)
        amount: order.amount, // Amount in paise
        currency: order.currency || 'INR',
        name: 'Webzys',
        description: `Payment for ${pageCount} page${pageCount > 1 ? 's' : ''} export`,
        order_id: order.orderid, // Use orderid from response
        handler: async function (response: any) {
          setProcessing(true);
          try {
            // Mark payment as successful in database
            const websiteService = new WebsiteService();
            await websiteService.markExportPaymentSuccess({
              website_id: websiteId,
              order_id: response.razorpay_order_id || order.orderid
            });

            // Payment successful
            toast({
              title: "Payment Successful",
              description: "Your payment has been processed successfully. You can now export unlimited times!",
            });
            onSuccess();
            onClose();
          } catch (error: any) {
            console.error('Payment success handler error:', error);
            toast({
              title: "Payment Error",
              description: error?.response?.data?.message || error?.message || "Error processing payment",
              variant: "destructive"
            });
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: user.username || user.mobile || '',
          email: user.email || '',
          contact: user.mobile || '',
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error?.response?.data?.message || error?.message || "Failed to initiate payment",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md mx-4"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Payment Required</CardTitle>
                  <CardDescription>Complete payment to export your website</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={loading || processing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 rounded-lg border border-border bg-muted/50">
                <span className="text-sm font-medium text-muted-foreground">Pages</span>
                <span className="text-sm font-semibold">{pageCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg border border-border bg-muted/50">
                <span className="text-sm font-medium text-muted-foreground">Price per page</span>
                <span className="text-sm font-semibold">₹{PRICE_PER_PAGE}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-lg border-2 border-primary bg-primary/5">
                <span className="text-base font-semibold">Total Amount</span>
                <span className="text-2xl font-bold text-primary">₹{amount}</span>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button
                onClick={handlePayment}
                className="w-full"
                disabled={loading || processing || !razorpayLoaded}
                size="lg"
              >
                {loading || processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {processing ? 'Processing...' : 'Loading...'}
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ₹{amount}
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Razorpay
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentDialog;

