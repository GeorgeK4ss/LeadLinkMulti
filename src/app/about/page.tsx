import { PublicLayout } from "@/components/layout/PublicLayout";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "About Us - LeadLink CRM",
  description: "Learn about LeadLink CRM's mission, values, and team",
};

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-muted/40 py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">About LeadLink CRM</h1>
            <p className="text-xl text-muted-foreground">
              We're on a mission to make lead management simple, efficient, and effective for businesses of all sizes.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl space-y-12">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter">Our Story</h2>
                <p className="text-muted-foreground">
                  Founded in 2020, LeadLink CRM began with a simple observation: existing CRM systems were too complex, 
                  expensive, and difficult to use for small and medium-sized businesses.
                </p>
                <p className="text-muted-foreground">
                  Our founders, experienced in both sales and software development, set out to create a CRM that was 
                  powerful enough for enterprise-level needs but simple enough for anyone to use without extensive training.
                </p>
                <p className="text-muted-foreground">
                  Today, LeadLink CRM serves thousands of businesses across the globe, helping them capture, manage, 
                  and convert leads more effectively than ever before.
                </p>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-lg border shadow-xl">
                <div className="bg-primary/10 flex h-full w-full items-center justify-center">
                  <p className="text-muted-foreground p-6 text-center">Company Image Placeholder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-muted/40 py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl space-y-12">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter">Our Values</h2>
              <p className="text-muted-foreground">
                The principles that guide everything we do at LeadLink CRM
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((value) => (
                <Card key={value.title} className="bg-background">
                  <CardContent className="p-6 space-y-2">
                    <h3 className="text-xl font-bold">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl space-y-12">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter">Meet Our Team</h2>
              <p className="text-muted-foreground">
                The people behind LeadLink CRM
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member) => (
                <div key={member.name} className="space-y-3 text-center">
                  <div className="mx-auto aspect-square w-40 overflow-hidden rounded-full border-2 border-primary/20">
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <p className="text-muted-foreground text-xs">Photo Placeholder</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/40 py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl space-y-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter">Join Us on Our Mission</h2>
            <p className="text-muted-foreground">
              See how LeadLink CRM can transform your lead management process
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
              <Link href="/register" passHref>
                <Button size="lg" className="h-12">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/contact" passHref>
                <Button size="lg" variant="outline" className="h-12">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

const values = [
  {
    title: "Simplicity",
    description: "We believe powerful software shouldn't be complicated. We focus on intuitive design and ease of use.",
  },
  {
    title: "Transparency",
    description: "No hidden fees, no confusing features. We're open about what we do and how we do it.",
  },
  {
    title: "Customer Success",
    description: "Our success is measured by your success. We're committed to helping you achieve your goals.",
  },
  {
    title: "Innovation",
    description: "We constantly evolve our product to meet the changing needs of modern businesses.",
  },
  {
    title: "Integrity",
    description: "We do what we say and say what we do. Trust is the foundation of our business.",
  },
  {
    title: "Inclusivity",
    description: "We create tools that work for businesses of all sizes and industries, with no barriers to entry.",
  },
];

const team = [
  {
    name: "Sarah Johnson",
    role: "CEO & Co-Founder",
  },
  {
    name: "Michael Chen",
    role: "CTO & Co-Founder",
  },
  {
    name: "Jessica Williams",
    role: "Head of Product",
  },
  {
    name: "David Patel",
    role: "Lead Developer",
  },
  {
    name: "Emily Rodriguez",
    role: "Head of Customer Success",
  },
  {
    name: "Robert Kim",
    role: "Marketing Director",
  },
]; 