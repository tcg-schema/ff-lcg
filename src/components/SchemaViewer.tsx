import { useState } from 'react';
import { ChevronDown, ChevronRight, Layers, ArrowRight, FileText, Info, Link2 } from 'lucide-react';
import { ParsedTtl, TtlClass, TtlProperty, TtlInstance } from '@/lib/ttl-parser';

interface SchemaViewerProps {
  parsed: ParsedTtl;
  schemaName: string;
}

type Section = 'ontology' | 'classes' | 'properties' | 'instances';

export function SchemaViewer({ parsed, schemaName }: SchemaViewerProps) {
  const [openSections, setOpenSections] = useState<Set<Section>>(new Set(['ontology', 'classes', 'properties', 'instances']));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleSection = (s: Section) => {
    const next = new Set(openSections);
    next.has(s) ? next.delete(s) : next.add(s);
    setOpenSections(next);
  };

  const toggleItem = (id: string) => {
    const next = new Set(expandedItems);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedItems(next);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="font-display text-xl font-bold text-gold mb-6">{schemaName}</h2>

      {/* Ontology Info */}
      {parsed.ontology && (
        <SectionBlock
          title="Ontology"
          icon={<Info className="w-4 h-4" />}
          colorClass="text-section-ontology"
          isOpen={openSections.has('ontology')}
          onToggle={() => toggleSection('ontology')}
          count={1}
        >
          <div className="p-4 bg-secondary/30 rounded-md space-y-2">
            <div className="text-xs text-muted-foreground font-mono break-all">{parsed.ontology.uri}</div>
            {parsed.ontology.comment && (
              <p className="text-sm text-secondary-foreground">{parsed.ontology.comment}</p>
            )}
            {parsed.ontology.imports.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {parsed.ontology.imports.map((imp, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                    <Link2 className="w-3 h-3" /> {imp}
                  </span>
                ))}
              </div>
            )}
          </div>
        </SectionBlock>
      )}

      {/* Classes */}
      <SectionBlock
        title="Classes"
        icon={<Layers className="w-4 h-4" />}
        colorClass="text-section-class"
        isOpen={openSections.has('classes')}
        onToggle={() => toggleSection('classes')}
        count={parsed.classes.length}
      >
        <div className="space-y-1">
          {parsed.classes.map((cls) => (
            <ClassItem key={cls.uri} cls={cls} isExpanded={expandedItems.has(cls.uri)} onToggle={() => toggleItem(cls.uri)} />
          ))}
        </div>
      </SectionBlock>

      {/* Properties */}
      <SectionBlock
        title="Properties"
        icon={<ArrowRight className="w-4 h-4" />}
        colorClass="text-section-property"
        isOpen={openSections.has('properties')}
        onToggle={() => toggleSection('properties')}
        count={parsed.properties.length}
      >
        <div className="space-y-1">
          {parsed.properties.map((prop) => (
            <PropertyItem key={prop.uri} prop={prop} isExpanded={expandedItems.has(prop.uri)} onToggle={() => toggleItem(prop.uri)} />
          ))}
        </div>
      </SectionBlock>

      {/* Instances */}
      <SectionBlock
        title="Instances"
        icon={<FileText className="w-4 h-4" />}
        colorClass="text-section-instance"
        isOpen={openSections.has('instances')}
        onToggle={() => toggleSection('instances')}
        count={parsed.instances.length}
      >
        <div className="space-y-1">
          {parsed.instances.map((inst) => (
            <InstanceItem key={inst.uri} inst={inst} isExpanded={expandedItems.has(inst.uri)} onToggle={() => toggleItem(inst.uri)} />
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}

function SectionBlock({ title, icon, colorClass, isOpen, onToggle, count, children }: {
  title: string; icon: React.ReactNode; colorClass: string; isOpen: boolean; onToggle: () => void; count: number; children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors">
        {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        <span className={colorClass}>{icon}</span>
        <span className="font-display text-sm font-semibold text-foreground">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{count}</span>
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function ClassItem({ cls, isExpanded, onToggle }: { cls: TtlClass; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className="bg-section-class rounded-md">
      <button onClick={onToggle} className="w-full flex items-center gap-2 p-3 text-left">
        {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
        <span className="text-sm font-medium text-section-class font-mono">{cls.uri}</span>
        {cls.label && <span className="text-xs text-muted-foreground ml-auto">{cls.label}</span>}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-1 text-xs">
          {cls.comment && <p className="text-secondary-foreground">{cls.comment}</p>}
          {cls.subClassOf && (
            <p className="text-muted-foreground">
              <span className="text-gold-dim">subClassOf:</span> {cls.subClassOf}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PropertyItem({ prop, isExpanded, onToggle }: { prop: TtlProperty; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className="bg-section-property rounded-md">
      <button onClick={onToggle} className="w-full flex items-center gap-2 p-3 text-left">
        {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
        <span className="text-sm font-medium text-section-property font-mono">{prop.uri}</span>
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-1 text-xs">
          {prop.comment && <p className="text-secondary-foreground">{prop.comment}</p>}
          {prop.domain && (
            <p className="text-muted-foreground">
              <span className="text-gold-dim">domain:</span> <span className="font-mono">{prop.domain}</span>
            </p>
          )}
          {prop.range && (
            <p className="text-muted-foreground">
              <span className="text-gold-dim">range:</span> <span className="font-mono">{prop.range}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function InstanceItem({ inst, isExpanded, onToggle }: { inst: TtlInstance; isExpanded: boolean; onToggle: () => void }) {
  const propEntries = Object.entries(inst.properties);
  return (
    <div className="bg-section-instance rounded-md">
      <button onClick={onToggle} className="w-full flex items-center gap-2 p-3 text-left">
        {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
        <span className="text-sm font-medium text-section-instance font-mono">{inst.uri}</span>
        {inst.name && inst.name !== inst.uri.split(':').pop() && (
          <span className="text-xs text-muted-foreground ml-auto">{inst.name}</span>
        )}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-1 text-xs">
          {inst.type && (
            <p className="text-muted-foreground">
              <span className="text-gold-dim">a</span> <span className="font-mono">{inst.type}</span>
            </p>
          )}
          {propEntries.map(([pred, vals]) => (
            <p key={pred} className="text-muted-foreground">
              <span className="text-gold-dim font-mono">{pred}:</span>{' '}
              {vals.map((v, i) => (
                <span key={i} className="font-mono">
                  {v}{i < vals.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
