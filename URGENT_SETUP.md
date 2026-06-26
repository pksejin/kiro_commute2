# 🚨 긴급 설정 필요!

## Google Drive 연결 오류 해결

GitHub Pages URL을 Google Cloud Console에 추가해야 합니다.

### 1단계: Google Cloud Console 접속
👉 https://console.cloud.google.com/

`pksejin@gmail.com` 계정으로 로그인

### 2단계: OAuth 2.0 클라이언트 ID 수정

1. 좌측 메뉴: **API 및 서비스** → **사용자 인증 정보**
2. OAuth 2.0 클라이언트 ID 목록에서:
   - **클라이언트 ID**: `781862097489-9l9cslfj0qlfc1mmon6p6hfinrusimbt`
3. 이름 클릭하여 편집 모드 진입

### 3단계: JavaScript 원본 추가

**"승인된 JavaScript 원본"** 섹션에 다음 추가:

```
https://pksejin.github.io
```

### 4단계: 저장

- **"저장"** 버튼 클릭
- 변경사항 적용까지 **5분** 대기

---

## ✅ 설정 후 확인

1. 5분 대기
2. 앱 새로고침
3. "📁 Google Drive 연결" 버튼 클릭
4. 정상 작동 확인!

---

**현재 승인된 JavaScript 원본:**
- http://localhost:8000
- http://127.0.0.1:8000
- http://localhost
- http://127.0.0.1

**추가 필요:**
- ✅ https://pksejin.github.io ← **이것 추가!**
