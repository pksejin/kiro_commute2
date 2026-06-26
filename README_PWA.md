# 📱 직원 출퇴근 관리 시스템 (PWA)

## 🎉 PWA 변환 완료!

GPS 기반 위치 인증 기능이 포함된 Progressive Web App입니다.

---

## 🚀 빠른 시작

### 1. 서버 시작
```cmd
python -m http.server 8000
```

### 2. 브라우저 접속
- **PC**: http://localhost:8000
- **모바일**: http://[PC_IP]:8000

### 3. PWA 설치
- Chrome: 주소창의 "설치" 아이콘 클릭
- iOS Safari: 공유 → "홈 화면에 추가"

---

## ✨ 주요 기능

### 📍 GPS 기반 출퇴근
- 사무실 80m 이내에서만 출퇴근 가능
- 실시간 위치 거리 표시
- 자동 위치 인증

### 📱 PWA 기능
- 홈 화면에 앱 설치
- 오프라인 작동
- 푸시 알림 지원
- 전체 화면 모드

### ☁️ Google Drive 연동
- Kiro 폴더에 자동 저장
- 양방향 동기화
- 클라우드 백업

### 🏢 관리자 기능
- 협력사 위치 관리
- 사용자 관리
- 출퇴근 리포트
- 엑셀 다운로드

---

## 📁 생성된 파일들

### PWA 핵심 파일
- `manifest.json` - PWA 매니페스트
- `service-worker.js` - 서비스 워커
- `pwa-install.js` - 설치 관리

### GPS 기능
- `location-service.js` - 위치 서비스
- `location-methods.js` - 위치 기반 메서드

### 가이드 문서
- `PWA_GUIDE.md` - 상세 사용 가이드
- `README_PWA.md` - 이 문서

### 유틸리티
- `generate-icons.html` - 아이콘 생성기
- `icons/` - 앱 아이콘 폴더

---

## 🔧 필수 설정

### 1. 아이콘 생성
```
1. generate-icons.html 브라우저에서 열기
2. 자동 생성된 아이콘 다운로드
3. icons 폴더에 저장
```

### 2. Google Cloud 설정
이미 완료됨:
- ✅ CLIENT_ID: 설정됨
- ✅ API_KEY: 설정됨
- ✅ OAuth 동의 화면: 설정됨
- ✅ 테스트 사용자: pksejin@gmail.com

### 3. 협력사 위치 설정
```
1. 관리자 모드 진입
2. 협력사 관리 → 협력사 추가/수정
3. 주소 입력 → "주소로 좌표 찾기"
4. 위도/경도 자동 입력
5. 저장
```

---

## 📱 모바일에서 테스트

### Android
1. PC에서 서버 시작
2. PC IP 확인: `ipconfig`
3. 모바일 Chrome에서 http://[PC_IP]:8000 접속
4. 주소창의 "설치" 클릭
5. 위치 권한 허용
6. 홈 화면에서 앱 실행

### iOS
1. PC에서 서버 시작
2. PC IP 확인: `ipconfig`
3. 모바일 Safari에서 http://[PC_IP]:8000 접속
4. 공유 버튼 → "홈 화면에 추가"
5. 위치 권한 허용
6. 홈 화면에서 앱 실행

---

## 🎯 GPS 위치 인증 테스트

### 시나리오 1: 정상 출퇴근
1. 관리자: 현재 위치를 사무실로 설정
2. 직원 선택
3. 위치 상태: "✅ 출퇴근 가능 지역"
4. 출근 버튼 클릭 → 성공

### 시나리오 2: 거리 초과
1. 관리자: 다른 위치를 사무실로 설정
2. 직원 선택
3. 위치 상태: "❌ 출퇴근 불가 지역"
4. 출근 버튼 클릭 → "거리 초과" 오류

### 시나리오 3: 위치 권한 없음
1. 위치 권한 거부
2. 직원 선택
3. 위치 상태: "❌ 위치 확인 실패"
4. 권한 요청 메시지 표시

---

## 🔍 개발자 도구로 확인

### Service Worker
```
Chrome DevTools → Application → Service Workers
- 상태: activated and is running
```

### Manifest
```
Chrome DevTools → Application → Manifest
- 이름: 직원 출퇴근 관리 시스템
- 테마 색상: #667eea
```

### Cache Storage
```
Chrome DevTools → Application → Cache Storage
- attendance-app-v1 확인
```

### Geolocation
```
Chrome DevTools → Console
navigator.geolocation.getCurrentPosition((pos) => console.log(pos))
```

---

## 📊 프로젝트 구조

```
ccc-handson-project/
├── index.html              # 메인 HTML
├── style.css              # 스타일
├── app.js                 # 메인 로직
├── app-init.js            # 초기화
├── config.js              # Google API 설정
├── manifest.json          # PWA 매니페스트
├── service-worker.js      # 서비스 워커
├── pwa-install.js         # PWA 설치 관리
├── location-service.js    # 위치 서비스
├── location-methods.js    # 위치 메서드
├── google-drive-sync.js   # Google Drive 동기화
├── generate-icons.html    # 아이콘 생성기
├── icons/                 # 앱 아이콘
├── PWA_GUIDE.md          # 상세 가이드
└── README_PWA.md         # 이 문서
```

---

## 🐛 문제 해결

### PWA가 설치되지 않음
- HTTPS 또는 localhost 사용 확인
- manifest.json 로드 확인
- Service Worker 등록 확인

### GPS가 작동하지 않음
- 위치 권한 확인
- HTTPS 환경 (localhost는 예외)
- GPS 신호 확인 (실외 이동)

### Google Drive 동기화 실패
- 인터넷 연결 확인
- config.js의 CLIENT_ID, API_KEY 확인
- OAuth 동의 화면 테스트 사용자 확인

---

## 🚀 다음 단계

### 로컬 테스트 완료 후
1. ✅ 아이콘 생성 및 설치
2. ✅ 모바일 테스트
3. ✅ GPS 위치 인증 테스트
4. ✅ Google Drive 동기화 테스트

### 실제 배포 (선택사항)
1. GitHub Pages, Netlify, Vercel 등 선택
2. HTTPS 도메인 설정
3. Google Cloud Console에 도메인 추가
4. 배포 및 테스트

---

## 📞 추가 지원

자세한 내용은 다음 문서를 참고하세요:
- **PWA_GUIDE.md** - 상세 사용 가이드
- **GOOGLE_DRIVE_SETUP.md** - Google Drive 설정
- **RESOLVE_403_ERROR.md** - OAuth 오류 해결

---

**🎉 PWA 변환이 완료되었습니다! 이제 모바일에서 앱처럼 사용하세요!**
