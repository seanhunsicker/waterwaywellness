import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Assets
import heroRunners from "@/assets/images/hero-runners.png";
import communityHangout from "@/assets/images/community-hangout.png";
import floridaVibes from "@/assets/images/florida-vibes.png";
import runClubWordmark from "@assets/WaterwayWellness_RunClub_Wordmark_Seafoam_1778255396810.png";
import badgeLogo from "@assets/tiny_version_1778255352779.png";
import throwUpDubIvory from "@assets/ThrowUpTheDub_Horizontal_Ivory_1778255332909.png";
import eventFlyer from "@assets/Location2_SOCIAL_9x16_1778255341413.jpg";
import wwOutline from "@assets/WaterwayWellness_WWOutline_Seafoam_1778255372780.png";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const yHero = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div className="bg-background min-h-[100dvh] w-full overflow-x-hidden selection:bg-primary selection:text-primary-foreground dark" ref={containerRef}>
      <Nav />
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[100dvh] flex items-center justify-center pt-20 overflow-hidden">
        <motion.div style={{ y: yHero }} className="absolute inset-0 z-0 opacity-40">
          <img src={heroRunners} alt="Runners at sunset" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </motion.div>

        <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center">
          <motion.img 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            src={runClubWordmark} 
            alt="Waterway Wellness Run Club" 
            className="w-full max-w-4xl h-auto mb-8 drop-shadow-2xl" 
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col items-center gap-6"
          >
            <p className="text-2xl md:text-3xl font-medium text-foreground max-w-2xl text-balance">
              We hate running so we started a run club.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground font-medium uppercase tracking-widest text-sm">
              <span>Fort Lauderdale</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Est. 2025</span>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce"
        >
          <div className="w-8 h-12 rounded-full border-2 border-primary/50 flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-primary rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* 2. THE VIBE / MISSION */}
      <section id="about" className="py-32 px-6 md:px-12 lg:px-24 bg-background relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          >
            <div className="order-2 lg:order-1 relative">
              <motion.div variants={fadeInUp} className="relative z-10 rounded-3xl overflow-hidden aspect-[4/3] bg-card border border-white/5">
                <img src={communityHangout} alt="Community hanging out" className="w-full h-full object-cover" />
              </motion.div>
              <motion.div 
                initial={{ rotate: -15, scale: 0.8, opacity: 0 }}
                whileInView={{ rotate: -5, scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="absolute -bottom-8 -left-8 w-32 md:w-48 z-20 drop-shadow-2xl"
              >
                <img src={badgeLogo} alt="Waterway Wellness Badge" className="w-full h-auto" />
              </motion.div>
            </div>
            
            <div className="order-1 lg:order-2 flex flex-col gap-8">
              <motion.div variants={fadeInUp}>
                <h2 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
                  More than miles. <br/>
                  <span className="text-primary">Mostly vibes.</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  Look, nobody actually likes running. But we do like showing up, catching a sunset, feeling the coastal breeze, and hanging out for two hours after we swore we were going home.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Waterway Wellness is anti-pretentious, anti-degenerate, and deeply welcoming. Whether you're running an 8-minute mile or walking the whole thing with a coffee, you belong here.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. WHEN & WHERE (FLYER SECTION) */}
      <section id="details" className="py-32 px-6 md:px-12 lg:px-24 bg-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <img src={wwOutline} alt="" className="w-full h-full object-cover object-right mix-blend-overlay" />
        </div>
        
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          >
            <div className="flex flex-col gap-8 z-10">
              <motion.div variants={fadeInUp}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-wide uppercase mb-6">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Weekly Run
                </div>
                <h2 className="text-5xl md:text-7xl font-bold text-foreground mb-8">
                  Mondays at <br/>6:00 PM
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center shrink-0 border border-white/5">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Laura Ward Plaza</h3>
                      <p className="text-muted-foreground">Fort Lauderdale, FL</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center shrink-0 border border-white/5">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m18 14-4-4 4-4"/><path d="M14 10h.01"/><path d="M10 14 6 10l4-4"/><path d="M10 10h.01"/><path d="M22 20V8h-4l-6-6-6 6H2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"/></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">2 Miles</h3>
                      <p className="text-muted-foreground">Run, jog, or walk. Your pace.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <a href="https://instagram.com/waterway.wellness" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-full w-full sm:w-auto" data-testid="btn-rsvp">
                      RSVP on Instagram
                    </Button>
                  </a>
                </div>
              </motion.div>
            </div>
            
            <motion.div variants={fadeInUp} className="relative z-10 flex justify-center lg:justify-end">
              <div className="relative max-w-sm w-full rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-[3rem] -z-10" />
                <img 
                  src={eventFlyer} 
                  alt="2 Mile Run, Church by the Sea Flyer" 
                  className="w-full h-auto rounded-2xl shadow-2xl border border-white/10" 
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 4. THE MOVEMENT / THROW UP THE DUB */}
      <section id="movement" className="py-32 bg-primary relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 mix-blend-multiply">
          <img src={floridaVibes} alt="Florida Vibes" className="w-full h-full object-cover" />
        </div>
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img 
              src={throwUpDubIvory} 
              alt="Throw Up The Dub" 
              className="w-full max-w-5xl mx-auto h-auto drop-shadow-md mb-8" 
            />
            <p className="text-2xl md:text-4xl font-bold text-primary-foreground max-w-3xl mx-auto leading-tight">
              The Dub is the movement.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 5. NEWSLETTER / JOIN */}
      <section className="py-32 px-6 bg-background">
        <div className="max-w-4xl mx-auto bg-card rounded-[3rem] p-8 md:p-16 text-center border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-primary/10 blur-[100px] -z-10" />
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="relative z-10 flex flex-col items-center"
          >
            <motion.div variants={fadeInUp} className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-8">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z"/><polyline points="15,9 18,9 18,11"/><path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2v0"/></svg>
            </motion.div>
            
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Don't run alone.
            </motion.h2>
            
            <motion.p variants={fadeInUp} className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Drop your email to get notified about upcoming runs, routes, and post-run hangs. No spam, just vibes.
            </motion.p>
            
            <motion.form variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="h-14 rounded-full px-6 bg-background border-white/10 text-lg focus-visible:ring-primary"
                data-testid="input-email-join"
              />
              <Button type="submit" size="lg" className="h-14 rounded-full px-8 text-lg font-bold shrink-0" data-testid="btn-submit-email">
                Sign Up
              </Button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
