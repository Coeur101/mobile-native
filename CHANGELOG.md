# AI Web Builder Mobile CHANGELOG

## 2026-03-27 Real AI Boundary Verification

### Verified
- Replaced the runtime `mockAIService` dependency with a settings-driven OpenAI-compatible AI boundary for project creation and continuation.
- Confirmed targeted verification with `pnpm test -- tests/vitest/ai-service.test.ts tests/vitest/project-service.test.ts` and `pnpm build`.

## 2026-03-27 Project Persistence Verification

### Verified
- Confirmed remote-backed project listing, legacy migration, version save and restore, and preview navigation with `pnpm test -- tests/vitest/project-service.test.ts`, headed Playwright coverage for `tests/playwright/project-persistence.spec.ts`, and `pnpm build`.
- Removed one-off verification outputs after evidence capture, including `test-results`, `playwright-report`, `.tmp/task-runs/playwright`, and `.tmp/task-runs/vitest`.

## 2026-03-27 OTP Auth/Profile Verification

### Verified
- Confirmed the OTP-first auth entry, profile navigation, avatar upload, and password security flow with `pnpm build`, targeted Vitest, and headed Playwright coverage.
- Cleaned transient verification outputs after the suite completed, including `test-results` and `.tmp/task-runs` test folders.
## 2026-03-27 Agent Harness

### Added
- 鏂板 `scripts/agent-harness/init.mjs`銆乣refresh.mjs`銆乣orchestrate.mjs`銆乣log-progress.mjs` 涓庡叡浜В鏋愬眰 `shared.mjs`
- 鏂板 `docs/agent-harness.md`锛屾妸 Anthropic 闀挎椂杩愯 agent harness 鏂规硶鏄犲皠鍒板綋鍓嶄粨搴撳伐鍏烽摼
- 鏂板 `pnpm agent:init`銆乣pnpm agent:refresh`銆乣pnpm agent:orchestrate`銆乣pnpm agent:log` 鍛戒护

### Changed
- 澶嶇敤 `OpenSpec + TASK.json + task logs + Playwright/Vitest/build` 浣滀负鑷紪鎺掔殑鐘舵€佹簮銆佽繘搴︽ˉ鍜岄獙璇侀棬绂?
## [鏈彂甯僝

### 灏濊瘯涓?
- 鏆傛棤

### 宸插畬鎴?
- 鐧诲綍椤?UI 鏀逛负鏇寸揣鍑戠殑绉诲姩绔璇侀〉锛氱Щ闄よ繃搴﹀紩瀵兼枃妗堝拰娴嬭瘯鎬ц鏄庯紝鍘嬬缉椤堕儴淇℃伅鍖轰笌鍏ュ彛鍒囨崲鍖?- 鐧诲綍涓庢敞鍐屽崌绾т负绉诲姩绔垎姝ュ紡閭璁よ瘉锛氭敮鎸佹敞鍐屽悗璁惧瘑鐮併€佸瘑鐮佺櫥褰曘€侀獙璇佺爜鐧诲綍涓庡瘑鐮侀噸缃叆鍙?- 瀹㈡埛绔櫥褰曟€佹樉寮忎繚鐣?7 澶╋紝杩囨湡鍚庝細娓呯悊鏈湴鐘舵€佸苟瑕佹眰閲嶆柊鐧诲綍
- 褰撳墠鐢ㄦ埛銆侀」鐩€侀」鐩増鏈€侀」鐩秷鎭笌鐢ㄦ埛璁剧疆寤虹珛浜嗘槑纭殑鏈湴褰掑睘妯″瀷锛屼究浜庡悗缁縼绉诲埌 Supabase 琛?- 鎺ュ叆 Supabase Auth 閭 OTP / 楠岃瘉鐮佺櫥褰曚笌 `/login` 浼氳瘽鍥炶皟鎭㈠锛屾浛鎹㈡湰鍦?mock auth
- 鐧诲綍椤垫敼涓哄彂閫侀偖绠遍獙璇佺爜骞舵敮鎸侀獙璇佺爜鏍￠獙锛屼笖鏄庣‘绉婚櫎寰俊鐧诲綍鐨勮瀵煎叆鍙?- 琛ュ厖 `.env.example`銆乣docs/auth-email-setup.md`銆乣vitest.config.ts`銆乣playwright.config.ts` 浠ユ敮鎸佸厤璐逛紭鍏堥偖绠辫璇佷笌鑷姩鍖栭獙璇?- 鍒濆鍖?task 绾ч棴鐜伐浣滄祦缂栨帓锛氭柊澧?OpenSpec workflow change銆乨evelopment-workflow 瑙勮寖銆乣TASK.json` 璐ㄩ噺闂ㄧ缁撴瀯涓庤拷鍔犲紡 task history 绾﹀畾
- 鏄庣‘ user-facing task 蹇呴』鎵ц Playwright 鑷姩鍖?UI 娴嬭瘯锛屽苟瑙勫畾涓存椂鐢熸垚娴嬭瘯鏂囦欢涓庢祴璇曚骇鐗╁湪璁板綍缁撴灉鍚庡繀椤诲垹闄?- 灏嗛」鐩伐浣滄祦鎵╁睍涓?Definition / Delivery / Closure 涓夐樁娈碉紝骞舵媶鍒?`design_review` 涓?`implementation_review` 涓や釜 review 鑺傜偣
- 鏀剁揣 task 绾ф彁浜ら棴鐜細姣忎釜浜や粯鍨?task 瀹屾垚鍚庡繀椤荤嫭绔?commit锛屽苟鍦?`TASK.json` 涓?task history 涓褰曞彲杩芥函鎻愪氦璇佹嵁

### 宸插洖閫€

- 鏆傛棤

---

## 2026-03-25锛圡VP 鍓嶇瀵归綈锛?
### 灏濊瘯涓?
- 璇勪及 shadcn/ui 鏂规锛屾渶缁堟敼涓鸿交閲忚嚜鐮?UI 缁勪欢璺嚎

### 宸插畬鎴?
- 鏂板 Dialog銆乂ersionPanel銆丆odeBlock銆丼keleton銆丒rrorBoundary銆丳ageTransition銆丳ulsingDots銆乀houghtChain 绛?UI 缁勪欢
- 瀹屾垚棣栭〉鎼滅储銆佺姸鎬佺瓫閫夈€侀」鐩垹闄ょ‘璁ゃ€佺増鏈仮澶嶃€佺紪杈戦〉椤圭洰閲嶅懡鍚嶇瓑浜や簰鑳藉姏
- 寮曞叆 Motion銆乭ighlight.js銆佷富棰樼郴缁熶笌鍏ㄥ眬鍔ㄧ敾甯搁噺
- 閲嶆瀯 EditorPage 涓哄叏灞忓璇濆紡甯冨眬锛屽苟涓?AI 鍥炲鍔犲叆 thinkingSteps 灞曠ず
- 瀹屾垚棰勮椤?iframe 灞曠ず銆佷唬鐮佹ā寮忓垏鎹㈠拰瀵煎嚭鑳藉姏
- 浼樺寲涓婚鏍峰紡銆佹寜閽舰鎬併€侀〉闈㈣浆鍦哄拰 Toast 浣嶇疆
- 鏂板 `docs/PRD.md`
- 淇涓嫳鏂囨爣棰樸€佺┖鐘舵€佸姩鐢诲啿绐併€乮frame sandbox 璀﹀憡绛夐棶棰?
### 宸插洖閫€

- 鏆傛棤

## 2026-03-25锛堥」鐩垵濮嬪寲锛?
### 灏濊瘯涓?
- 璇勪及 React Native + WebView 鏂规锛屾渶缁堥€夊畾 React + Capacitor 璺嚎

### 宸插畬鎴?
- 鍒濆鍖栫粨鏋勫寲椤圭洰妯″瀷涓?mock 璁よ瘉銆丄I銆侀」鐩€佽缃湇鍔?- 鏂板鐧诲綍椤点€侀」鐩垪琛ㄩ〉銆佺紪杈戦〉銆侀瑙堥〉銆佽缃〉
- 鍒濆鍖?Capacitor Android 宸ョ▼骞跺畬鎴?Android 鍚屾
- 鎺ュ叆 GitHub Actions Debug APK 鏋勫缓娴佺▼
- 淇 Android 鏋勫缓鏉冮檺銆佹棫鏍峰紡渚濊禆娈嬬暀涓庡寘绠＄悊鍒囨崲闂
- 灏嗘棭鏈?code 妯″瀷鍗囩骇涓?`files/messages/versions` 缁撴瀯
- 鍚屾 README 涓庨」鐩不鐞嗘枃妗?
### 宸插洖閫€

- 鏆傛棤

## 2026-03-27

### Added
- 鎺ュ叆 Chrome DevTools MCP 鍒?Codex 鍏ㄥ眬閰嶇疆锛岃ˉ鍏呯湡瀹炴祻瑙堝櫒鍙鍖栭獙鏀朵笌璋冭瘯鑳藉姏銆?- 鏂板 `docs/chrome-devtools-mcp.md`锛屾槑纭?Chrome MCP 涓?Playwright 鐨勮亴璐ｈ竟鐣屽拰浣跨敤鏂瑰紡銆?
### Changed
- 鏄庣‘椤圭洰 UI 楠岃瘉閲囩敤鍙岃建妯″紡锛歅laywright 璐熻矗鑷姩鍖栭棴鐜紝Chrome DevTools MCP 璐熻矗浜哄伐楠屾敹涓庨棶棰樻帓鏌ャ€?
