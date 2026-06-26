// Google API 설정
const CONFIG = {
    // Google API 클라이언트 ID
    CLIENT_ID: '781862097489-9l9cslfj0qlfc1mmon6p6hfinrusimbt.apps.googleusercontent.com',
    
    // Google API Key
    API_KEY: 'AIzaSyBWg5mYoz5UYZhtfN5G_plFDXVl7A-6ofI',
    
    // 사용자 이메일
    USER_EMAIL: 'pksejin@gmail.com',
    
    // Google Drive 폴더 이름
    DRIVE_FOLDER_NAME: 'Kiro',
    
    // 사용할 Google API 스코프
    SCOPES: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/spreadsheets'
    ].join(' '),
    
    // Google Sheets 설정
    SPREADSHEET_NAME: '직원출퇴근관리시스템_데이터',
    
    // 시트 이름들
    SHEETS: {
        COMPANIES: '협력사',
        USERS: '사용자',
        ATTENDANCE: '출퇴근기록'
    }
};
