import { NextPage } from 'next';

// Declare a module for Next.js types
declare module 'next' {
  export interface PageProps {
    params?: Record<string, string>;
    searchParams?: Record<string, string | string[] | undefined>;
  }
}

// Define our own PageProps type
export interface AppPageProps<T = {}> {
  params: T;
  searchParams?: Record<string, string | string[] | undefined>;
} 