export default function ContactTestPage() {
  return (
    <div className="container py-16">
      <h1 className="text-3xl font-bold mb-6">Contact Us (Test Page)</h1>
      <p className="mb-8">This is a minimal test page with no heavy components.</p>
      
      <div className="max-w-md mx-auto p-6 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Send us a message</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded" 
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              className="w-full p-2 border rounded" 
              placeholder="Your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea 
              className="w-full p-2 border rounded min-h-[120px]" 
              placeholder="Your message"
            ></textarea>
          </div>
          <button 
            type="button" 
            className="w-full py-2 px-4 bg-blue-600 text-white rounded font-medium"
          >
            Send Message
          </button>
        </form>
      </div>
      
      <div className="mt-8 text-center">
        <a href="/" className="text-blue-600 underline">Back to Home</a>
      </div>
    </div>
  );
} 