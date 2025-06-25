export default function FeatureShowcase() {
  return (
    <section className="mb-12">
      <h3 className="text-3xl font-bold text-foreground mb-8 text-center">
        Powerful Features at Your Fingertips
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Feature Cards */}
        <div className="bg-card rounded-xl p-6 border border-border backdrop-blur-lg">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-3 rounded-lg w-fit mb-4">
            <i className="fas fa-tachometer-alt text-2xl"></i>
          </div>
          <h4 className="font-semibold text-foreground mb-2">Lightning Fast</h4>
          <p className="text-sm text-muted-foreground">Process files in seconds with our optimized algorithms</p>
        </div>
        
        <div className="bg-card rounded-xl p-6 border border-border backdrop-blur-lg">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-3 rounded-lg w-fit mb-4">
            <i className="fas fa-shield-alt text-2xl"></i>
          </div>
          <h4 className="font-semibold text-foreground mb-2">100% Secure</h4>
          <p className="text-sm text-muted-foreground">Your files are processed locally and never stored</p>
        </div>
        
        <div className="bg-card rounded-xl p-6 border border-border backdrop-blur-lg">
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-3 rounded-lg w-fit mb-4">
            <i className="fas fa-cloud text-2xl"></i>
          </div>
          <h4 className="font-semibold text-foreground mb-2">Cloud Ready</h4>
          <p className="text-sm text-muted-foreground">Access from anywhere, any device, anytime</p>
        </div>
        
        <div className="bg-card rounded-xl p-6 border border-border backdrop-blur-lg">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-3 rounded-lg w-fit mb-4">
            <i className="fas fa-magic text-2xl"></i>
          </div>
          <h4 className="font-semibold text-foreground mb-2">AI Powered</h4>
          <p className="text-sm text-muted-foreground">Smart compression and optimization algorithms</p>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-8 border border-border backdrop-blur-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">2M+</div>
            <div className="text-sm text-muted-foreground">Files Processed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">20+</div>
            <div className="text-sm text-muted-foreground">PDF Tools</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">50K+</div>
            <div className="text-sm text-muted-foreground">Happy Users</div>
          </div>
        </div>
      </div>
    </section>
  );
}