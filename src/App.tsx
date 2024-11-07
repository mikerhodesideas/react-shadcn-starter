// src/App.tsx
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { router } from "./Router"; // Assuming this is where your router is defined

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;