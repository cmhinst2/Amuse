# 나의 웹 소설 집필 메이트 Amuse
### AI와 사용자가 실시간으로 상호작용하며 자신만의 서사를 확장하고 각색해 나가는 몰입형 인터랙티브 스토리텔링 플랫폼

Amuse는 단순한 소설 쓰기/읽기를 넘어, 사용자가 직접 세계관 속 주인공이 되어 AI 캐릭터와 대화하고, 본인의 의지로 소설의 흐름을 바꾸는 비주얼 서사 경험을 제공합니다.

<img width="1546" height="947" alt="image" src="https://github.com/user-attachments/assets/a7faf614-cc3c-456e-8c20-90fe488c2699" />

---

# 🛠 Tech Stack
## Backend
- **Core:** Java 21, Spring Boot 3.5.9
- **AI:** Spring AI
- **Database:** PostgreSQL 17.7.2
- **ORM:** Spring Data JPA
- **API Spec:** Springdoc OpenAPI 3 (Swagger)

## Frontend
- **Library:** React (v19)
- **State Management:** TanStack Query (v5)
- **Styling:** Tailwind CSS
- **Icons:** Lucide-react

## AI Engine
- **Model:** Google Gemini 2.0 Flash (추후 선택에 따라 Anthropic Claude로 변경 예정)
- **Key Feature:** 소설/대화 맥락 유지 및 Key Event 요약

<br />
<br />

---

# 🌟 Key Features
## 1. 하이브리드 서사 모드(Hybrid Narrative Modes)

**1-1. 소설 작성 모드 (Novel):** 사용자가 웹 소설을 AI와 함께 공동 집필 할 수 있는 서비스.
- **USER Mode:** 사용자의 구체적인 지시사항을 반영한 장면 각색. (리메이크 모드에서도 지원)
- **AUTO Mode:** AI가 이전 맥락을 분석하여 독자적으로 흥미로운 전개를 주도. (리메이크 모드에서도 지원)
  - **가이드형 자동 전개 (Guided AUTO):** 사용자가 원하는 핵심 키워드나 방향성(예: "갑작스러운 습격", "화해의 분위기")을 짧게 입력하면, AI가 이를 씨앗으로 삼아 풍성한 묘사와 돌발 상황을 덧붙여 장면을 완성합니다.
  - **완전 자율형 자동 전개 (Pure AUTO):** 사용자가 아무것도 입력하지 않은 빈 상태로 요청할 경우, AI가 '작가'로서의 주도권을 완전히 갖습니다. 이전의 핵심 사건(Key Event)들을 분석하여 가장 개연성 있고 흥미로운 다음 장면을 스스로 창조합니다.
- **Regenerate:** AI가 도출한 마지막 장면을 재생성. (리메이크 모드에서도 지원) 
- **Modify:** AI가 도출한 마지막 장면을 사용자가 원하는 값으로 수정. (리메이크 모드에서도 지원)

<br />
<img width="1540" height="893" alt="image" src="https://github.com/user-attachments/assets/0a121790-7b42-4bb1-96b3-f4dc0a5d377d" />

<br />
<br />

**1-2. 리메이크 모드 (Remake Mode):** 기존 서사를 바탕으로 새로운 분기점을 창조합니다.
- **전략적 창작 가이드: 유저노트 (Strategic User Note)**
단순한 채팅 맥락을 넘어, 서사 전체를 관통하는 핵심 규칙이나 설정을 AI에게 각인시키는 장기 기억 보조 장치입니다.
- **서사적 강제성 부여:** 유저노트에 적힌 내용은 AI가 장면을 생성할 때 최우선 순위로 참고하는 지침이 됩니다. (예: "주인공은 사실 차가운 성격이지만 유독 여주인공 앞에서는 약해진다", "이 세계관에서 마법을 쓰면 수명이 깎인다")
- **일관된 복선 관리:** 소설이 길어지면 AI가 사소한 설정을 놓칠 수 있는데, 유저노트가 이를 방지하여 서사의 개연성을 유지합니다.
- **동적 치환 시스템:** 서버 로직에서 {캐릭터} 또는 {유저}와 같은 플레이스홀더를 통해 시스템 프롬프트에 직접 주입되어, 매 장면 생성 시마다 AI의 사고 과정을 가이드합니다.

<br />
<img width="1544" height="900" alt="image" src="https://github.com/user-attachments/assets/ebb77560-e6b3-4ec9-8a10-2a74b41e0d90" />

<br />
<br />

**1-3. 호감도 데이트 모드 (Affinity Mode):** 캐릭터와의 실시간 채팅을 통해 변화하는 호감도(Affinity) 시스템.

<br />
<br />

## 2. 지능형 문맥 관리 및 서사 연속성 유지(Intelligent Context Management & Narrative Continuity)
**Amuse는 방대한 소설 분량 속에서도 AI가 일관성을 잃지 않고 이야기를 전개할 수 있도록 전략적 문맥 관리 시스템을 구축했습니다.**
- **장면 단위의 원자적 구조:** 소설의 한 장면(Scene)을 데이터의 최소 단위로 관리하여 서사적 독립성과 연속성을 동시에 확보합니다. 각 장면은 고유한 순서(sequence_order)를 가지며, 이를 통해 긴 서사 속에서도 특정 시점으로의 복구와 각색이 용이합니다.
- **재귀적 핵심 사건 요약 (Key Event Summarization):** 매 5개의 장면이 생성될 때마다 AI가 이전 흐름을 **'핵심 사건(Key Event)'**으로 자동 요약합니다. 이 요약본은 데이터베이스에 저장되어, 전체 대화 이력을 매번 전송하지 않고도 AI가 줄거리의 핵심 줄기를 완벽하게 파악할 수 있도록 돕습니다.
- **슬라이딩 윈도우 기반 맥락 주입:** 최신 3~5개의 상세 메시지와 더불어, 이전 단계에서 생성된 Key Event를 결합하여 AI에게 전달합니다. 이는 토큰 효율성을 극대화하는 동시에, 초반부의 중요한 설정까지 놓치지 않는 장기 기억 유지(Long-term Memory) 효과를 제공합니다.
- **입력과 출력의 데이터 분리 (Metadata Integration):** 사용자의 각색 지시사항(user_input)은 metadata에, AI의 최종 소설 본문(ai_output)은 content에 분리 저장합니다. 이러한 구조는 데이터 응집도를 높이며, 추후 사용자의 개입 내역만 따로 추적하거나 시각화하는 데 유리합니다.

<br />

## 3. 점진적 UX/UI 적용(Progressive UX/UI)
- **낙관적 업데이트(Optimistic Updates):** TanStack Query를 통해 AI 응답 대기 시간 동안 사용자에게 즉각적인 피드백 제공.
- **지연 시간의 가치화 (Meaningful Loading):** AI가 장면을 생성하는 동안 단순한 스피너 대신 "OOO가 대답을 고민중입니다..."와 같은 맥락에 맞는 로딩 상태를 보여주어, 기다림을 '캐릭터와의 소통의 과정'으로 인지하게 만듭니다.

<br />
<img width="786" height="469" alt="image" src="https://github.com/user-attachments/assets/da932638-49f7-42af-a7dc-c4bf91faec3d" />


<br />
<br />

---

# 🚀 Issue Resolved (시스템 안정성 및 사용자 경험(UX) 개선 리포트)

---

# 📝 향후 과제 (Todo List)
[ ] 모바일 최적화 UI/UX 완성

[ ] 반응형 레이아웃을 적용한 모바일 전용 채팅 인터페이스 구현.

[ ] 모바일 환경에서의 터치 이벤트(CoverImageDragger) 안정화 및 가독성 개선.

[ ] 캐릭터 호감도 시스템 고도화

[ ] 서사 전개에 따른 실시간 호감도(Affinity) 변화를 시각화하는 대시보드 추가.

[ ] 호감도 수치에 따른 AI 답변 톤앤매너(Persona)의 동적 변화 정교화.

[ ] 성능 및 비용 최적화

[ ] Key Event 요약 주기 최적화를 통한 API 토큰 비용 절감 및 컨텍스트 효율 향상.

[ ] TanStack Query의 무한 스크롤(useInfiniteQuery)을 활용한 대규모 채팅 로그 로딩 최적화.
