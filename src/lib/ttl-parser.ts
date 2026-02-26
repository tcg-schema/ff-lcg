export interface TtlPrefix {
  prefix: string;
  uri: string;
}

export interface TtlTriple {
  subject: string;
  predicate: string;
  object: string;
}

export interface TtlClass {
  uri: string;
  label: string;
  comment: string;
  subClassOf: string;
}

export interface TtlProperty {
  uri: string;
  label: string;
  comment: string;
  domain: string;
  range: string;
}

export interface TtlInstance {
  uri: string;
  type: string;
  name: string;
  properties: Record<string, string[]>;
}

export interface TtlOntology {
  uri: string;
  label: string;
  comment: string;
  imports: string[];
}

export interface ParsedTtl {
  prefixes: TtlPrefix[];
  ontology: TtlOntology | null;
  classes: TtlClass[];
  properties: TtlProperty[];
  instances: TtlInstance[];
  raw: string;
}

function shortenUri(uri: string, prefixes: TtlPrefix[]): string {
  for (const p of prefixes) {
    if (uri.startsWith(p.uri)) {
      return `${p.prefix}:${uri.slice(p.uri.length)}`;
    }
  }
  return uri;
}

export function parseTtl(content: string): ParsedTtl {
  const prefixes: TtlPrefix[] = [];
  const classes: TtlClass[] = [];
  const properties: TtlProperty[] = [];
  const instances: TtlInstance[] = [];
  let ontology: TtlOntology | null = null;

  // Parse prefixes
  const prefixRegex = /@prefix\s+(\w*):?\s+<([^>]+)>\s*\./g;
  let match;
  while ((match = prefixRegex.exec(content)) !== null) {
    prefixes.push({ prefix: match[1], uri: match[2] });
  }

  // Resolve prefixed names to full URIs
  function resolve(term: string): string {
    term = term.trim();
    if (term.startsWith('<') && term.endsWith('>')) {
      return term.slice(1, -1);
    }
    const colonIdx = term.indexOf(':');
    if (colonIdx >= 0) {
      const prefix = term.slice(0, colonIdx);
      const local = term.slice(colonIdx + 1);
      const found = prefixes.find(p => p.prefix === prefix);
      if (found) return found.uri + local;
    }
    return term;
  }

  function shorten(uri: string): string {
    return shortenUri(uri, prefixes);
  }

  // Remove comments and normalize
  const lines = content.split('\n');
  const cleaned = lines
    .map(l => {
      // Remove line comments but not inside strings
      const hashIdx = l.indexOf('#');
      if (hashIdx >= 0) {
        // Check if # is inside a string
        const before = l.slice(0, hashIdx);
        const quoteCount = (before.match(/"/g) || []).length;
        if (quoteCount % 2 === 0) return before;
      }
      return l;
    })
    .join('\n');

  // Split into blocks (separated by .)
  const blocks = cleaned.split(/\.\s*(?=\n|$)/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed || trimmed.startsWith('@prefix')) continue;

    // Parse triples from block (handling ; and ,)
    const triples = parseBlock(trimmed);
    if (triples.length === 0) continue;

    const subject = triples[0].subject;
    const resolvedSubject = resolve(subject);
    const shortSubject = shorten(resolvedSubject);

    // Collect all predicates
    const predMap: Record<string, string[]> = {};
    for (const t of triples) {
      const pred = resolve(t.predicate);
      if (!predMap[pred]) predMap[pred] = [];
      predMap[pred].push(t.object);
    }

    const types = (predMap['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] || []).map(resolve);
    const rdfType = types[0] || '';

    const labelVals = predMap['http://www.w3.org/2000/01/rdf-schema#label'] || [];
    const commentVals = predMap['http://www.w3.org/2000/01/rdf-schema#comment'] || [];
    const label = cleanLiteral(labelVals[0] || '');
    const comment = cleanLiteral(commentVals[0] || '');

    // Check if ontology
    if (rdfType === 'http://www.w3.org/2002/07/owl#Ontology') {
      const imports = (predMap['http://www.w3.org/2002/07/owl#imports'] || []).map(i => shorten(resolve(i)));
      ontology = { uri: resolvedSubject, label, comment, imports };
      continue;
    }

    // Check if class
    if (rdfType === 'http://www.w3.org/2000/01/rdf-schema#Class') {
      const subClassOf = predMap['http://www.w3.org/2000/01/rdf-schema#subClassOf'];
      classes.push({
        uri: shortSubject,
        label: label || shortSubject.split(':').pop() || shortSubject,
        comment,
        subClassOf: subClassOf ? shorten(resolve(subClassOf[0])) : '',
      });
      continue;
    }

    // Check if property
    if (rdfType === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#Property') {
      const domain = predMap['http://www.w3.org/2000/01/rdf-schema#domain'];
      const range = predMap['http://www.w3.org/2000/01/rdf-schema#range'];
      properties.push({
        uri: shortSubject,
        label: label || shortSubject.split(':').pop() || shortSubject,
        comment,
        domain: domain ? shorten(resolve(domain[0])) : '',
        range: range ? shorten(resolve(range[0])) : '',
      });
      continue;
    }

    // Otherwise it's an instance
    if (rdfType || Object.keys(predMap).length > 0) {
      const nameVals = predMap['https://schema.org/name'] || [];
      const name = cleanLiteral(nameVals[0] || '');
      const props: Record<string, string[]> = {};
      for (const [pred, vals] of Object.entries(predMap)) {
        if (pred === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') continue;
        const shortPred = shorten(pred);
        props[shortPred] = vals.map(v => {
          const cleaned = cleanLiteral(v);
          if (cleaned !== v) return cleaned;
          return shorten(resolve(v));
        });
      }
      instances.push({
        uri: shortSubject,
        type: shorten(rdfType),
        name: name || shortSubject.split(':').pop() || shortSubject,
        properties: props,
      });
    }
  }

  return { prefixes, ontology, classes, properties, instances, raw: content };
}

function parseBlock(block: string): TtlTriple[] {
  const triples: TtlTriple[] = [];
  
  // Very simple parser - split by ; for predicate-object pairs
  // First token is subject
  const tokens = tokenize(block);
  if (tokens.length < 3) return triples;

  const subject = tokens[0];
  let i = 1;

  while (i < tokens.length) {
    const predicate = tokens[i];
    if (!predicate || predicate === ';' || predicate === ',') { i++; continue; }
    i++;

    // Collect objects until ; or end
    while (i < tokens.length) {
      const obj = tokens[i];
      if (obj === ';') { i++; break; }
      if (obj === ',') { i++; continue; }
      
      // Handle blank nodes [ ... ]
      if (obj === '[') {
        let depth = 1;
        let blankNode = '[';
        i++;
        while (i < tokens.length && depth > 0) {
          if (tokens[i] === '[') depth++;
          if (tokens[i] === ']') depth--;
          blankNode += ' ' + tokens[i];
          i++;
        }
        triples.push({ subject, predicate, object: blankNode });
        if (i < tokens.length && (tokens[i] === ';' || tokens[i] === ',')) {
          const sep = tokens[i];
          i++;
          if (sep === ';') break;
        }
        continue;
      }

      triples.push({ subject, predicate, object: obj });
      i++;
      if (i < tokens.length && (tokens[i] === ';' || tokens[i] === ',')) {
        const sep = tokens[i];
        i++;
        if (sep === ';') break;
      }
    }
  }

  // Expand 'a' shorthand
  return triples.map(t => ({
    ...t,
    predicate: t.predicate === 'a' ? 'rdf:type' : t.predicate,
  }));
}

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < text.length) {
    // Skip whitespace
    if (/\s/.test(text[i])) { i++; continue; }
    
    // String literal
    if (text[i] === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') {
        if (text[j] === '\\') j++;
        j++;
      }
      j++; // closing quote
      // Capture language tag or datatype
      while (j < text.length && (text[j] === '@' || text[j] === '^')) {
        if (text[j] === '@') {
          j++;
          while (j < text.length && /[a-zA-Z-]/.test(text[j])) j++;
        } else if (text[j] === '^' && text[j+1] === '^') {
          j += 2;
          if (text[j] === '<') {
            while (j < text.length && text[j] !== '>') j++;
            j++;
          } else {
            while (j < text.length && !/[\s;,.\[\]]/.test(text[j])) j++;
          }
        } else break;
      }
      tokens.push(text.slice(i, j));
      i = j;
      continue;
    }

    // URI
    if (text[i] === '<') {
      let j = i + 1;
      while (j < text.length && text[j] !== '>') j++;
      tokens.push(text.slice(i, j + 1));
      i = j + 1;
      continue;
    }

    // Special chars
    if (';,[]'.includes(text[i])) {
      tokens.push(text[i]);
      i++;
      continue;
    }

    // Regular token (prefixed name, keyword, number, boolean)
    let j = i;
    while (j < text.length && !/[\s;,\[\]]/.test(text[j])) j++;
    if (j > i) tokens.push(text.slice(i, j));
    i = j;
  }
  return tokens;
}

function cleanLiteral(val: string): string {
  if (!val) return '';
  // Remove quotes and language tags
  const m = val.match(/^"(.*)"(@\w+)?$/s);
  if (m) return m[1];
  return val;
}
