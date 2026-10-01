import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { VERSION } from "@oh-my-pi/pi-utils";
import { applyKoreanSettings, type SettingMetadata, supportedVersion } from "./localize";

export default async function (pi: ExtensionAPI) {
	let settings: () => Iterable<SettingMetadata> = () => [];
	let unavailable = "";
	if (VERSION !== supportedVersion) {
		unavailable = `OMP ${supportedVersion} 전용 한국어팩입니다. 현재 ${VERSION}에는 적용하지 않았습니다.`;
	} else {
		try {
			// The registry subpath may not exist on older hosts; load it only after checking the version.
			const registry = await import("@oh-my-pi/pi-coding-agent/config/registry");
			settings = registry.all;
			applyKoreanSettings(settings());
		} catch (error) {
			unavailable = `설정 한국어팩을 적용하지 못했습니다: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
	pi.setLabel(`설정 한국어팩 ${supportedVersion}`);
	pi.on("session_start", (_event, ctx) => {
		if (unavailable) ctx.ui.notify(unavailable, "warning");
		else applyKoreanSettings(settings());
	});
	pi.registerCommand("ko-settings-status", {
		description: "한국어 설정 적용 상태 확인",
		handler: async (_args, ctx) => {
			if (unavailable) { ctx.ui.notify(unavailable, "warning"); return; }
			const c = applyKoreanSettings(settings());
			ctx.ui.notify(`OMP ${VERSION}: 설정명 ${c.settings}개 · 설명 ${c.descriptions}개 · 선택지 ${c.options}개 · 선택지 설명 ${c.optionDescriptions}개 · 경고 ${c.warnings}개 · 미등록 ${c.missing.length}개 · 건너뜀 ${c.skipped.length}개. 탭·고정 안내와 단순 enum의 현재 값은 번역 대상이 아닙니다.`, "info");
		},
	});
}
