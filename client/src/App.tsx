import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import PdfEditor from "@/pages/pdf-editor";
import PdfEditorCanvas from "@/pages/pdf-editor-canvas";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/editor/:tool">
        {(params) => <PdfEditor tool={params.tool} />}
      </Route>
      <Route path="/canvas-editor" component={PdfEditorCanvas} />
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
