import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border py-6 mt-12">
      <div className="container max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          made with <Heart className="w-3 h-3 text-primary fill-primary" /> in Bologna by{' '}
          <a href="https://fantasymaps.org" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-glow transition-colors underline underline-offset-2">
            FantasyMaps.org
          </a>
        </div>
        <div>
          Core schema:{' '}
          <a href="https://tcg-schema.org" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-glow transition-colors underline underline-offset-2">
            tcg-schema.org
          </a>
        </div>
      </div>
    </footer>
  );
}
