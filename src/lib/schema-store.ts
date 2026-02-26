import { ParsedTtl, parseTtl } from './ttl-parser';

export interface SchemaEntry {
  id: string;
  name: string;
  description: string;
  fileName: string;
  parsed: ParsedTtl;
  isUserUploaded: boolean;
}

interface RegistryItem {
  id: string;
  name: string;
  file: string;
  description: string;
}

export async function loadBuiltinSchemas(): Promise<SchemaEntry[]> {
  const base = import.meta.env.BASE_URL || '/';
  const res = await fetch(`${base}schemas/registry.json`);
  const registry: RegistryItem[] = await res.json();

  const entries: SchemaEntry[] = [];
  for (const item of registry) {
    try {
      const ttlRes = await fetch(`${base}schemas/${item.file}`);
      const raw = await ttlRes.text();
      const parsed = parseTtl(raw);
      entries.push({
        id: item.id,
        name: item.name,
        description: item.description,
        fileName: item.file,
        parsed,
        isUserUploaded: false,
      });
    } catch (e) {
      console.error(`Failed to load schema ${item.id}:`, e);
    }
  }
  return entries;
}

export function parseUploadedSchema(fileName: string, content: string): SchemaEntry {
  const parsed = parseTtl(content);
  const name = parsed.ontology?.label || fileName.replace('.ttl', '');
  const description = parsed.ontology?.comment || '';
  return {
    id: `user-${Date.now()}`,
    name,
    description,
    fileName,
    parsed,
    isUserUploaded: true,
  };
}
