import wwOutline from "@assets/WaterwayWellness_WWOutline_Seafoam_1778255372780.png";
import throwUpDub from "@assets/ThrowUpTheDub_Horizontal_Seafoam_1778255326346.png";

export function Footer() {
  return (
    <footer className="bg-background py-24 px-6 md:px-12 lg:px-24 border-t border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
        <div>
          <img src={throwUpDub} alt="Throw Up The Dub" className="h-12 w-auto mb-8 opacity-80" />
          <h3 className="text-3xl md:text-5xl font-bold text-foreground mb-4 max-w-md leading-tight">
            See you Monday.
          </h3>
          <p className="text-muted-foreground max-w-sm text-lg">
            Meaningful social connections through Fort Lauderdale, Florida — The Dub Movement Est. 2025.
          </p>
        </div>
        
        <div className="flex flex-col md:items-end justify-between">
          <div className="flex flex-col gap-4 text-left md:text-right">
            <a href="https://instagram.com/waterway.wellness" target="_blank" rel="noopener noreferrer" className="text-2xl font-medium text-foreground hover:text-primary transition-colors" data-testid="link-footer-ig">
              @waterway.wellness
            </a>
            <a href="mailto:hello@waterwaywellness.org" className="text-lg text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-email">
              waterwaywellness.org
            </a>
          </div>
          
          <div className="mt-12 flex items-center gap-4 opacity-50">
            <img src={wwOutline} alt="WW Icon" className="h-8 w-auto" />
            <span className="text-sm font-medium tracking-widest uppercase">Est. 2025</span>
          </div>
        </div>
      </div>
      
      {/* Decorative large logo in background */}
      <div className="absolute -bottom-24 -right-24 opacity-5 pointer-events-none">
        <img src={wwOutline} alt="" className="w-[600px] h-[600px] object-contain" />
      </div>
    </footer>
  );
}
