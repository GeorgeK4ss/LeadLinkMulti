import { PublicLayout } from "@/components/layout/PublicLayout";

export const metadata = {
  title: "Terms of Service - LeadLink CRM",
  description: "LeadLink CRM Terms of Service",
};

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="container py-16 md:py-20">
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: April 5, 2024</p>
          </div>

          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">1. Introduction</h2>
              <p className="text-muted-foreground">
                Welcome to LeadLink CRM ("Company", "we", "our", "us")! As you have just clicked our Terms of Service, please pause, grab a cup of coffee and carefully read the following pages. It will take you approximately 20 minutes.
              </p>
              <p className="text-muted-foreground">
                These Terms of Service ("Terms", "Terms of Service") govern your use of our web application LeadLink CRM (collectively or individually "Service") operated by LeadLink Inc.
              </p>
              <p className="text-muted-foreground">
                Our Privacy Policy also governs your use of our Service and explains how we collect, safeguard and disclose information that results from your use of our web pages. Please read it here: <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
              </p>
              <p className="text-muted-foreground">
                Your agreement with us includes these Terms and our Privacy Policy ("Agreements"). You acknowledge that you have read and understood Agreements, and agree to be bound by them.
              </p>
              <p className="text-muted-foreground">
                If you do not agree with (or cannot comply with) Agreements, then you may not use the Service, but please let us know by emailing at support@leadlink.com so we can try to find a solution. These Terms apply to all visitors, users and others who wish to access or use Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">2. Communications</h2>
              <p className="text-muted-foreground">
                By using our Service, you agree to subscribe to newsletters, marketing or promotional materials and other information we may send. However, you may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or instructions provided in any email we send.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">3. Purchases</h2>
              <p className="text-muted-foreground">
                If you wish to purchase any product or service made available through Service ("Purchase"), you may be asked to supply certain information relevant to your Purchase including, without limitation, your credit card number, the expiration date of your credit card, your billing address, and your shipping information.
              </p>
              <p className="text-muted-foreground">
                You represent and warrant that: (i) you have the legal right to use any credit card(s) or other payment method(s) in connection with any Purchase; and that (ii) the information you supply to us is true, correct and complete.
              </p>
              <p className="text-muted-foreground">
                We reserve the right to refuse or cancel your order at any time for reasons including but not limited to: product or service availability, errors in the description or price of the product or service, error in your order or other reasons.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">4. Subscriptions</h2>
              <p className="text-muted-foreground">
                Some parts of Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles will be set depending on the type of subscription plan you select when purchasing a Subscription.
              </p>
              <p className="text-muted-foreground">
                At the end of each Billing Cycle, your Subscription will automatically renew under the exact same conditions unless you cancel it or LeadLink Inc. cancels it. You may cancel your Subscription renewal either through your online account management page or by contacting support@leadlink.com customer support team.
              </p>
              <p className="text-muted-foreground">
                A valid payment method is required to process the payment for your subscription. You shall provide LeadLink Inc. with accurate and complete billing information that may include but not limited to full name, address, state, postal or zip code, telephone number, and a valid payment method information. By submitting such payment information, you automatically authorize LeadLink Inc. to charge all Subscription fees incurred through your account to any such payment instruments.
              </p>
              <p className="text-muted-foreground">
                Should automatic billing fail to occur for any reason, LeadLink Inc. reserves the right to terminate your access to the Service with immediate effect.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">5. Free Trial</h2>
              <p className="text-muted-foreground">
                LeadLink Inc. may, at its sole discretion, offer a Subscription with a free trial for a limited period of time ("Free Trial").
              </p>
              <p className="text-muted-foreground">
                You may be required to enter your billing information in order to sign up for Free Trial.
              </p>
              <p className="text-muted-foreground">
                If you do enter your billing information when signing up for Free Trial, you will not be charged by LeadLink Inc. until Free Trial has expired. On the last day of Free Trial period, unless you cancelled your Subscription, you will be automatically charged the applicable Subscription fees for the type of Subscription you have selected.
              </p>
              <p className="text-muted-foreground">
                At any time and without notice, LeadLink Inc. reserves the right to (i) modify Terms of Service of Free Trial offer, or (ii) cancel such Free Trial offer.
              </p>
            </section>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
} 