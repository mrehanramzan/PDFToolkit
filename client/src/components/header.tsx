import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-white p-2 rounded-lg">
                <i className="fas fa-file-pdf text-xl"></i>
              </div>
              <h1 className="text-xl font-bold text-slate-900">DocuCraft</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-slate-600 hover:text-primary font-medium transition-colors">
                Tools
              </a>
              <a href="#" className="text-slate-600 hover:text-primary font-medium transition-colors">
                Templates
              </a>
              <a href="#" className="text-slate-600 hover:text-primary font-medium transition-colors">
                Pricing
              </a>
              <a href="#" className="text-slate-600 hover:text-primary font-medium transition-colors">
                Help
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-slate-600 hover:text-primary transition-colors">
              <i className="fas fa-bell"></i>
            </button>
            <Button className="bg-primary text-white hover:bg-blue-700 font-medium">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
