export default function Footer() {
  return (
    <footer className="bg-card border-t border-border text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-2 rounded-lg shadow-lg">
                <i className="fas fa-file-pdf text-xl"></i>
              </div>
              <h3 className="text-xl font-bold">DocuCraft</h3>
            </div>
            <p className="text-muted-foreground mb-4">Professional PDF editing tools for modern workflows</p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-blue-400 transition-colors">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-blue-400 transition-colors">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-blue-400 transition-colors">
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">PDF Editor</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Converter Tools</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">API Access</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Enterprise</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Status Page</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 mt-8 text-center text-muted-foreground">
          <p>&copy; 2024 DocuCraft. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
