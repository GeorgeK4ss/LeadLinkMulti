# Cursor Development Rules for LeadLink CRM

This document outlines the development rules and guidelines enforced by Cursor for the LeadLink CRM project. These rules ensure consistency, security, and best practices across the codebase.

## Rule Categories

### 1. General Development Rules
- Prevents hardcoded values
- Enforces consistent component structure
- Mandates proper error handling
- Applies to all TypeScript/JavaScript files

### 2. Security Rules
- Ensures Firebase security rules implementation
- Enforces API rate limiting
- Applies to all TypeScript files

### 3. Performance Rules
- Requires lazy loading for large components
- Mandates skeleton loading for data-dependent components
- Monitors performance optimization

### 4. Database Rules
- Enforces multi-tenant data isolation
- Requires query optimization
- Applies to services and library files

### 5. Component Rules
- Mandates Shadcn UI component usage
- Requires typed props for all components
- Applies to component files

### 6. Monitoring Rules
- Enforces error tracking implementation
- Requires performance monitoring
- Applies to all TypeScript files

### 7. Backup Rules
- Ensures proper backup verification
- Applies to service files

### 8. Testing Rules
- Mandates test coverage for critical paths
- Applies to test files

### 9. TypeScript Rules
- Enforces strict typing
- Requires proper interface naming
- Applies to all TypeScript files

## Global Settings

The following settings are enforced globally:
- Consistent imports
- Error boundaries
- Performance guidelines
- Security measures

## Usage

These rules are automatically enforced by Cursor during development. Violations will be highlighted in your editor with appropriate severity levels (error/warning).

## Rule Patterns

Each rule category uses specific patterns to match files:
- TypeScript/JavaScript: `**/*.{ts,tsx,js,jsx}`
- Component files: `**/components/**/*.tsx`
- Service files: `**/services/**/*.ts`
- Test files: `**/*.test.{ts,tsx}`, `**/*.spec.{ts,tsx}`

## Error Severity

Rules are marked with different severity levels:
- Error: Must be fixed before committing
- Warning: Should be reviewed but won't block commits

## Best Practices

1. Always use environment variables for configuration
2. Implement proper error handling with try-catch blocks
3. Use Shadcn UI components when available
4. Ensure proper tenant isolation in database queries
5. Implement monitoring for critical operations
6. Verify backups regularly
7. Maintain comprehensive test coverage

## Maintenance

The rules are version controlled and can be updated as needed. Changes to rules should be reviewed by the team lead before implementation. 