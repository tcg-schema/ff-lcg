import { Download, FileText, Layers, ArrowRight, Upload } from 'lucide-react';
import { SchemaEntry } from '@/lib/schema-store';

interface SchemaCardProps {
  schema: SchemaEntry;
  isSelected: boolean;
  onSelect: () => void;
  onDownload: () => void;
}

export function SchemaCard({ schema, isSelected, onSelect, onDownload }: SchemaCardProps) {
  const { parsed } = schema;
  return (
    <button
      onClick={onSelect}
      className={`
        w-full text-left p-5 rounded-lg border transition-all duration-300 group
        ${isSelected
          ? 'border-primary bg-primary/10 glow-gold'
          : 'border-border bg-card hover:border-gold-dim hover:bg-secondary/50'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {schema.isUserUploaded && (
              <Upload className="w-3.5 h-3.5 text-section-property flex-shrink-0" />
            )}
            <h3 className="font-display text-sm font-semibold text-foreground truncate">
              {schema.name}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {schema.description}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-section-class" />
              {parsed.classes.length}
            </span>
            <span className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-section-property" />
              {parsed.properties.length}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-section-instance" />
              {parsed.instances.length}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          title="Download TTL"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </button>
  );
}
