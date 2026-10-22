// Adapted from TeXlyre (AGPL-3.0), commit ccbe092027bc45e9e37b852bdbe48fb29661f3e0.
// https://github.com/TeXlyre/texlyre/blob/ccbe092027bc45e9e37b852bdbe48fb29661f3e0/src/utils/latexSynctexParser.ts
// Changes: fflate decoding, PDF-point units/offsets, exact repository paths, no package-file hits.
import { gunzipSync } from "fflate";
export interface SourceMapRect { x: number; y: number; width: number; height: number }
export interface SourceMapForwardResult { page: number; rects: SourceMapRect[] }
export interface SourceMapReverseResult { file: string; line: number; column?: number }
export interface SourceMapData {
  forward(file: string, line: number): SourceMapForwardResult | null;
  reverse(page: number, x: number, y: number): SourceMapReverseResult | null;
}
const CONTAINER_HEIGHT_LINE_MULTIPLE = 16;
const FALLBACK_VERTICAL_LINE_TOLERANCE = 1.5;

interface Box {
	page: number;
	file: string;
	line: number;
	column: number;
	x: number;
	y: number;
	width: number;
	height: number;
	depth: number;
	isVbox: boolean;
}

interface Index {
	byFileLine: Map<string, Box[]>;
	byPage: Map<number, Box[]>;
}

const decode = (bytes: Uint8Array): string => {
	const gzip = bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
	return new TextDecoder('utf-8').decode(gzip ? gunzipSync(bytes) : bytes);
};

const normalize = (file: string): string => {
  const parts: string[] = [];
  for (const part of file.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop(); else parts.push(part);
  }
  return parts.join("/");
};

const parseRecord = (
	line: string,
): {
	tag: number;
	line: number;
	column: number;
	x: number;
	y: number;
	width: number;
	height: number;
	depth: number;
} | null => {
	const colon = line.indexOf(':');
	if (colon === -1) return null;

	const prefix = line.substring(1, colon).split(',');
	const tag = Number.parseInt(prefix[0], 10);
	const lineNum = Number.parseInt(prefix[1], 10);
	if (Number.isNaN(tag) || Number.isNaN(lineNum)) return null;

	const rest = line.substring(colon + 1).split(/[,:]/);
	const x = Number.parseInt(rest[0], 10);
	const y = Number.parseInt(rest[1], 10);
	if (Number.isNaN(x) || Number.isNaN(y)) return null;

	return {
		tag,
		line: lineNum,
		column: prefix.length > 2 ? Number.parseInt(prefix[2], 10) : -1,
		x,
		y,
		width: Number.parseInt(rest[2], 10) || 0,
		height: Number.parseInt(rest[3], 10) || 0,
		depth: Number.parseInt(rest[4], 10) || 0,
	};
};

const buildIndex = (text: string, main: string, paths: Set<string>): Index => {
  let unit = 1, magnification = 1000, xOffset = 0, yOffset = 0;
	const inputs = new Map<number, string>();
	const byFileLine = new Map<string, Box[]>();
	const byPage = new Map<number, Box[]>();
	let page = 0;
	let inContent = false;
	let rootPrefix = '';
  const horizontal: { x: number; height: number; depth: number }[] = [];

  const toRootRelative = (file: string): string => {
    const path = normalize(file);
    return rootPrefix && path.startsWith(rootPrefix) ? path.slice(rootPrefix.length) : path;
  };

	for (const raw of text.split('\n')) {
		if (!raw) continue;

		if (raw.startsWith('Input:')) {
			const parts = raw.substring(6).split(':');
			const tag = Number.parseInt(parts[0], 10);
			if (parts.length >= 2 && !Number.isNaN(tag)) {
				inputs.set(tag, parts.slice(1).join(':').trim());
			}
			continue;
		}

    if (!inContent) {
      if (raw.startsWith("Unit:")) unit = Number(raw.slice(5));
      if (raw.startsWith("Magnification:")) magnification = Number(raw.slice(14));
      if (raw.startsWith("X Offset:")) xOffset = Number(raw.slice(9));
      if (raw.startsWith("Y Offset:")) yOffset = Number(raw.slice(9));
      if (raw === "Content:") {
        inContent = true;
        const input = normalize(inputs.get(1) ?? "");
        if (input.endsWith(main)) rootPrefix = input.slice(0, -main.length);
        if (!unit || !magnification) throw Error("Invalid SyncTeX scale");
      }
      continue;
    }
    const scale = unit * magnification / 1000 / 65781.76;

		if (raw.startsWith('Postamble:')) break;

		const kind = raw[0];

		if (kind === '{') {
			const n = Number.parseInt(raw.substring(1), 10);
			if (!Number.isNaN(n)) {
				page = n;
				if (!byPage.has(page)) byPage.set(page, []);
			}
			continue;
		}

		if (kind === '}') {
			page = 0;
			continue;
		}

    if (kind === ')') { horizontal.pop(); continue; }
    if (kind !== 'h' && kind !== '[' && kind !== '(' && kind !== 'r' && kind !== 'x' && kind !== 'g' && kind !== 'k') continue;

		const fields = parseRecord(raw);
    if (!fields) continue;
    const parent = horizontal.at(-1);
    const left = parent?.x ?? fields.x;
    if (kind === '(') horizontal.push({ x: fields.x, height: fields.height, depth: fields.depth });
    else if (parent && (kind === 'x' || kind === 'g' || kind === 'k')) parent.x = fields.x;
    if (kind === 'g' || kind === 'k') continue;
    if (kind === 'x') {
      if (!parent || fields.x <= left || parent.height + parent.depth <= 0) continue;
      fields.width = fields.x - left; fields.x = left;
      fields.height = parent.height; fields.depth = parent.depth;
    }

		const input = inputs.get(fields.tag);
		if (!input || page === 0) continue;

		const file = toRootRelative(input);
    if (!paths.has(file)) continue;

		const key = `${file}:${fields.line}`;

		if (kind === 'r') {
			const list = byFileLine.get(key);
			const last = list?.[list.length - 1];
			if (last && last.width === 0) {
				last.width = fields.width * scale;
				if (last.height === 0) last.height = fields.height * scale;
				if (last.depth === 0) last.depth = fields.depth * scale;
			}
			continue;
		}

		const box: Box = {
			page,
			file,
			line: fields.line,
			column: fields.column,
			x: fields.x * scale + xOffset * unit / 65781.76,
			y: fields.y * scale + yOffset * unit / 65781.76,
			width: fields.width * scale,
			height: fields.height * scale,
			depth: fields.depth * scale,
			isVbox: kind === '[',
		};

		const list = byFileLine.get(key);
		if (list) list.push(box);
		else byFileLine.set(key, [box]);

		byPage.get(page)?.push(box);
	}

	return { byFileLine, byPage };
};

export function parseSynctex(bytes: Uint8Array, main: string, paths: string[]): SourceMapData {
	const index = buildIndex(decode(bytes), main, new Set(paths));

	return {
		forward(file: string, line: number): SourceMapForwardResult | null {
			const target = normalize(file);
      const rankFile = (indexed: string): number => normalize(indexed) === target ? 0 : Infinity;

			let bestRank = Number.POSITIVE_INFINITY;
			for (const key of index.byFileLine.keys()) {
				bestRank = Math.min(
					bestRank,
					rankFile(key.substring(0, key.lastIndexOf(':'))),
				);
			}
			if (bestRank === Number.POSITIVE_INFINITY) return null;

			let exact: Box[] = [];
			let nearest: Box[] = [];
			let nearestDelta = Number.POSITIVE_INFINITY;

			for (const [key, boxes] of index.byFileLine) {
				const colon = key.lastIndexOf(':');
				if (rankFile(key.substring(0, colon)) !== bestRank) continue;

				const blockLine = Number.parseInt(key.substring(colon + 1), 10);
				if (blockLine === line) {
					exact = exact.concat(boxes);
					continue;
				}

				const delta = Math.abs(blockLine - line);
				if (delta < nearestDelta) {
					nearestDelta = delta;
					nearest = boxes.slice();
				} else if (delta === nearestDelta) {
					nearest = nearest.concat(boxes);
				}
			}

			const candidates = exact.length > 0 ? exact : nearest;
			if (candidates.length === 0) return null;

			const page = candidates[0].page;
			const onPage = candidates.filter((b) => b.page === page && b.width > 0 && !b.isVbox && b.height + b.depth > 0);
			if (onPage.length === 0) return null;

			const rects = onPage.map((b) => ({
				x: b.x,
				y: b.y - b.height,
				width: b.width,
				height: b.height + b.depth,
			}));

			return { page, rects };
		},

		reverse(page: number, x: number, y: number): SourceMapReverseResult | null {
			const boxes = index.byPage.get(page);
			if (!boxes?.length) return null;

			const lineHeights = boxes
				.filter((b) => !b.isVbox && b.height + b.depth > 0)
				.map((b) => b.height + b.depth)
				.sort((a, b) => a - b);
			const medianLineHeight = lineHeights.length
				? lineHeights[Math.floor(lineHeights.length / 2)]
				: 0;
			const maxBoxHeight =
				medianLineHeight > 0
					? medianLineHeight * CONTAINER_HEIGHT_LINE_MULTIPLE
					: Number.POSITIVE_INFINITY;

			const selectBox = (applyCap: boolean): Box | null => {
				let bestContained: Box | null = null;
				let bestScore = Number.POSITIVE_INFINITY;
				let closest: Box | null = null;
				let closestDist = Number.POSITIVE_INFINITY;

				for (const b of boxes) {
					const boxHeight = b.height + b.depth;
					if (applyCap && boxHeight > maxBoxHeight) continue;

					const top = b.y - b.height;
					const bottom = b.y + b.depth;
					const right = b.x + b.width;

					if (x >= b.x && x <= right && y >= top && y <= bottom) {
						const cx = b.x + b.width / 2;
						const cy = (top + bottom) / 2;
						const dx = x - cx;
						const dy = y - cy;
						const area = b.width * (boxHeight || 1) || 1;
						const score = (dx * dx + dy * dy) * Math.sqrt(area);
						if (bestContained === null || score <= bestScore) {
							bestScore = score;
							bestContained = b;
						}
					} else if (applyCap) {
						const cx = Math.max(b.x, Math.min(x, right));
						const cy = Math.max(top, Math.min(y, bottom));
						const dx = x - cx;
						const dy = y - cy;
						const lineHeight = boxHeight || 1;
						if (Math.abs(dy) > lineHeight * FALLBACK_VERTICAL_LINE_TOLERANCE)
							continue;
						const dist = dx * dx + dy * dy;
						if (dist < closestDist) {
							closestDist = dist;
							closest = b;
						}
					}
				}

				return bestContained ?? closest;
			};

			const hit = selectBox(true) ?? selectBox(false);
			if (!hit) return null;

			const line = hit.isVbox ? Math.max(1, hit.line - 1) : hit.line;

			return {
				file: hit.file,
				line,
				column: hit.column >= 0 ? hit.column : undefined,
			};
		},
	};
}
