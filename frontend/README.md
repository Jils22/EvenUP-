# EvenUP Frontend

React + TypeScript + Vite frontend for the EvenUP expense-sharing application.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Application runs on `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint checks

## 📁 Project Structure

```
src/
├── api/           # API client functions and mutations
├── assets/        # Images, fonts, etc.
├── charts/        # Chart components (Recharts)
├── components/    # Reusable React components
├── context/       # Context providers (Auth, Theme, Toast)
├── hooks/         # Custom React hooks
├── layout/        # Layout components
├── lib/           # Utility functions
├── pages/         # Page components
├── types/         # TypeScript type definitions
├── utils/         # Helper functions
├── App.tsx        # Root component
├── main.tsx       # Entry point
└── index.css      # Global styles
```

## 🎨 Technologies

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **React Router v7** - Client routing
- **React Query** - Server state management
- **Tailwind CSS v4** - Styling
- **Lucide Icons** - Icon library
- **Recharts** - Data visualization
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Axios** - HTTP client

## 🔌 API Integration

All API calls go through `/src/api/client.ts`. The dev server is configured to proxy API requests to the backend:

```typescript
// Example API call
const response = await apiClient.get('/groups');
```

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=EvenUP
VITE_API_TIMEOUT=30000
```

## 🧪 Code Quality

### Linting
```bash
npm run lint
```

### TypeScript Checking
The project uses strict TypeScript checks. All components should:
- Have proper type definitions
- Export typed props interfaces
- Use `as const` for literal types

## 🚀 Building for Production

1. Build the project:
   ```bash
   npm run build
   ```

2. Output is in `dist/` directory

3. Deploy to hosting platforms:
   - **Vercel**: Push to GitHub, auto-deploys
   - **Netlify**: Connect Git repo, auto-deploys
   - **Static hosting**: Upload `dist/` folder

## 🔒 Authentication

- JWT tokens stored in localStorage
- Protected routes via `ProtectedRoute` component
- Auth context provides user state globally
- Token automatically included in API headers

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Tailwind CSS utilities for responsive design

## 🐛 Debugging

1. **Development Tools**
   - React DevTools extension (Chrome/Firefox)
   - Redux DevTools for state inspection

2. **Network Debugging**
   - Browser DevTools Network tab
   - Check API calls in Frontend → Backend flow

3. **Console Errors**
   - Check browser console for errors
   - Enable verbose logging if needed

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 🤝 Development Tips

1. **Component Organization**
   - Keep components small and focused
   - Use custom hooks for logic
   - Co-locate related files

2. **State Management**
   - Use React Context for global state
   - Use React Query for server state
   - Use useState for local component state

3. **Styling**
   - Use Tailwind CSS utilities
   - Avoid custom CSS when possible
   - Use `cn()` utility for conditional classes

4. **API Calls**
   - Use React Query hooks
   - Handle loading and error states
   - Provide user feedback via toasts
