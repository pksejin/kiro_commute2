// 전역 변수
let googleDriveSync;

// Google Drive 동기화 초기화
document.addEventListener('DOMContentLoaded', async () => {
    googleDriveSync = new GoogleDriveSync();
    
    // Google API 초기화
    await googleDriveSync.initialize();
    
    // Google Drive 동기화 버튼 이벤트
    document.getElementById('googleSyncBtn').addEventListener('click', async () => {
        if (!googleDriveSync.isSignedIn) {
            googleDriveSync.handleAuthClick();
        } else {
            // 동기화 옵션 선택
            const action = confirm('OK = 업로드 (로컬 → Google Drive)\nCancel = 다운로드 (Google Drive → 로컬)');
            
            if (action) {
                // 업로드
                const data = {
                    companies: attendanceManager.companies,
                    users: attendanceManager.users,
                    attendanceData: attendanceManager.attendanceData
                };
                await googleDriveSync.syncToGoogleSheets(data);
            } else {
                // 다운로드
                const data = await googleDriveSync.loadFromGoogleSheets();
                if (data) {
                    attendanceManager.companies = data.companies;
                    attendanceManager.users = data.users;
                    attendanceManager.attendanceData = data.attendanceData;
                    
                    // 로컬 스토리지에 저장
                    localStorage.setItem('companies', JSON.stringify(data.companies));
                    localStorage.setItem('users', JSON.stringify(data.users));
                    localStorage.setItem('attendanceData', JSON.stringify(data.attendanceData));
                    
                    // employees 배열도 업데이트
                    attendanceManager.employees = data.users.map(u => ({
                        id: u.id,
                        name: u.name,
                        companyId: u.companyId,
                        createdAt: u.createdAt
                    }));
                    localStorage.setItem('employees', JSON.stringify(attendanceManager.employees));
                    
                    // UI 새로고침
                    attendanceManager.loadEmployees();
                    attendanceManager.loadCompanies();
                    attendanceManager.loadUsers();
                    attendanceManager.updateUI();
                    
                    if (attendanceManager.currentMode === 'admin') {
                        attendanceManager.loadAdminData();
                    }
                }
            }
        }
    });
});
