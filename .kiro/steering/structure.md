# Project Structure

## Root Directory Organization
```
├── src/                    # Source code
├── public/                 # Static assets
├── dist/                   # Build output
├── .kiro/                  # Kiro configuration and steering
├── .vscode/                # VS Code settings
└── node_modules/           # Dependencies
```

## Source Code Structure (`src/`)
```
src/
├── components/             # React components
│   ├── ui/                # shadcn/ui component library
│   └── DatabaseCenter.tsx # Main application component
├── pages/                 # Route components
│   ├── Index.tsx          # Home page
│   └── NotFound.tsx       # 404 page
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── App.tsx                # Root application component
├── main.tsx               # Application entry point
├── index.css              # Global styles and CSS variables
└── vite-env.d.ts          # Vite type definitions
```

## Component Organization

### UI Components (`src/components/ui/`)
- Follow shadcn/ui conventions
- Each component in its own file
- Export default component and types
- Use Radix UI primitives as base
- Implement design system tokens via CSS variables

### Application Components (`src/components/`)
- Business logic components
- Import UI components from `@/components/ui`
- Use TypeScript interfaces for props
- Follow React functional component patterns

### Pages (`src/pages/`)
- Route-level components
- Handle page-specific logic and layout
- Import and compose smaller components

## Import Conventions
- Use `@/` alias for src imports: `@/components/ui/button`
- Relative imports for same-directory files
- Group imports: external libraries, internal components, types

## File Naming
- PascalCase for React components: `DatabaseCenter.tsx`
- kebab-case for UI components: `alert-dialog.tsx`
- camelCase for utilities and hooks: `use-toast.ts`

## Styling Approach
- Tailwind utility classes for styling
- CSS variables for theme tokens in `index.css`
- Component-specific styles via Tailwind classes
- Dark mode support through CSS variable system

## Configuration Files
- `components.json`: shadcn/ui configuration
- `tailwind.config.ts`: Tailwind and design system setup
- `vite.config.ts`: Build configuration with aliases
- `tsconfig.json`: TypeScript configuration with path mapping