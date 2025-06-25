import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import PdfEditor from "@/pages/pdf-editor";
import AdvancedPdfEditor from "@/pages/advanced-pdf-editor";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/editor/:tool">
        {(params) => <PdfEditor tool={params.tool} />}
      </Route>
      <Route path="/advanced-editor" component={AdvancedPdfEditor} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
