// Google Drive 동기화 관리 클래스
class GoogleDriveSync {
    constructor() {
        this.isSignedIn = false;
        this.spreadsheetId = null;
        this.tokenClient = null;
        this.gapiInited = false;
        this.gisInited = false;
    }

    // Google API 초기화
    async initialize() {
        await this.loadGoogleAPIs();
        this.initializeGapiClient();
        this.initializeGisClient();
    }

    // Google API 스크립트 로드
    loadGoogleAPIs() {
        return new Promise((resolve) => {
            const script1 = document.createElement('script');
            script1.src = 'https://apis.google.com/js/api.js';
            script1.onload = () => {
                gapi.load('client', () => {
                    this.gapiInited = true;
                    this.maybeEnableButtons();
                    resolve();
                });
            };
            document.body.appendChild(script1);

            const script2 = document.createElement('script');
            script2.src = 'https://accounts.google.com/gsi/client';
            script2.onload = () => {
                this.gisInited = true;
                this.maybeEnableButtons();
            };
            document.body.appendChild(script2);
        });
    }

    // GAPI 클라이언트 초기화
    async initializeGapiClient() {
        await gapi.client.init({
            apiKey: CONFIG.API_KEY,
            discoveryDocs: [
                'https://sheets.googleapis.com/$discovery/rest?version=v4',
                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
            ],
        });
    }

    // GIS 클라이언트 초기화
    initializeGisClient() {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CONFIG.CLIENT_ID,
            scope: CONFIG.SCOPES,
            callback: (response) => {
                if (response.error) {
                    console.error('인증 오류:', response);
                    return;
                }
                this.isSignedIn = true;
                this.updateSignInStatus();
                this.loadOrCreateSpreadsheet();
            },
        });
    }

    maybeEnableButtons() {
        if (this.gapiInited && this.gisInited) {
            const syncBtn = document.getElementById('googleSyncBtn');
            if (syncBtn) {
                syncBtn.disabled = false;
            }
        }
    }

    // 로그인/로그아웃 처리
    handleAuthClick() {
        if (this.isSignedIn) {
            this.signOut();
        } else {
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        }
    }

    signOut() {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
            this.isSignedIn = false;
            this.spreadsheetId = null;
            this.updateSignInStatus();
        }
    }

    updateSignInStatus() {
        const syncBtn = document.getElementById('googleSyncBtn');
        const statusDiv = document.getElementById('syncStatus');
        
        if (this.isSignedIn) {
            syncBtn.textContent = '🔄 동기화';
            syncBtn.classList.add('signed-in');
            if (statusDiv) {
                statusDiv.textContent = '✅ Google Drive 연결됨';
                statusDiv.className = 'sync-status connected';
            }
        } else {
            syncBtn.textContent = '📁 Google Drive 연결';
            syncBtn.classList.remove('signed-in');
            if (statusDiv) {
                statusDiv.textContent = '❌ Google Drive 연결 안됨';
                statusDiv.className = 'sync-status disconnected';
            }
        }
    }

    // 스프레드시트 로드 또는 생성
    async loadOrCreateSpreadsheet() {
        try {
            // 먼저 Kiro 폴더 찾기 또는 생성
            const folderId = await this.findOrCreateFolder();
            
            // 저장된 스프레드시트 ID 확인
            const savedId = localStorage.getItem('spreadsheetId');
            
            if (savedId) {
                // 기존 스프레드시트 확인
                try {
                    await gapi.client.sheets.spreadsheets.get({
                        spreadsheetId: savedId
                    });
                    this.spreadsheetId = savedId;
                    console.log('기존 스프레드시트 로드:', savedId);
                    return;
                } catch (e) {
                    console.log('저장된 스프레드시트를 찾을 수 없습니다. 새로 생성합니다.');
                }
            }

            // 폴더 내에서 기존 스프레드시트 검색
            const existingSheet = await this.findSpreadsheetInFolder(folderId);
            if (existingSheet) {
                this.spreadsheetId = existingSheet;
                localStorage.setItem('spreadsheetId', this.spreadsheetId);
                console.log('폴더에서 기존 스프레드시트 발견:', this.spreadsheetId);
                return;
            }

            // 새 스프레드시트 생성
            await this.createSpreadsheet(folderId);
        } catch (error) {
            console.error('스프레드시트 로드/생성 오류:', error);
            alert('스프레드시트 초기화 중 오류가 발생했습니다.');
        }
    }

    // Kiro 폴더 찾기 또는 생성
    async findOrCreateFolder() {
        try {
            // 기존 폴더 검색
            const response = await gapi.client.drive.files.list({
                q: `name='${CONFIG.DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (response.result.files && response.result.files.length > 0) {
                console.log('기존 Kiro 폴더 발견:', response.result.files[0].id);
                return response.result.files[0].id;
            }

            // 폴더 생성
            const folderMetadata = {
                name: CONFIG.DRIVE_FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder'
            };

            const folder = await gapi.client.drive.files.create({
                resource: folderMetadata,
                fields: 'id'
            });

            console.log('새 Kiro 폴더 생성:', folder.result.id);
            return folder.result.id;
        } catch (error) {
            console.error('폴더 찾기/생성 오류:', error);
            throw error;
        }
    }

    // 폴더 내에서 기존 스프레드시트 찾기
    async findSpreadsheetInFolder(folderId) {
        try {
            const response = await gapi.client.drive.files.list({
                q: `name='${CONFIG.SPREADSHEET_NAME}' and '${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (response.result.files && response.result.files.length > 0) {
                return response.result.files[0].id;
            }

            return null;
        } catch (error) {
            console.error('스프레드시트 검색 오류:', error);
            return null;
        }
    }

    // 새 스프레드시트 생성
    async createSpreadsheet(folderId) {
        try {
            const response = await gapi.client.sheets.spreadsheets.create({
                properties: {
                    title: CONFIG.SPREADSHEET_NAME
                },
                sheets: [
                    { properties: { title: CONFIG.SHEETS.COMPANIES } },
                    { properties: { title: CONFIG.SHEETS.USERS } },
                    { properties: { title: CONFIG.SHEETS.ATTENDANCE } }
                ]
            });

            this.spreadsheetId = response.result.spreadsheetId;

            // 스프레드시트를 Kiro 폴더로 이동
            await gapi.client.drive.files.update({
                fileId: this.spreadsheetId,
                addParents: folderId,
                fields: 'id, parents'
            });

            localStorage.setItem('spreadsheetId', this.spreadsheetId);

            // 헤더 추가
            await this.initializeSheetHeaders();

            console.log('스프레드시트 생성 완료:', this.spreadsheetId);
            alert(`✅ 새로운 Google Sheets가 생성되었습니다!\n📁 위치: Google Drive > ${CONFIG.DRIVE_FOLDER_NAME} 폴더`);
        } catch (error) {
            console.error('스프레드시트 생성 오류:', error);
            throw error;
        }
    }

    // 시트 헤더 초기화
    async initializeSheetHeaders() {
        const requests = [
            {
                range: `${CONFIG.SHEETS.COMPANIES}!A1:H1`,
                values: [['ID', '협력사명', '협력사코드', '담당자', '연락처', '이메일', '주소', '등록일']]
            },
            {
                range: `${CONFIG.SHEETS.USERS}!A1:H1`,
                values: [['ID', '협력사ID', '사용자명', '사번', '직급', '연락처', '이메일', '등록일']]
            },
            {
                range: `${CONFIG.SHEETS.ATTENDANCE}!A1:G1`,
                values: [['사용자ID', '날짜', '출근시간', '퇴근시간', '휴게시간(분)', '휴게기록', '근무시간(분)']]
            }
        ];

        for (const request of requests) {
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: request.range,
                valueInputOption: 'RAW',
                resource: { values: request.values }
            });
        }
    }

    // 데이터 동기화 (업로드)
    async syncToGoogleSheets(data) {
        if (!this.isSignedIn || !this.spreadsheetId) {
            alert('먼저 Google Drive에 연결해주세요.');
            return false;
        }

        try {
            // 협력사 데이터 동기화
            await this.syncCompanies(data.companies);
            
            // 사용자 데이터 동기화
            await this.syncUsers(data.users);
            
            // 출퇴근 데이터 동기화
            await this.syncAttendance(data.attendanceData);

            alert('✅ Google Sheets에 동기화 완료!');
            return true;
        } catch (error) {
            console.error('동기화 오류:', error);
            alert('동기화 중 오류가 발생했습니다.');
            return false;
        }
    }

    async syncCompanies(companies) {
        const values = companies.map(c => [
            c.id,
            c.name,
            c.code,
            c.contact || '',
            c.phone || '',
            c.email || '',
            c.address || '',
            c.createdAt
        ]);

        await gapi.client.sheets.spreadsheets.values.clear({
            spreadsheetId: this.spreadsheetId,
            range: `${CONFIG.SHEETS.COMPANIES}!A2:H`
        });

        if (values.length > 0) {
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${CONFIG.SHEETS.COMPANIES}!A2`,
                valueInputOption: 'RAW',
                resource: { values }
            });
        }
    }

    async syncUsers(users) {
        const values = users.map(u => [
            u.id,
            u.companyId,
            u.name,
            u.employeeId || '',
            u.position || '',
            u.phone || '',
            u.email || '',
            u.createdAt
        ]);

        await gapi.client.sheets.spreadsheets.values.clear({
            spreadsheetId: this.spreadsheetId,
            range: `${CONFIG.SHEETS.USERS}!A2:H`
        });

        if (values.length > 0) {
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${CONFIG.SHEETS.USERS}!A2`,
                valueInputOption: 'RAW',
                resource: { values }
            });
        }
    }

    async syncAttendance(attendanceData) {
        const values = [];

        Object.keys(attendanceData).forEach(userId => {
            const userRecords = attendanceData[userId];
            Object.keys(userRecords).forEach(date => {
                const record = userRecords[date];
                const breakMinutes = record.breaks ? 
                    record.breaks.reduce((sum, b) => sum + Math.floor(b.duration / 60), 0) : 0;
                
                const workMinutes = record.checkOut ? 
                    Math.floor((new Date(record.checkOut) - new Date(record.checkIn)) / (1000 * 60)) - breakMinutes : 0;

                values.push([
                    userId,
                    date,
                    record.checkIn,
                    record.checkOut || '',
                    breakMinutes,
                    record.breaks ? JSON.stringify(record.breaks) : '',
                    workMinutes
                ]);
            });
        });

        await gapi.client.sheets.spreadsheets.values.clear({
            spreadsheetId: this.spreadsheetId,
            range: `${CONFIG.SHEETS.ATTENDANCE}!A2:G`
        });

        if (values.length > 0) {
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${CONFIG.SHEETS.ATTENDANCE}!A2`,
                valueInputOption: 'RAW',
                resource: { values }
            });
        }
    }

    // 데이터 불러오기 (다운로드)
    async loadFromGoogleSheets() {
        if (!this.isSignedIn || !this.spreadsheetId) {
            alert('먼저 Google Drive에 연결해주세요.');
            return null;
        }

        try {
            const [companies, users, attendance] = await Promise.all([
                this.loadCompanies(),
                this.loadUsers(),
                this.loadAttendance()
            ]);

            alert('✅ Google Sheets에서 데이터를 불러왔습니다!');
            
            return {
                companies,
                users,
                attendanceData: attendance
            };
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            alert('데이터 로드 중 오류가 발생했습니다.');
            return null;
        }
    }

    async loadCompanies() {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${CONFIG.SHEETS.COMPANIES}!A2:H`
        });

        const rows = response.result.values || [];
        return rows.map(row => ({
            id: row[0],
            name: row[1],
            code: row[2],
            contact: row[3],
            phone: row[4],
            email: row[5],
            address: row[6],
            createdAt: row[7]
        }));
    }

    async loadUsers() {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${CONFIG.SHEETS.USERS}!A2:H`
        });

        const rows = response.result.values || [];
        return rows.map(row => ({
            id: row[0],
            companyId: row[1],
            name: row[2],
            employeeId: row[3],
            position: row[4],
            phone: row[5],
            email: row[6],
            createdAt: row[7]
        }));
    }

    async loadAttendance() {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${CONFIG.SHEETS.ATTENDANCE}!A2:G`
        });

        const rows = response.result.values || [];
        const attendanceData = {};

        rows.forEach(row => {
            const userId = row[0];
            const date = row[1];
            
            if (!attendanceData[userId]) {
                attendanceData[userId] = {};
            }

            attendanceData[userId][date] = {
                checkIn: row[2],
                checkOut: row[3] || null,
                breaks: row[5] ? JSON.parse(row[5]) : []
            };
        });

        return attendanceData;
    }

    // 스프레드시트 열기
    openSpreadsheet() {
        if (this.spreadsheetId) {
            window.open(`https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`, '_blank');
        } else {
            alert('먼저 Google Drive에 연결해주세요.');
        }
    }
}
