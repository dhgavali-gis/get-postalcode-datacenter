# Technology Stack

## Build System & Framework
- **Vite**: Modern build tool with React SWC plugin for fast development
- **React 18**: Main UI framework with TypeScript support
- **TypeScript**: Strict typing with relaxed configuration for rapid development

## UI & Styling
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Radix UI**: Headless component primitives for accessibility
- **Lucide React**: Icon library for consistent iconography

## State Management & Data
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with Zod validation
- **React Router DOM**: Client-side routing

## Development Tools
- **ESLint**: Code linting with TypeScript support
- **PostCSS**: CSS processing with Autoprefixer
- **Lovable Tagger**: Development mode component tagging

## Deployment
- **GitHub Pages**: Static site hosting
- **Base Path**: `/get-postalcode-datacenter/` for GitHub Pages deployment

## Common Commands

### Development
```bash
npm run dev          # Start development server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Deployment
```bash
npm run predeploy    # Build before deploy
npm run deploy       # Deploy to GitHub Pages
```

## Configuration Notes
- TypeScript config allows implicit any and unused parameters for rapid prototyping
- Vite configured with `@` alias pointing to `src/` directory
- Tailwind uses CSS variables for theming with dark mode support
- Component library follows shadcn/ui conventions with `@/components/ui` structure