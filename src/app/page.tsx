"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MainNavbar } from "@/components/layout/MainNavbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  
  // Direct navigation handler to ensure buttons work
  const navigateTo = (path: string) => {
    // Use window.location for guaranteed navigation
    window.location.href = path;
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <MainNavbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 animate-fade-in">
              <Badge variant="secondary" className="mb-4">
                Lead Management Simplified
              </Badge>
              <h1 className="text-4xl font-bold tracking-tighter md:text-5xl/tight lg:text-6xl/tight xl:text-7xl/tight">
                Transform Your Lead Management Process
              </h1>
              <p className="mt-4 text-xl text-muted-foreground">
                LeadLink CRM helps you capture, organize, and convert leads with powerful tools designed for modern businesses.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/register" passHref>
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
                  >
                    Get Started
                  </Button>
                </Link>
                
                {/* Original button kept */}
                <Link href="/contact" passHref>
                  <Button 
                    variant="outline"
                    className="h-11 px-8"
                  >
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="relative mx-auto aspect-video overflow-hidden rounded-xl shadow-xl md:w-full">
                <img
                  src="/placeholder-dashboard.svg"
                  alt="Dashboard Preview"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 gradient-text">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage and convert leads effectively
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="glass hover-card-effect p-6 rounded-lg animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="text-xl font-semibold mb-3 gradient-text">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 gradient-text">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that's right for your business
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`glass hover-card-effect p-6 rounded-lg animate-scale-in ${
                  plan.featured ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.featured && (
                  <Badge className="mb-3">Most Popular</Badge>
                )}
                <h3 className="text-xl font-bold gradient-text mb-2">{plan.title}</h3>
                <div className="flex items-baseline mt-2">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground ml-1">/month</span>
                </div>
                <p className="text-muted-foreground mt-2 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <svg className="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => navigateTo('/register')}
                  className={`relative z-10 w-full py-3 rounded-md text-sm font-medium ${
                    plan.featured 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-background text-primary hover:bg-muted border border-primary'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 gradient-text">
              What Our Customers Say
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Trusted by businesses of all sizes
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <div 
                key={index} 
                className="glass hover-card-effect p-6 rounded-lg animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4">
                  <h4 className="text-lg font-semibold">{testimonial.name}</h4>
                  <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                </div>
                <p className="text-muted-foreground italic">{testimonial.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Transform Your Lead Management?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using LeadLink CRM to grow their customer base
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigateTo('/register')}
              className="relative z-10 bg-background text-primary hover:bg-background/90 px-6 py-3 rounded-md text-center font-medium"
            >
              Get Started Now
            </button>
            <button
              onClick={() => navigateTo('/contact')}
              className="relative z-10 bg-transparent hover:bg-primary-foreground/10 text-primary-foreground border border-primary-foreground px-6 py-3 rounded-md text-center font-medium"
            >
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12 relative z-20">
        <div className="container mx-auto px-4 relative z-30">
          <div className="grid md:grid-cols-4 gap-8 relative z-40">
            <div>
              <h3 className="text-lg font-bold mb-4 gradient-text">LeadLink CRM</h3>
              <p className="text-muted-foreground">
                The complete solution for lead management and conversion.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/features"
                    className="block text-muted-foreground hover:text-primary transition-colors pointer-events-auto"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="/pricing"
                    className="block text-muted-foreground hover:text-primary transition-colors pointer-events-auto"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="/integrations"
                    className="block text-muted-foreground hover:text-primary transition-colors pointer-events-auto"
                  >
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/about"
                    className="block text-muted-foreground hover:text-primary transition-colors pointer-events-auto"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="block text-muted-foreground hover:text-primary transition-colors pointer-events-auto"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="/careers"
                    className="block text-muted-foreground hover:text-primary transition-colors pointer-events-auto"
                  >
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/terms"
                    className="block text-muted-foreground hover:text-primary transition-colors pointer-events-auto"
                  >
                    Terms
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy"
                    className="block text-muted-foreground hover:text-primary transition-colors pointer-events-auto"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="/cookies"
                    className="block text-muted-foreground hover:text-primary transition-colors pointer-events-auto"
                  >
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 mt-12 pt-8 text-center text-muted-foreground">
            <p>© 2024 LeadLink CRM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Lead Capture",
    description: "Capture leads from multiple sources with customizable forms and integrations.",
  },
  {
    title: "Lead Scoring",
    description: "Automatically score leads based on engagement and behavior.",
  },
  {
    title: "Workflow Automation",
    description: "Automate your sales process with customizable workflows.",
  },
  {
    title: "Multi-tenant Support",
    description: "Manage multiple organizations with secure data isolation.",
  },
  {
    title: "Analytics & Reporting",
    description: "Get insights into your sales pipeline with detailed analytics.",
  },
  {
    title: "Integration Hub",
    description: "Connect with your favorite tools and services seamlessly.",
  },
];

const pricingPlans = [
  {
    title: "Starter",
    price: "49",
    description: "Perfect for small businesses getting started with lead management",
    features: [
      "Up to 1,000 leads",
      "Basic lead scoring",
      "Email integration",
      "Standard support",
      "Basic analytics",
    ],
  },
  {
    title: "Professional",
    price: "99",
    description: "For growing teams that need more power and flexibility",
    featured: true,
    features: [
      "Up to 10,000 leads",
      "Advanced lead scoring",
      "Email & CRM integration",
      "Priority support",
      "Advanced analytics",
      "Custom workflows",
    ],
  },
  {
    title: "Enterprise",
    price: "249",
    description: "For large organizations with complex requirements",
    features: [
      "Unlimited leads",
      "Custom lead scoring",
      "Full API access",
      "24/7 premium support",
      "Custom analytics",
      "Advanced security",
      "SLA guarantee",
    ],
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Sales Director at TechCorp",
    content: "LeadLink has transformed how we manage our sales pipeline. The automation features have saved us countless hours.",
  },
  {
    name: "Michael Chen",
    role: "CEO at GrowthStart",
    content: "The multi-tenant support is exactly what we needed. Now we can manage all our client accounts efficiently.",
  },
  {
    name: "Emily Rodriguez",
    role: "Marketing Manager at ScaleUp",
    content: "The integration capabilities are fantastic. It works seamlessly with all our existing tools.",
  },
]; 
