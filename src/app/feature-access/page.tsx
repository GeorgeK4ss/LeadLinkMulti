import { redirect } from 'next/navigation';

export default function FeatureAccessRedirect() {
  redirect('/examples/feature-access');
  
  // This won't be rendered, but is here as a fallback
  return null;
} 