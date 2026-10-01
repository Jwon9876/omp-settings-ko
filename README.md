# omp-settings-ko

OMP의 `/settings` 표시 문구를 한국어로 바꾸는 커뮤니티 플러그인입니다.

**번역 기준: OMP 18.4.6.** 버전 번호로 실행을 제한하지 않으며, 새 항목은 원문으로 표시될 수 있습니다.

**플러그인만으로 번역 가능한 범위**를 제공합니다. 탭·그룹 제목, 고정 안내 문구, 단순 enum의 현재 값, 테마·사용자 정의 입력창 모양과 제3자 플러그인 문구는 원문을 유지합니다. OMP 본체를 수정하거나 별도 실행 파일을 설치하지 않습니다.

## 설치

Bun과 OMP가 설치된 환경에서 실행하세요.

```sh
omp --version
omp plugin install omp-settings-ko
omp plugin list
```

OMP를 종료한 뒤 다시 실행하고 `/settings`를 여세요. 적용 범위는 `/ko-settings-status`로 확인할 수 있습니다.

## 번역 범위

아래 개수는 OMP 18.4.6·macOS의 번역 기준 자료에 해당하며 OMP 버전과 운영체제에 따라 달라질 수 있습니다. 예를 들어 Apple 사전 자동 완성은 macOS에만 있습니다.

| 항목 | 개수 |
| --- | ---: |
| 설정 이름 | 393 |
| 설정 설명 | 393 |
| 정적 선택지 이름 | 633 |
| 정적 선택지 설명 | 450 |
| 경고 | 1 |
| 단축키가 동적으로 바뀌는 설명 | 7 |

설정 키·실제 저장 값·기본값·경로·모델 ID·제품명은 바꾸지 않습니다. 제품명이나 기술 용어는 번역이 적용되어도 원문과 같을 수 있습니다. UI가 없는 설정은 추가하지 않습니다. 사용자의 설정 파일을 직접 읽거나 쓰지 않으며, 번역 적용에는 모델 호출이나 별도 네트워크 요청이 필요하지 않습니다.

OMP 버전이 달라도 설정 ID와 선택지 값이 일치하면 번역을 적용합니다. 알 수 없는 설정이나 수정할 수 없는 메타데이터는 원문을 유지하며 상태 명령에 집계합니다. 새 선택지와 알 수 없는 동적 설명도 원문을 유지합니다. 설정 레지스트리를 불러오거나 번역을 적용하지 못한 경우 원인을 안내합니다.

## 제거

```sh
omp plugin uninstall omp-settings-ko
```

실행 중인 프로세스의 표시 메타데이터는 OMP를 종료하고 다시 실행하면 원래대로 돌아옵니다. 재로딩은 중복 번역을 만들지 않지만, 설치·제거 후에는 재시작을 권장합니다.

## 호환성

- 번역 기준 OMP: **18.4.6**
- 설치·번역·재로딩·제거 검증: **18.4.6, 18.4.8** (macOS arm64)
- 테스트 런타임: Bun **1.4.0**
- CI 검증: Linux x64, macOS arm64
- Windows: 검증하지 않았습니다.

특정 버전 일치를 요구하지 않지만, 향후 모든 OMP 버전의 호환성을 보장하지는 않습니다. OMP와 별도로 npm 패키지 버전을 관리합니다.

## 개발

```sh
bun install --frozen-lockfile
bun run check
bun test
bun run check:pack
bun run test:omp
```

실제 OMP 검증은 기본적으로 공식 18.4.6 패키지와 임시 설정 루트를 사용합니다. `OMP_KO_TEST_BINARY=/absolute/path/to/omp bun run test:omp`로 다른 OMP 실행 파일도 검사할 수 있습니다. 설치 tarball, 호스트의 설정 값 보존, 재로딩, 제거·재시작을 확인하며 실제 모델 요청을 보내지 않습니다. `OMP_KO_TEST_PACKAGE=omp-settings-ko@<version> bun run test:omp`로 npm 배포본 설치도 확인할 수 있습니다.

`lang/ko-settings.json`이 번역 원본입니다. 테스트의 영문 레지스트리 자료는 공식 OMP 18.4.6의 메타데이터와 기본값만 포함하며 사용자 설정은 포함하지 않습니다.

## 배포

GitHub Release의 `v<version>` 태그가 `package.json` 버전과 일치할 때 테스트를 통과한 tarball을 npm에 게시합니다. 정식 버전은 `latest`, 사전 공개 버전은 `next` 태그를 사용합니다. npm Trusted Publishing(OIDC)을 사용하며 장기 게시 토큰을 저장하지 않습니다.

## License

MIT. OMP에서 유래한 원문과 자료의 저작권 고지는 [NOTICE](NOTICE) 및 [LICENSE](LICENSE)에 포함되어 있습니다. OMP 공식 배포판이 아닙니다.
