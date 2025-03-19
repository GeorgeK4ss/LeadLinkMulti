"use client";

export function MainNavbar() {
  return (
    <header className="fixed w-full top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/40">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <a href="/" className="text-2xl font-bold gradient-text relative z-50 pointer-events-auto">
          LeadLink
        </a>
        <nav className="hidden md:flex space-x-8">
          <a href="/" className="text-sm font-medium hover:text-primary transition-colors relative z-50 pointer-events-auto">
            Home
          </a>
          <a href="/examples" className="text-sm font-medium hover:text-primary transition-colors relative z-50 pointer-events-auto">
            Examples
          </a>
          <a href="/about" className="text-sm font-medium hover:text-primary transition-colors relative z-50 pointer-events-auto">
            About
          </a>
          <a href="/pricing" className="text-sm font-medium hover:text-primary transition-colors relative z-50 pointer-events-auto">
            Pricing
          </a>
          <a href="/contact" className="text-sm font-medium hover:text-primary transition-colors relative z-50 pointer-events-auto">
            Contact
          </a>
        </nav>
        <div className="flex items-center space-x-4">
          <a 
            href="/login" 
            className="relative z-50 pointer-events-auto inline-flex h-9 items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
          >
            Sign In
          </a>
          <a 
            href="/register" 
            className="relative z-50 pointer-events-auto inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            Sign Up
          </a>
        </div>
      </div>
    </header>
  );
} 