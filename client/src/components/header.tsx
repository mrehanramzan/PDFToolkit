import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="backdrop-blur-lg bg-card/80 shadow-lg border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-2 rounded-lg shadow-lg">
                <i className="fas fa-file-pdf text-xl"></i>
              </div>
              <h1 className="text-xl font-bold text-white">DocuCraft</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-gray-300 hover:text-primary font-medium transition-colors">
                Tools
              </a>
              <a href="#" className="text-gray-300 hover:text-primary font-medium transition-colors">
                Templates
              </a>
              <a href="#" className="text-gray-300 hover:text-primary font-medium transition-colors">
                Pricing
              </a>
              <a href="#" className="text-gray-300 hover:text-primary font-medium transition-colors">
                Help
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-300 hover:text-primary transition-colors">
              <i className="fas fa-bell"></i>
            </button>
            <Button className="gradient-button text-white font-medium shadow-lg">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
