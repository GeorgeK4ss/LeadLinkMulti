import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Pricing - LeadLink CRM",
  description: "LeadLink CRM pricing plans and features",
};

export default function PricingPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-muted/40 py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h1>
            <p className="text-xl text-muted-foreground">
              Choose the plan that's right for your business. All plans include a 14-day free trial.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.title} 
                className={`flex flex-col ${plan.featured ? 'border-primary shadow-lg relative overflow-hidden' : ''}`}
              >
                {plan.featured && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-bl-md rounded-tr-md rounded-br-none rounded-tl-none m-0 px-3 py-1.5">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.title}</CardTitle>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <CardDescription className="mt-3">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">What's included:</h4>
                    <ul className="space-y-3 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.nonFeatures && (
                      <>
                        <h4 className="text-sm font-medium pt-4">Not included:</h4>
                        <ul className="space-y-3 text-sm">
                          {plan.nonFeatures.map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                              <X className="h-4 w-4" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/register" passHref className="w-full">
                    <Button 
                      className="w-full" 
                      variant={plan.featured ? "default" : "outline"}
                      size="lg"
                    >
                      Start Free Trial
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="bg-muted/40 py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter">Compare Plans</h2>
              <p className="text-muted-foreground">
                A detailed comparison of all features available in each plan
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-3 font-medium">Feature</th>
                    <th className="text-center py-4 px-3 font-medium">Starter</th>
                    <th className="text-center py-4 px-3 font-medium">Professional</th>
                    <th className="text-center py-4 px-3 font-medium">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((feature, index) => (
                    <tr key={feature.name} className={index % 2 === 0 ? "bg-background" : ""}>
                      <td className="py-3 px-3 font-medium">{feature.name}</td>
                      <td className="py-3 px-3 text-center">
                        {feature.starter ? 
                          typeof feature.starter === 'string' ? 
                            feature.starter : 
                            <Check className="h-4 w-4 mx-auto text-primary" /> : 
                          <X className="h-4 w-4 mx-auto text-muted-foreground" />}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {feature.professional ? 
                          typeof feature.professional === 'string' ? 
                            feature.professional : 
                            <Check className="h-4 w-4 mx-auto text-primary" /> : 
                          <X className="h-4 w-4 mx-auto text-muted-foreground" />}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {feature.enterprise ? 
                          typeof feature.enterprise === 'string' ? 
                            feature.enterprise : 
                            <Check className="h-4 w-4 mx-auto text-primary" /> : 
                          <X className="h-4 w-4 mx-auto text-muted-foreground" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">
                Everything you need to know about our pricing plans
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question} className="space-y-2">
                  <h3 className="text-xl font-bold">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/40 py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of businesses using LeadLink CRM to manage and convert leads.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" passHref>
                <Button size="lg">Start Your Free Trial</Button>
              </Link>
              <Link href="/contact" passHref>
                <Button size="lg" variant="outline">Contact Sales</Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground pt-4">
              No credit card required. 14-day free trial.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

const pricingPlans = [
  {
    title: "Starter",
    price: 29,
    description: "Perfect for small businesses and startups",
    features: [
      "Up to 1,000 leads",
      "2 team members",
      "Basic lead scoring",
      "Standard reports",
      "Email support",
      "Data export",
      "1GB storage",
    ],
    nonFeatures: [
      "Advanced lead scoring",
      "Custom reporting",
      "Workflow automation",
      "API access",
    ],
    featured: false,
  },
  {
    title: "Professional",
    price: 79,
    description: "Ideal for growing businesses",
    features: [
      "Up to 10,000 leads",
      "10 team members",
      "Advanced lead scoring",
      "Custom reports",
      "Priority support",
      "Workflow automation",
      "Data export & import",
      "5GB storage",
      "Team performance tracking",
    ],
    nonFeatures: [
      "Dedicated account manager",
      "Custom integrations",
      "Enterprise API rate limits",
    ],
    featured: true,
  },
  {
    title: "Enterprise",
    price: 199,
    description: "For large organizations with complex needs",
    features: [
      "Unlimited leads",
      "Unlimited team members",
      "Advanced lead scoring",
      "Custom reports & dashboards",
      "24/7 priority support",
      "Workflow automation",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "50GB storage",
      "Advanced security features",
      "SSO authentication",
    ],
    featured: false,
  },
];

const featureComparison = [
  {
    name: "Lead management",
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    name: "Team members",
    starter: "2",
    professional: "10",
    enterprise: "Unlimited",
  },
  {
    name: "Leads",
    starter: "1,000",
    professional: "10,000",
    enterprise: "Unlimited",
  },
  {
    name: "Storage",
    starter: "1GB",
    professional: "5GB",
    enterprise: "50GB",
  },
  {
    name: "Lead scoring",
    starter: "Basic",
    professional: "Advanced",
    enterprise: "Advanced",
  },
  {
    name: "Custom reporting",
    starter: false,
    professional: true,
    enterprise: true,
  },
  {
    name: "Workflow automation",
    starter: false,
    professional: true,
    enterprise: true,
  },
  {
    name: "API access",
    starter: false,
    professional: "Limited",
    enterprise: "Full",
  },
  {
    name: "Dedicated account manager",
    starter: false,
    professional: false,
    enterprise: true,
  },
  {
    name: "Custom integrations",
    starter: false,
    professional: false,
    enterprise: true,
  },
  {
    name: "SSO authentication",
    starter: false,
    professional: false,
    enterprise: true,
  },
  {
    name: "Support",
    starter: "Email",
    professional: "Priority",
    enterprise: "24/7 Priority",
  },
];

const faqs = [
  {
    question: "Can I change plans later?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will take effect at the start of your next billing cycle.",
  },
  {
    question: "What happens when I exceed my lead limit?",
    answer: "You'll be notified when you reach 80% of your lead limit. You can choose to upgrade to a higher plan or remove some leads to stay within your limit.",
  },
  {
    question: "Do you offer annual billing?",
    answer: "Yes, we offer a 20% discount for annual billing on all plans. Contact our sales team to set up annual billing.",
  },
  {
    question: "Is there a setup fee?",
    answer: "No, there are no setup fees for any of our plans. You only pay the monthly or annual subscription fee.",
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel your subscription at any time. You'll still have access to your account until the end of your current billing period.",
  },
  {
    question: "Do you offer custom enterprise solutions?",
    answer: "Yes, for large organizations with specific requirements, we offer custom enterprise solutions. Contact our sales team to discuss your needs.",
  },
]; 