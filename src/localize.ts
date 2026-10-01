import data from "../lang/ko-settings.json";

interface Option { value: string; label: string; description?: string }
export interface UI {
	label: string;
	description: string;
	warning?: string;
	options?: readonly Option[] | "runtime";
}
interface Entry { label: string; description: string; warning?: string; options?: Record<string, { label: string; description?: string }> }
interface Dynamic { parts: string[]; translation: string }
const catalog = data as { version: string; settings: Record<string, Entry>; dynamic: Record<string, Dynamic> };
export const supportedVersion = catalog.version;
const originals = Symbol.for("omp-settings-ko.original-metadata");
const fields = ["label", "description", "warning", "options"] as const;
const patterns = new Map(Object.entries(catalog.dynamic).map(([id, entry]) => [id, {
	pattern: new RegExp(`^${entry.parts.map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("([\\s\\S]*?)")}$`),
	translation: entry.translation,
}]));

/** Only display metadata is copied. Keys, values and validators remain on the host. */
export function localizeUI(id: string, ui: UI): UI {
	const entry = catalog.settings[id];
	if (!entry) return ui;
	const getter = Object.getOwnPropertyDescriptor(ui, "description")?.get;
	const dynamic = patterns.get(id);
	const translated: UI = { ...ui, label: entry.label, description: entry.description,
		...(entry.warning ? { warning: entry.warning } : {}),
		...(Array.isArray(ui.options) ? { options: ui.options.map(option => ({ ...option, ...entry.options?.[option.value] })) } : {}),
	};
	if (getter && dynamic) Object.defineProperty(translated, "description", {
		enumerable: true, configurable: true,
		get() {
			const source = String(getter.call(ui));
			const match = dynamic.pattern.exec(source);
			return match ? dynamic.translation.replace(/\{(\d+)\}/g, (_, index) => match[Number(index) + 1] ?? "") : source;
		},
	});
	return translated;
}

export interface SettingMetadata { id: string; ui?: UI }

/** Original descriptors survive extension reloads, so getters never accumulate wrappers. */
export function applyKoreanSettings(settings: Iterable<SettingMetadata>) {
	const count = { settings: 0, descriptions: 0, options: 0, optionDescriptions: 0, warnings: 0,
		missing: [] as string[], skipped: [] as string[] };
	for (const setting of settings) {
		const ui = setting.ui as (UI & { [originals]?: UI }) | undefined;
		if (!ui) continue;
		if (!(setting.id in catalog.settings)) { count.missing.push(setting.id); continue; }
		if ((!ui[originals] && !Object.isExtensible(ui)) || fields.some(key => {
			const descriptor = Object.getOwnPropertyDescriptor(ui, key);
			return descriptor && !descriptor.configurable;
		})) { count.skipped.push(setting.id); continue; }
		if (!ui[originals]) Object.defineProperty(ui, originals, {
			value: Object.defineProperties({}, Object.getOwnPropertyDescriptors(ui)),
		});
		const translated = localizeUI(setting.id, ui[originals]!);
		for (const key of fields) {
			const descriptor = Object.getOwnPropertyDescriptor(translated, key);
			if (descriptor) Object.defineProperty(ui, key, descriptor);
		}
		count.settings++;
		if (/[가-힣]/.test(ui.description)) count.descriptions++;
		else count.skipped.push(`${setting.id}.description`);
		if (ui.warning) count.warnings++;
		if (Array.isArray(ui.options)) {
			count.options += ui.options.length;
			count.optionDescriptions += ui.options.filter(option => option.description).length;
		}
	}
	return count;
}
