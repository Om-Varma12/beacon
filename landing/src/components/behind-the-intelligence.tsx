export function BehindTheIntelligence() {
  return (
    <section className="min-h-screen py-24 px-margin-md border-b border-outline/20 snap-start flex items-center">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[600px]">
          <div className="md:col-span-2 md:row-span-2 border border-outline/20 p-8 bg-white flex flex-col justify-between relative overflow-hidden">
            <div>
              <h3 className="font-display-lg text-3xl text-primary mb-4">Multi-Agent Debate</h3>
              <p className="text-sm max-w-sm opacity-70">Proprietary LLM orchestration where agents challenge each other's biases to arrive at statistically superior project concepts.</p>
            </div>
            <div className="h-40 w-full bg-surface-container flex items-center justify-center border-t border-outline/10">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary animate-bounce" />
                <div className="w-8 h-8 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-8 h-8 rounded-full bg-tertiary animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
          <div className="border border-outline/20 p-6 bg-white hover:bg-surface-container transition-colors">
            <h4 className="font-technical-label text-xs text-primary mb-2">01 // DISCOVERY</h4>
            <p className="font-headline-md text-lg">Hackathon Discovery</p>
          </div>
          <div className="border border-outline/20 p-6 bg-white hover:bg-surface-container transition-colors">
            <h4 className="font-technical-label text-xs text-primary mb-2">02 // EVAL</h4>
            <p className="font-headline-md text-lg">Theme Evaluation</p>
          </div>
          <div className="border border-outline/20 p-6 bg-white hover:bg-surface-container transition-colors">
            <h4 className="font-technical-label text-xs text-primary mb-2">03 // PROD</h4>
            <p className="font-headline-md text-lg">Submission Generator</p>
          </div>
          <div className="border border-outline/20 p-6 bg-white hover:bg-surface-container transition-colors">
            <h4 className="font-technical-label text-xs text-primary mb-2">04 // TEMPLATE</h4>
            <p className="font-headline-md text-lg">Template Detection</p>
          </div>
        </div>
      </div>
    </section>
  )
}
