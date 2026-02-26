import { useState, useEffect } from 'react';
import { Scroll, ExternalLink } from 'lucide-react';
import { SchemaEntry, loadBuiltinSchemas, parseUploadedSchema } from '@/lib/schema-store';
import { SchemaCard } from '@/components/SchemaCard';
import { SchemaViewer } from '@/components/SchemaViewer';
import { Footer } from '@/components/Footer';

const Index = () => {
  const [schemas, setSchemas] = useState<SchemaEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBuiltinSchemas().then((entries) => {
      setSchemas(entries);
      if (entries.length > 0) setSelectedId(entries[0].id);
      setLoading(false);
    });
  }, []);

  const selectedSchema = schemas.find(s => s.id === selectedId);

  const handleDownload = (schema: SchemaEntry) => {
    const blob = new Blob([schema.parsed.raw], { type: 'text/turtle' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = schema.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const entry = parseUploadedSchema(file.name, content);
      setSchemas(prev => [...prev, entry]);
      setSelectedId(entry.id);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-ink/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scroll className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-display text-lg font-bold text-gold leading-tight">
                TCG Schema Explorer
              </h1>
              <p className="text-xs text-muted-foreground">FFG Living Card Game Ontologies</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://tcg-schema.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors"
            >
              tcg-schema.org <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md border border-gold-dim text-gold hover:bg-primary/10 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Add Schema
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ttl,.turtle"
              onChange={handleUpload}
              className="hidden"
            />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-muted-foreground text-sm animate-pulse">Loading schemas…</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
            {/* Sidebar: Schema List */}
            <aside className="space-y-3">
              <h2 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Schema Modules
              </h2>
              {schemas.map((schema) => (
                <SchemaCard
                  key={schema.id}
                  schema={schema}
                  isSelected={schema.id === selectedId}
                  onSelect={() => setSelectedId(schema.id)}
                  onDownload={() => handleDownload(schema)}
                />
              ))}
            </aside>

            {/* Content: Schema Viewer */}
            <section className="min-w-0">
              {selectedSchema ? (
                <SchemaViewer
                  key={selectedSchema.id}
                  parsed={selectedSchema.parsed}
                  schemaName={selectedSchema.name}
                />
              ) : (
                <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                  Select a schema to explore
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
