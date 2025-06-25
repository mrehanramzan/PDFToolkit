export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechCorp",
      avatar: "SJ",
      content: "DocuCraft has revolutionized how we handle PDF documents. The speed and quality are unmatched!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Legal Assistant",
      company: "Law Firm LLC",
      avatar: "MC",
      content: "The security features give us peace of mind when handling sensitive legal documents.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Project Manager",
      company: "StartupXYZ",
      avatar: "ER",
      content: "Simple, fast, and reliable. DocuCraft is now part of our daily workflow.",
      rating: 5
    }
  ];

  return (
    <section className="mb-12">
      <h3 className="text-3xl font-bold text-foreground mb-8 text-center">
        Trusted by Professionals Worldwide
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="bg-card rounded-xl p-6 border border-border backdrop-blur-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4">
                {testimonial.avatar}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                <p className="text-sm text-muted-foreground">{testimonial.role} at {testimonial.company}</p>
              </div>
            </div>
            
            <div className="flex mb-3">
              {Array.from({ length: testimonial.rating }, (_, i) => (
                <i key={i} className="fas fa-star text-yellow-400 text-sm"></i>
              ))}
            </div>
            
            <p className="text-muted-foreground italic">"{testimonial.content}"</p>
          </div>
        ))}
      </div>
    </section>
  );
}