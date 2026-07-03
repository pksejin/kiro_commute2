class AttendanceManager {
    constructor() {
        this.employees = JSON.parse(localStorage.getItem('employees')) || [];
        this.companies = JSON.parse(localStorage.getItem('companies')) || [];
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentEmployee = null;
        this.attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || {};
        this.breakTimer = null;
        this.breakStartTime = null;
        this.breakDuration = 0;
        this.currentMode = 'user';
        this.currentAdminTab = 'companyManagement';
        this.locationService = new LocationService();
        this.currentLocation = null;
        
        this.initializeApp();
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);
    }

    initializeApp() {
        this.loadEmployees();
        this.loadCompanies();
        this.loadUsers();
        this.bindEvents();
        this.bindAdminEvents();
        this.updateUI();
        this.initializeDateFilters();
    }

    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('currentTime').textContent = timeString;
    }

    loadEmployees() {
        const select = document.getElementById('employeeSelect');
        select.innerHTML = '<option value="">직원을 선택하세요</option>';
        
        this.employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = employee.name;
            select.appendChild(option);
        });
    }

    bindEvents() {
        // 직원 관련 이벤트
        document.getElementById('employeeSelect').addEventListener('change', (e) => {
            this.selectEmployee(e.target.value);
        });

        document.getElementById('addEmployeeBtn').addEventListener('click', () => {
            this.showAddEmployeeForm();
        });

        document.getElementById('saveEmployeeBtn').addEventListener('click', () => {
            this.saveEmployee();
        });

        document.getElementById('cancelEmployeeBtn').addEventListener('click', () => {
            this.hideAddEmployeeForm();
        });

        // 출퇴근 관련 이벤트
        document.getElementById('checkInBtn').addEventListener('click', () => {
            this.checkIn();
        });

        document.getElementById('checkOutBtn').addEventListener('click', () => {
            this.checkOut();
        });

        // 휴게시간 관련 이벤트
        document.getElementById('startBreakBtn').addEventListener('click', () => {
            this.startBreak();
        });

        document.getElementById('endBreakBtn').addEventListener('click', () => {
            this.endBreak();
        });

        // 프리셋 시간 버튼
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.dataset.minutes);
                this.setBreakTimer(minutes);
            });
        });

        // 모드 전환
        document.getElementById('userModeBtn').addEventListener('click', () => {
            this.switchMode('user');
        });

        document.getElementById('adminModeBtn').addEventListener('click', () => {
            this.switchMode('admin');
        });
    }

    bindAdminEvents() {
        // 관리자 탭 전환
        document.getElementById('companyManagementTab').addEventListener('click', () => {
            this.switchAdminTab('companyManagement');
        });

        document.getElementById('userManagementTab').addEventListener('click', () => {
            this.switchAdminTab('userManagement');
        });

        document.getElementById('attendanceReportTab').addEventListener('click', () => {
            this.switchAdminTab('attendanceReport');
        });

        // 협력사 관리
        document.getElementById('saveCompanyBtn').addEventListener('click', () => {
            this.saveCompany();
        });

        document.getElementById('cancelCompanyBtn').addEventListener('click', () => {
            this.clearCompanyForm(); // 폼 숨기지 않고 내용만 초기화
        });

        // 수정 폼 버튼
        document.getElementById('updateCompanyBtn').addEventListener('click', () => {
            if (this._editingCompanyId) this.updateCompany(this._editingCompanyId);
        });

        document.getElementById('cancelEditCompanyBtn').addEventListener('click', () => {
            this.hideEditCompanyForm();
        });

        // 위치 정보 관련 이벤트 (추가 폼)
        document.getElementById('getLocationBtn').addEventListener('click', () => {
            this.getCurrentOfficeLocation('add');
        });

        document.getElementById('geocodeBtn').addEventListener('click', () => {
            this.geocodeOfficeAddress('add');
        });

        // 위치 정보 관련 이벤트 (수정 폼)
        document.getElementById('editGetLocationBtn').addEventListener('click', () => {
            this.getCurrentOfficeLocation('edit');
        });

        document.getElementById('editGeocodeBtn').addEventListener('click', () => {
            this.geocodeOfficeAddress('edit');
        });

        // 사용자 관리
        document.getElementById('saveUserBtn').addEventListener('click', () => {
            this.saveUser();
        });

        document.getElementById('cancelUserBtn').addEventListener('click', () => {
            this.clearUserForm(); // 내용만 초기화
        });

        document.getElementById('updateUserBtn').addEventListener('click', () => {
            if (this._editingUserId) this.updateUser(this._editingUserId);
        });

        document.getElementById('cancelEditUserBtn').addEventListener('click', () => {
            this.hideEditUserForm();
        });

        // 필터 이벤트
        document.getElementById('companyFilter').addEventListener('change', () => {
            this.filterUsers();
        });

        document.getElementById('reportCompanyFilter').addEventListener('click', () => {
            this.updateReportUserFilter();
        });

        // 리포트 조회
        document.getElementById('searchReportBtn').addEventListener('click', () => {
            this.searchAttendanceReport();
        });

        document.getElementById('exportReportBtn').addEventListener('click', () => {
            this.exportReport();
        });
    }

    // 모드 전환
    switchMode(mode) {
        this.currentMode = mode;
        
        document.getElementById('userModeBtn').classList.toggle('active', mode === 'user');
        document.getElementById('adminModeBtn').classList.toggle('active', mode === 'admin');
        
        document.getElementById('userMode').style.display = mode === 'user' ? 'block' : 'none';
        document.getElementById('adminMode').style.display = mode === 'admin' ? 'block' : 'none';
        
        if (mode === 'admin') {
            this.loadAdminData();
        }
    }

    switchAdminTab(tab) {
        this.currentAdminTab = tab;
        
        // 탭 버튼 활성화
        document.querySelectorAll('.admin-tab').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tab + 'Tab').classList.add('active');
        
        // 섹션 표시/숨김
        document.querySelectorAll('.admin-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(tab).style.display = 'block';
        
        // 데이터 로드
        if (tab === 'companyManagement') {
            this.loadCompanyTable();
        } else if (tab === 'userManagement') {
            this.loadUserTable();
            this.updateCompanyFilters();
            this.updateUserCompanySelector(); // 추가 폼 협력사 드롭다운 갱신
            this.hideEditUserForm();          // 수정 폼 초기화
        } else if (tab === 'attendanceReport') {
            this.updateReportFilters();
        }
    }

    // 협력사 관리
    loadCompanies() {
        // 기본 데이터가 없으면 샘플 데이터 생성
        if (this.companies.length === 0) {
            this.companies = [
                {
                    id: '1',
                    name: '테크솔루션',
                    code: 'TECH001',
                    contact: '김담당',
                    phone: '02-1234-5678',
                    email: 'contact@techsol.com',
                    address: '서울시 강남구',
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('companies', JSON.stringify(this.companies));
        }
    }

    showAddCompanyForm() {
        // 추가 폼은 항상 열려있으므로 수정 폼만 닫기
        document.getElementById('editCompanyForm').style.display = 'none';
        document.getElementById('companyName').focus();
    }

    hideAddCompanyForm() {
        // 추가 폼은 숨기지 않고 내용만 초기화
        this.clearCompanyForm();
    }

    showEditCompanyForm(id) {
        this._editingCompanyId = id;
        document.getElementById('editCompanyForm').style.display = 'block';
        // 수정 폼으로 스크롤
        document.getElementById('editCompanyForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    hideEditCompanyForm() {
        document.getElementById('editCompanyForm').style.display = 'none';
        this._editingCompanyId = null;
        this.clearEditCompanyForm();
    }

    clearCompanyForm() {
        document.getElementById('companyName').value = '';
        document.getElementById('companyCode').value = '';
        document.getElementById('companyContact').value = '';
        document.getElementById('companyEmail').value = '';
        document.getElementById('companyAddress').value = '';
        document.getElementById('companyLatitude').value = '';
        document.getElementById('companyLongitude').value = '';
    }

    clearEditCompanyForm() {
        document.getElementById('editCompanyName').value = '';
        document.getElementById('editCompanyCode').value = '';
        document.getElementById('editCompanyContact').value = '';
        document.getElementById('editCompanyEmail').value = '';
        document.getElementById('editCompanyAddress').value = '';
        document.getElementById('editCompanyLatitude').value = '';
        document.getElementById('editCompanyLongitude').value = '';
        document.getElementById('editCompanyFormTitle').textContent = '협력사 수정';
    }

    saveCompany() {
        const name = document.getElementById('companyName').value.trim();
        const code = document.getElementById('companyCode').value.trim();
        const contact = document.getElementById('companyContact').value.trim();
        const email = document.getElementById('companyEmail').value.trim();
        const address = document.getElementById('companyAddress').value.trim();
        const latitude = parseFloat(document.getElementById('companyLatitude').value) || null;
        const longitude = parseFloat(document.getElementById('companyLongitude').value) || null;

        if (!name || !code) {
            alert('협력사명과 협력사 코드는 필수입니다.');
            return;
        }

        // 중복 체크
        if (this.companies.some(c => c.code === code)) {
            alert('이미 존재하는 협력사 코드입니다.');
            return;
        }

        // 위경도 유효성 검사
        if ((latitude && !longitude) || (!latitude && longitude)) {
            alert('위도와 경도를 모두 입력하거나 모두 비워두세요.');
            return;
        }

        if (latitude && (latitude < -90 || latitude > 90)) {
            alert('유효하지 않은 위도값입니다. (-90 ~ 90 범위)');
            return;
        }

        if (longitude && (longitude < -180 || longitude > 180)) {
            alert('유효하지 않은 경도값입니다. (-180 ~ 180 범위)');
            return;
        }

        const company = {
            id: Date.now().toString(),
            name,
            code,
            contact,
            phone: contact,
            email,
            address,
            latitude,
            longitude,
            createdAt: new Date().toISOString()
        };

        this.companies.push(company);
        localStorage.setItem('companies', JSON.stringify(this.companies));
        
        this.clearCompanyForm(); // 폼 내용만 초기화, 닫지 않음
        this.loadCompanyTable();
        this.updateCompanySelectors();
        alert('✅ 협력사가 등록되었습니다.');
    }

    loadCompanyTable() {
        const tbody = document.getElementById('companyTableBody');
        tbody.innerHTML = '';

        this.companies.forEach(company => {
            const row = document.createElement('tr');
            const locationInfo = company.latitude && company.longitude
                ? `<span style="color: #34a853;">✓ 설정됨</span>`
                : `<span style="color: #999;">미설정</span>`;
            
            row.innerHTML = `
                <td>${company.name}</td>
                <td>${company.code}</td>
                <td class="hide-mobile">${company.contact || '-'}</td>
                <td class="hide-mobile">${company.phone || '-'}</td>
                <td>${locationInfo}</td>
                <td class="hide-mobile">${new Date(company.createdAt).toLocaleDateString('ko-KR')}</td>
                <td>
                    <button class="action-btn edit" onclick="attendanceManager.editCompany('${company.id}')">수정</button>
                    <button class="action-btn delete" onclick="attendanceManager.deleteCompany('${company.id}')">삭제</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    editCompany(id) {
        const company = this.companies.find(c => c.id === id);
        if (!company) return;

        // 수정 폼에 데이터 채우기
        document.getElementById('editCompanyName').value = company.name;
        document.getElementById('editCompanyCode').value = company.code;
        document.getElementById('editCompanyContact').value = company.contact || '';
        document.getElementById('editCompanyEmail').value = company.email || '';
        document.getElementById('editCompanyAddress').value = company.address || '';
        document.getElementById('editCompanyLatitude').value = company.latitude || '';
        document.getElementById('editCompanyLongitude').value = company.longitude || '';

        // 제목에 협력사명 표시
        document.getElementById('editCompanyFormTitle').textContent = `"${company.name}" 수정`;

        this.showEditCompanyForm(id);
    }

    updateCompany(id) {
        const company = this.companies.find(c => c.id === id);
        if (!company) return;

        const name = document.getElementById('editCompanyName').value.trim();
        const code = document.getElementById('editCompanyCode').value.trim();
        const contact = document.getElementById('editCompanyContact').value.trim();
        const email = document.getElementById('editCompanyEmail').value.trim();
        const address = document.getElementById('editCompanyAddress').value.trim();
        const latitude = parseFloat(document.getElementById('editCompanyLatitude').value) || null;
        const longitude = parseFloat(document.getElementById('editCompanyLongitude').value) || null;

        if (!name || !code) {
            alert('협력사명과 협력사 코드는 필수입니다.');
            return;
        }

        // 중복 체크 (자기 자신 제외)
        if (this.companies.some(c => c.code === code && c.id !== id)) {
            alert('이미 존재하는 협력사 코드입니다.');
            return;
        }

        // 위경도 유효성 검사
        if ((latitude && !longitude) || (!latitude && longitude)) {
            alert('위도와 경도를 모두 입력하거나 모두 비워두세요.');
            return;
        }

        if (latitude && (latitude < -90 || latitude > 90)) {
            alert('유효하지 않은 위도값입니다. (-90 ~ 90 범위)');
            return;
        }

        if (longitude && (longitude < -180 || longitude > 180)) {
            alert('유효하지 않은 경도값입니다. (-180 ~ 180 범위)');
            return;
        }

        company.name = name;
        company.code = code;
        company.contact = contact;
        company.phone = contact;
        company.email = email;
        company.address = address;
        company.latitude = latitude;
        company.longitude = longitude;

        localStorage.setItem('companies', JSON.stringify(this.companies));

        alert('✅ 수정이 완료되었습니다.');

        this.hideEditCompanyForm();
        this.loadCompanyTable();
        this.updateCompanySelectors();
    }

    deleteCompany(id) {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        this.companies = this.companies.filter(c => c.id !== id);
        localStorage.setItem('companies', JSON.stringify(this.companies));
        
        this.loadCompanyTable();
        this.updateCompanySelectors();
    }

    // 사용자 관리
    loadUsers() {
        // 기본 데이터가 없으면 샘플 데이터 생성
        if (this.users.length === 0 && this.companies.length > 0) {
            this.users = [
                {
                    id: '1',
                    companyId: this.companies[0].id,
                    name: '홍길동',
                    employeeId: 'EMP001',
                    position: '대리',
                    phone: '010-1234-5678',
                    email: 'hong@example.com',
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('users', JSON.stringify(this.users));
        }
    }

    showAddUserForm() {
        this.updateUserCompanySelector();
        // 추가 폼은 항상 열려있으므로 수정 폼만 닫기
        document.getElementById('editUserForm').style.display = 'none';
        document.getElementById('userName').focus();
    }

    hideAddUserForm() {
        // 추가 폼은 숨기지 않고 내용만 초기화
        this.clearUserForm();
    }

    showEditUserForm(id) {
        this._editingUserId = id;
        this.updateEditUserCompanySelector();
        document.getElementById('editUserForm').style.display = 'block';
        document.getElementById('editUserForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    hideEditUserForm() {
        document.getElementById('editUserForm').style.display = 'none';
        this._editingUserId = null;
        this.clearEditUserForm();
    }

    clearUserForm() {
        document.getElementById('userCompany').value = '';
        document.getElementById('userName').value = '';
        document.getElementById('userEmployeeId').value = '';
        document.getElementById('userPosition').value = '';
        document.getElementById('userPhone').value = '';
        document.getElementById('userEmail').value = '';
    }

    clearEditUserForm() {
        document.getElementById('editUserCompany').value = '';
        document.getElementById('editUserName').value = '';
        document.getElementById('editUserEmployeeId').value = '';
        document.getElementById('editUserPosition').value = '';
        document.getElementById('editUserPhone').value = '';
        document.getElementById('editUserEmail').value = '';
        document.getElementById('editUserFormTitle').textContent = '사용자 수정';
    }

    updateUserCompanySelector() {
        const select = document.getElementById('userCompany');
        select.innerHTML = '<option value="">협력사 선택 *</option>';
        this.companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            select.appendChild(option);
        });
    }

    updateEditUserCompanySelector() {
        const select = document.getElementById('editUserCompany');
        select.innerHTML = '<option value="">협력사 선택 *</option>';
        this.companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            select.appendChild(option);
        });
    }

    saveUser() {
        const companyId = document.getElementById('userCompany').value;
        const name = document.getElementById('userName').value.trim();
        const employeeId = document.getElementById('userEmployeeId').value.trim();
        const position = document.getElementById('userPosition').value.trim();
        const phone = document.getElementById('userPhone').value.trim();
        const email = document.getElementById('userEmail').value.trim();

        if (!companyId || !name) {
            alert('협력사와 사용자명은 필수입니다.');
            return;
        }

        const user = {
            id: Date.now().toString(),
            companyId,
            name,
            employeeId,
            position,
            phone,
            email,
            createdAt: new Date().toISOString()
        };

        this.users.push(user);
        localStorage.setItem('users', JSON.stringify(this.users));
        
        // 기존 employees 배열에도 추가 (호환성)
        const employee = {
            id: user.id,
            name: user.name,
            companyId: user.companyId,
            createdAt: user.createdAt
        };
        this.employees.push(employee);
        localStorage.setItem('employees', JSON.stringify(this.employees));
        
        this.clearUserForm(); // 폼 내용만 초기화
        this.loadUserTable();
        this.loadEmployees();
        alert('✅ 사용자가 등록되었습니다.');
    }

    loadUserTable() {
        const tbody = document.getElementById('userTableBody');
        tbody.innerHTML = '';

        const filteredUsers = this.getFilteredUsers();

        filteredUsers.forEach(user => {
            const company = this.companies.find(c => c.id === user.companyId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${company ? company.name : '알 수 없음'}</td>
                <td>${user.name}</td>
                <td class="hide-mobile">${user.employeeId || '-'}</td>
                <td>${user.position || '-'}</td>
                <td class="hide-mobile">${user.phone || '-'}</td>
                <td class="hide-mobile">${new Date(user.createdAt).toLocaleDateString('ko-KR')}</td>
                <td>
                    <button class="action-btn edit" onclick="attendanceManager.editUser('${user.id}')">수정</button>
                    <button class="action-btn delete" onclick="attendanceManager.deleteUser('${user.id}')">삭제</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getFilteredUsers() {
        const companyFilter = document.getElementById('companyFilter').value;
        if (!companyFilter) return this.users;
        return this.users.filter(user => user.companyId === companyFilter);
    }

    filterUsers() {
        this.loadUserTable();
    }

    updateCompanyFilters() {
        const filters = ['companyFilter', 'reportCompanyFilter'];
        
        filters.forEach(filterId => {
            const select = document.getElementById(filterId);
            const currentValue = select.value;
            select.innerHTML = '<option value="">전체 협력사</option>';
            
            this.companies.forEach(company => {
                const option = document.createElement('option');
                option.value = company.id;
                option.textContent = company.name;
                select.appendChild(option);
            });
            
            select.value = currentValue;
        });
    }

    updateCompanySelectors() {
        this.updateCompanyFilters();
        this.updateUserCompanySelector();
        this.updateEditUserCompanySelector();
    }

    editUser(id) {
        const user = this.users.find(u => u.id === id);
        if (!user) return;

        // 수정 폼에 데이터 채우기
        this.showEditUserForm(id);

        document.getElementById('editUserCompany').value = user.companyId;
        document.getElementById('editUserName').value = user.name;
        document.getElementById('editUserEmployeeId').value = user.employeeId || '';
        document.getElementById('editUserPosition').value = user.position || '';
        document.getElementById('editUserPhone').value = user.phone || '';
        document.getElementById('editUserEmail').value = user.email || '';

        // 제목에 사용자명 표시
        document.getElementById('editUserFormTitle').textContent = `"${user.name}" 수정`;
    }

    updateUser(id) {
        const user = this.users.find(u => u.id === id);
        if (!user) return;

        const companyId = document.getElementById('editUserCompany').value;
        const name = document.getElementById('editUserName').value.trim();

        if (!companyId || !name) {
            alert('협력사와 사용자명은 필수입니다.');
            return;
        }

        user.companyId = companyId;
        user.name = name;
        user.employeeId = document.getElementById('editUserEmployeeId').value.trim();
        user.position = document.getElementById('editUserPosition').value.trim();
        user.phone = document.getElementById('editUserPhone').value.trim();
        user.email = document.getElementById('editUserEmail').value.trim();

        localStorage.setItem('users', JSON.stringify(this.users));

        // employees 배열도 업데이트
        const employee = this.employees.find(e => e.id === id);
        if (employee) {
            employee.name = user.name;
            employee.companyId = user.companyId;
            localStorage.setItem('employees', JSON.stringify(this.employees));
        }

        alert('✅ 수정이 완료되었습니다.');
        this.hideEditUserForm();
        this.loadUserTable();
        this.loadEmployees();
    }

    deleteUser(id) {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        this.users = this.users.filter(u => u.id !== id);
        this.employees = this.employees.filter(e => e.id !== id);
        
        localStorage.setItem('users', JSON.stringify(this.users));
        localStorage.setItem('employees', JSON.stringify(this.employees));
        
        this.loadUserTable();
        this.loadEmployees();
    }

    // 출퇴근 리포트
    initializeDateFilters() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        document.getElementById('reportDateFrom').value = firstDay.toISOString().split('T')[0];
        document.getElementById('reportDateTo').value = today.toISOString().split('T')[0];
    }

    updateReportFilters() {
        this.updateCompanyFilters();
        this.updateReportUserFilter();
    }

    updateReportUserFilter() {
        const companyId = document.getElementById('reportCompanyFilter').value;
        const userSelect = document.getElementById('reportUserFilter');
        
        userSelect.innerHTML = '<option value="">전체 사용자</option>';
        
        const filteredUsers = companyId ? 
            this.users.filter(u => u.companyId === companyId) : 
            this.users;
            
        filteredUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });
    }

    searchAttendanceReport() {
        const companyId = document.getElementById('reportCompanyFilter').value;
        const userId = document.getElementById('reportUserFilter').value;
        const dateFrom = document.getElementById('reportDateFrom').value;
        const dateTo = document.getElementById('reportDateTo').value;

        const reportData = this.generateReportData(companyId, userId, dateFrom, dateTo);
        this.displayReportData(reportData);
        this.updateReportSummary(reportData);
    }

    generateReportData(companyId, userId, dateFrom, dateTo) {
        const reportData = [];
        const startDate = new Date(dateFrom);
        const endDate = new Date(dateTo);

        // 필터링된 사용자 목록
        let targetUsers = this.users;
        if (companyId) {
            targetUsers = targetUsers.filter(u => u.companyId === companyId);
        }
        if (userId) {
            targetUsers = targetUsers.filter(u => u.id === userId);
        }

        targetUsers.forEach(user => {
            const userAttendance = this.attendanceData[user.id] || {};
            
            for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
                const dateKey = date.toISOString().split('T')[0];
                const dayData = userAttendance[dateKey];
                
                if (dayData && dayData.checkIn) {
                    const company = this.companies.find(c => c.id === user.companyId);
                    
                    reportData.push({
                        date: dateKey,
                        company: company ? company.name : '알 수 없음',
                        userName: user.name,
                        checkIn: dayData.checkIn,
                        checkOut: dayData.checkOut,
                        breaks: dayData.breaks || [],
                        user: user
                    });
                }
            }
        });

        return reportData.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    displayReportData(reportData) {
        const tbody = document.getElementById('attendanceTableBody');
        tbody.innerHTML = '';

        reportData.forEach(record => {
            const checkInTime = new Date(record.checkIn).toLocaleTimeString('ko-KR');
            const checkOutTime = record.checkOut ? 
                new Date(record.checkOut).toLocaleTimeString('ko-KR') : '-';

            // 근무시간 계산
            let workHours = '-';
            if (record.checkOut) {
                const workMinutes = Math.floor((new Date(record.checkOut) - new Date(record.checkIn)) / (1000 * 60));
                const breakMinutes = record.breaks.reduce((total, b) => total + Math.floor(b.duration / 60), 0);
                const netWorkMinutes = workMinutes - breakMinutes;
                const hours = Math.floor(netWorkMinutes / 60);
                const minutes = netWorkMinutes % 60;
                workHours = `${hours}:${minutes.toString().padStart(2, '0')}`;
            }

            // 휴게시간 계산
            const totalBreakMinutes = record.breaks.reduce((total, b) => total + Math.floor(b.duration / 60), 0);
            const breakHours = `${Math.floor(totalBreakMinutes / 60)}:${(totalBreakMinutes % 60).toString().padStart(2, '0')}`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(record.date).toLocaleDateString('ko-KR')}</td>
                <td>${record.company}</td>
                <td>${record.userName}</td>
                <td>${checkInTime}</td>
                <td>${checkOutTime}</td>
                <td>${workHours}</td>
                <td>${breakHours}</td>
                <td>
                    <button class="action-btn view" onclick="attendanceManager.viewAttendanceDetail('${record.user.id}', '${record.date}')">상세</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        if (reportData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">조회된 데이터가 없습니다.</td></tr>';
        }
    }

    updateReportSummary(reportData) {
        const totalDays = reportData.length;
        let totalWorkMinutes = 0;
        let totalBreakMinutes = 0;

        reportData.forEach(record => {
            if (record.checkOut) {
                const workMinutes = Math.floor((new Date(record.checkOut) - new Date(record.checkIn)) / (1000 * 60));
                const breakMinutes = record.breaks.reduce((total, b) => total + Math.floor(b.duration / 60), 0);
                totalWorkMinutes += (workMinutes - breakMinutes);
                totalBreakMinutes += breakMinutes;
            }
        });

        document.getElementById('totalWorkDays').textContent = totalDays;
        document.getElementById('totalWorkHours').textContent = 
            `${Math.floor(totalWorkMinutes / 60)}시간 ${totalWorkMinutes % 60}분`;
        document.getElementById('totalBreakHours').textContent = 
            `${Math.floor(totalBreakMinutes / 60)}시간 ${totalBreakMinutes % 60}분`;
    }

    viewAttendanceDetail(userId, date) {
        const user = this.users.find(u => u.id === userId);
        const dayData = this.attendanceData[userId] && this.attendanceData[userId][date];
        
        if (!user || !dayData) return;

        let detailHtml = `${user.name} - ${new Date(date).toLocaleDateString('ko-KR')} 상세 기록\n\n`;
        detailHtml += `출근: ${new Date(dayData.checkIn).toLocaleTimeString('ko-KR')}\n`;
        detailHtml += `퇴근: ${dayData.checkOut ? new Date(dayData.checkOut).toLocaleTimeString('ko-KR') : '미퇴근'}\n\n`;
        detailHtml += `휴게시간 기록:\n`;

        if (dayData.breaks && dayData.breaks.length > 0) {
            dayData.breaks.forEach((breakItem, index) => {
                const startTime = new Date(breakItem.start).toLocaleTimeString('ko-KR');
                const endTime = new Date(breakItem.end).toLocaleTimeString('ko-KR');
                const duration = Math.floor(breakItem.duration / 60);
                detailHtml += `${index + 1}. ${startTime} - ${endTime} (${duration}분)\n`;
            });
        } else {
            detailHtml += '휴게시간 기록이 없습니다.';
        }

        alert(detailHtml);
    }

    exportReport() {
        const companyId = document.getElementById('reportCompanyFilter').value;
        const userId = document.getElementById('reportUserFilter').value;
        const dateFrom = document.getElementById('reportDateFrom').value;
        const dateTo = document.getElementById('reportDateTo').value;

        const reportData = this.generateReportData(companyId, userId, dateFrom, dateTo);
        
        if (reportData.length === 0) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }

        // CSV 형태로 데이터 생성
        let csvContent = '날짜,협력사,사용자명,출근시간,퇴근시간,근무시간,휴게시간\n';
        
        reportData.forEach(record => {
            const date = new Date(record.date).toLocaleDateString('ko-KR');
            const checkIn = new Date(record.checkIn).toLocaleTimeString('ko-KR');
            const checkOut = record.checkOut ? new Date(record.checkOut).toLocaleTimeString('ko-KR') : '-';
            
            let workTime = '-';
            if (record.checkOut) {
                const workMinutes = Math.floor((new Date(record.checkOut) - new Date(record.checkIn)) / (1000 * 60));
                const breakMinutes = record.breaks.reduce((total, b) => total + Math.floor(b.duration / 60), 0);
                const netWorkMinutes = workMinutes - breakMinutes;
                const hours = Math.floor(netWorkMinutes / 60);
                const minutes = netWorkMinutes % 60;
                workTime = `${hours}:${minutes.toString().padStart(2, '0')}`;
            }
            
            const totalBreakMinutes = record.breaks.reduce((total, b) => total + Math.floor(b.duration / 60), 0);
            const breakTime = `${Math.floor(totalBreakMinutes / 60)}:${(totalBreakMinutes % 60).toString().padStart(2, '0')}`;
            
            csvContent += `${date},${record.company},${record.userName},${checkIn},${checkOut},${workTime},${breakTime}\n`;
        });

        // 파일 다운로드
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `출퇴근_리포트_${dateFrom}_${dateTo}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    loadAdminData() {
        if (this.currentAdminTab === 'companyManagement') {
            this.loadCompanyTable();
        } else if (this.currentAdminTab === 'userManagement') {
            this.loadUserTable();
            this.updateCompanyFilters();
        } else if (this.currentAdminTab === 'attendanceReport') {
            this.updateReportFilters();
        }
    }

    // 기존 사용자 모드 기능들
    showAddEmployeeForm() {
        document.getElementById('addEmployeeForm').style.display = 'flex';
        document.getElementById('employeeName').focus();
    }

    hideAddEmployeeForm() {
        document.getElementById('addEmployeeForm').style.display = 'none';
        document.getElementById('employeeName').value = '';
    }

    saveEmployee() {
        const name = document.getElementById('employeeName').value.trim();
        if (!name) {
            alert('직원 이름을 입력해주세요.');
            return;
        }

        const employee = {
            id: Date.now().toString(),
            name: name,
            createdAt: new Date().toISOString()
        };

        this.employees.push(employee);
        localStorage.setItem('employees', JSON.stringify(this.employees));
        
        this.loadEmployees();
        this.hideAddEmployeeForm();
        
        // 새로 추가된 직원을 자동 선택
        document.getElementById('employeeSelect').value = employee.id;
        this.selectEmployee(employee.id);
    }

    selectEmployee(employeeId) {
        if (!employeeId) {
            this.currentEmployee = null;
            this.updateUI();
            this.locationService.stopWatchingPosition();
            return;
        }

        this.currentEmployee = this.employees.find(emp => emp.id === employeeId);
        this.loadTodayData();
        this.updateUI();
        
        // 위치 모니터링 시작
        this.startLocationMonitoring();
    }

    getTodayKey() {
        return new Date().toISOString().split('T')[0];
    }

    loadTodayData() {
        if (!this.currentEmployee) return;

        const today = this.getTodayKey();
        const employeeData = this.attendanceData[this.currentEmployee.id] || {};
        const todayData = employeeData[today] || {};

        this.updateDailySummary(todayData);
        this.updateBreakLog(todayData.breaks || []);
    }

    startBreak() {
        if (!this.currentEmployee) return;

        this.breakStartTime = new Date();
        this.breakDuration = 0;
        
        this.breakTimer = setInterval(() => {
            this.breakDuration = Math.floor((new Date() - this.breakStartTime) / 1000);
            this.updateTimerDisplay();
        }, 1000);

        this.updateUI();
    }

    endBreak() {
        if (!this.currentEmployee || !this.breakStartTime) return;

        clearInterval(this.breakTimer);
        
        const breakRecord = {
            start: this.breakStartTime.toISOString(),
            end: new Date().toISOString(),
            duration: this.breakDuration
        };

        const today = this.getTodayKey();
        if (!this.attendanceData[this.currentEmployee.id]) {
            this.attendanceData[this.currentEmployee.id] = {};
        }
        if (!this.attendanceData[this.currentEmployee.id][today]) {
            this.attendanceData[this.currentEmployee.id][today] = { breaks: [] };
        }
        if (!this.attendanceData[this.currentEmployee.id][today].breaks) {
            this.attendanceData[this.currentEmployee.id][today].breaks = [];
        }

        this.attendanceData[this.currentEmployee.id][today].breaks.push(breakRecord);
        localStorage.setItem('attendanceData', JSON.stringify(this.attendanceData));

        this.breakStartTime = null;
        this.breakDuration = 0;
        this.updateTimerDisplay();
        this.loadTodayData();
        this.updateUI();
    }

    setBreakTimer(minutes) {
        // 프리셋 시간은 참고용으로만 사용
        alert(`${minutes}분 휴게시간이 설정되었습니다. 휴게시간 시작 버튼을 눌러주세요.`);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.breakDuration / 60);
        const seconds = this.breakDuration % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer').textContent = display;
    }

    updateUI() {
        const hasEmployee = !!this.currentEmployee;
        const today = this.getTodayKey();
        const todayData = hasEmployee ? 
            (this.attendanceData[this.currentEmployee.id] && 
             this.attendanceData[this.currentEmployee.id][today]) || {} : {};
        
        const isCheckedIn = todayData.checkIn && !todayData.checkOut;
        const isOnBreak = !!this.breakStartTime;

        // 출퇴근 버튼 상태
        document.getElementById('checkInBtn').disabled = !hasEmployee || isCheckedIn;
        document.getElementById('checkOutBtn').disabled = !hasEmployee || !isCheckedIn || isOnBreak;

        // 휴게시간 버튼 상태
        document.getElementById('startBreakBtn').disabled = !hasEmployee || !isCheckedIn || isOnBreak;
        document.getElementById('endBreakBtn').disabled = !hasEmployee || !isOnBreak;

        // 위치 정보 표시/숨김
        const locationInfo = document.getElementById('locationInfo');
        if (locationInfo) {
            if (!hasEmployee) {
                locationInfo.style.display = 'none';
            } else {
                locationInfo.style.display = 'block';
            }
        }

        // 상태 표시
        const statusDisplay = document.getElementById('attendanceStatus').querySelector('.status-display');
        if (!hasEmployee) {
            statusDisplay.textContent = '직원을 선택해주세요';
            statusDisplay.className = 'status-display';
        } else if (isOnBreak) {
            statusDisplay.textContent = `${this.currentEmployee.name} - 휴게시간 중`;
            statusDisplay.className = 'status-display on-break';
        } else if (isCheckedIn) {
            statusDisplay.textContent = `${this.currentEmployee.name} - 근무 중`;
            statusDisplay.className = 'status-display checked-in';
        } else {
            statusDisplay.textContent = `${this.currentEmployee.name} - 출근 전`;
            statusDisplay.className = 'status-display';
        }
    }

    updateDailySummary(todayData) {
        const checkInTime = todayData.checkIn ? 
            new Date(todayData.checkIn).toLocaleTimeString('ko-KR') : '-';
        const checkOutTime = todayData.checkOut ? 
            new Date(todayData.checkOut).toLocaleTimeString('ko-KR') : '-';

        document.getElementById('checkInTime').textContent = checkInTime;
        document.getElementById('checkOutTime').textContent = checkOutTime;

        // 총 근무시간 계산
        let totalWorkTime = '-';
        if (todayData.checkIn) {
            const start = new Date(todayData.checkIn);
            const end = todayData.checkOut ? new Date(todayData.checkOut) : new Date();
            const workMinutes = Math.floor((end - start) / (1000 * 60));
            
            // 휴게시간 제외
            const breakMinutes = (todayData.breaks || []).reduce((total, breakItem) => {
                return total + Math.floor(breakItem.duration / 60);
            }, 0);
            
            const netWorkMinutes = workMinutes - breakMinutes;
            const hours = Math.floor(netWorkMinutes / 60);
            const minutes = netWorkMinutes % 60;
            totalWorkTime = `${hours}시간 ${minutes}분`;
        }
        document.getElementById('totalWorkTime').textContent = totalWorkTime;

        // 총 휴게시간 계산
        const totalBreakMinutes = (todayData.breaks || []).reduce((total, breakItem) => {
            return total + Math.floor(breakItem.duration / 60);
        }, 0);
        document.getElementById('totalBreakTime').textContent = `${totalBreakMinutes}분`;
    }

    updateBreakLog(breaks) {
        const breakList = document.getElementById('breakList');
        breakList.innerHTML = '';

        breaks.forEach((breakItem, index) => {
            const div = document.createElement('div');
            div.className = 'break-item';
            
            const startTime = new Date(breakItem.start).toLocaleTimeString('ko-KR');
            const endTime = new Date(breakItem.end).toLocaleTimeString('ko-KR');
            const duration = Math.floor(breakItem.duration / 60);
            
            div.innerHTML = `
                <span class="break-time">${startTime} - ${endTime}</span>
                <span class="break-duration">${duration}분</span>
            `;
            
            breakList.appendChild(div);
        });

        if (breaks.length === 0) {
            breakList.innerHTML = '<div style="text-align: center; color: #999;">휴게시간 기록이 없습니다.</div>';
        }
    }

    // GPS 위치 관련 메서드
    async getCurrentOfficeLocation(formType = 'add') {
        const latId = formType === 'edit' ? 'editCompanyLatitude' : 'companyLatitude';
        const lngId = formType === 'edit' ? 'editCompanyLongitude' : 'companyLongitude';
        try {
            const position = await this.locationService.getCurrentPosition();
            document.getElementById(latId).value = position.latitude.toFixed(6);
            document.getElementById(lngId).value = position.longitude.toFixed(6);
            alert(`✅ 현재 위치를 가져왔습니다!\n위도: ${position.latitude.toFixed(6)}\n경도: ${position.longitude.toFixed(6)}`);
        } catch (error) {
            alert(`❌ ${error.message}`);
        }
    }

    async geocodeOfficeAddress(formType = 'add') {
        const addrId = formType === 'edit' ? 'editCompanyAddress' : 'companyAddress';
        const latId  = formType === 'edit' ? 'editCompanyLatitude' : 'companyLatitude';
        const lngId  = formType === 'edit' ? 'editCompanyLongitude' : 'companyLongitude';

        const address = document.getElementById(addrId).value.trim();
        
        if (!address) {
            alert('주소를 먼저 입력해주세요.');
            return;
        }

        try {
            const result = await this.locationService.geocodeAddress(address);
            
            if (result.success) {
                document.getElementById(latId).value = result.latitude.toFixed(6);
                document.getElementById(lngId).value = result.longitude.toFixed(6);
                alert(`✅ 주소를 좌표로 변환했습니다!\n${result.displayName}\n\n위도: ${result.latitude.toFixed(6)}\n경도: ${result.longitude.toFixed(6)}`);
            } else {
                alert(`❌ ${result.error}`);
            }
        } catch (error) {
            alert(`❌ 주소 변환 중 오류가 발생했습니다: ${error.message}`);
        }
    }

    async startLocationMonitoring() {
        const statusElement = document.getElementById('locationStatus');
        statusElement.textContent = '📍 위치 확인 중...';
        statusElement.className = 'location-status checking';

        try {
            const position = await this.locationService.getCurrentPosition();
            this.currentLocation = position;
            
            const user = this.users.find(u => u.id === this.currentEmployee.id);
            if (!user) {
                statusElement.textContent = '❌ 직원 정보를 찾을 수 없습니다';
                statusElement.className = 'location-status unavailable';
                return;
            }

            const company = this.companies.find(c => c.id === user.companyId);
            if (!company || !company.latitude || !company.longitude) {
                statusElement.textContent = '⚠️ 사무실 위치가 설정되지 않았습니다';
                statusElement.className = 'location-status unavailable';
                return;
            }

            const distance = this.locationService.calculateDistance(
                position.latitude,
                position.longitude,
                company.latitude,
                company.longitude
            );

            const isValid = distance <= this.locationService.ALLOWED_DISTANCE;
            
            if (isValid) {
                statusElement.innerHTML = `✅ 출퇴근 가능 지역<br><span class="distance-info">${company.name} 사무실에서 ${Math.round(distance)}m</span>`;
                statusElement.className = 'location-status valid';
            } else {
                statusElement.innerHTML = `❌ 출퇴근 불가 지역<br><span class="distance-info">${company.name} 사무실에서 ${Math.round(distance)}m (80m 이내 필요)</span>`;
                statusElement.className = 'location-status invalid';
            }

            this.locationService.startWatchingPosition((newPosition) => {
                this.currentLocation = newPosition;
                const newDistance = this.locationService.calculateDistance(
                    newPosition.latitude,
                    newPosition.longitude,
                    company.latitude,
                    company.longitude
                );
                
                const isValid = newDistance <= this.locationService.ALLOWED_DISTANCE;
                
                if (isValid) {
                    statusElement.innerHTML = `✅ 출퇴근 가능 지역<br><span class="distance-info">${company.name} 사무실에서 ${Math.round(newDistance)}m</span>`;
                    statusElement.className = 'location-status valid';
                } else {
                    statusElement.innerHTML = `❌ 출퇴근 불가 지역<br><span class="distance-info">${company.name} 사무실에서 ${Math.round(newDistance)}m (80m 이내 필요)</span>`;
                    statusElement.className = 'location-status invalid';
                }
            });

        } catch (error) {
            statusElement.textContent = `❌ ${error.message}`;
            statusElement.className = 'location-status unavailable';
        }
    }

    async checkIn() {
        if (!this.currentEmployee) return;

        const user = this.users.find(u => u.id === this.currentEmployee.id);
        if (user) {
            const company = this.companies.find(c => c.id === user.companyId);
            if (company && company.latitude && company.longitude) {
                try {
                    const locationCheck = await this.locationService.checkAttendanceLocation(
                        company.latitude,
                        company.longitude
                    );

                    if (!locationCheck.success) {
                        alert(`❌ 위치 확인 실패\n\n${locationCheck.error}`);
                        return;
                    }

                    if (!locationCheck.isValid) {
                        alert(`❌ 출근 불가\n\n현재 위치가 사무실에서 ${locationCheck.distance}m 떨어져 있습니다.\n출근하려면 사무실 ${locationCheck.allowedDistance}m 이내에 있어야 합니다.`);
                        return;
                    }

                    console.log(`✅ 위치 확인 성공: ${locationCheck.distance}m`);
                } catch (error) {
                    alert(`❌ 위치 확인 중 오류가 발생했습니다.\n\n${error.message}`);
                    return;
                }
            }
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        if (!this.attendanceData[this.currentEmployee.id]) {
            this.attendanceData[this.currentEmployee.id] = {};
        }

        if (!this.attendanceData[this.currentEmployee.id][today]) {
            this.attendanceData[this.currentEmployee.id][today] = {
                checkIn: now.toISOString(),
                checkOut: null,
                breaks: []
            };
        } else {
            this.attendanceData[this.currentEmployee.id][today].checkIn = now.toISOString();
        }

        localStorage.setItem('attendanceData', JSON.stringify(this.attendanceData));
        this.loadTodayData();
        this.updateUI();
        
        alert(`✅ 출근 처리되었습니다!\n시간: ${now.toLocaleTimeString('ko-KR')}`);
    }

    async checkOut() {
        if (!this.currentEmployee) return;

        const today = new Date().toISOString().split('T')[0];
        const todayData = this.attendanceData[this.currentEmployee.id]?.[today];

        if (!todayData || !todayData.checkIn) {
            alert('출근 기록이 없습니다.');
            return;
        }

        const user = this.users.find(u => u.id === this.currentEmployee.id);
        if (user) {
            const company = this.companies.find(c => c.id === user.companyId);
            if (company && company.latitude && company.longitude) {
                try {
                    const locationCheck = await this.locationService.checkAttendanceLocation(
                        company.latitude,
                        company.longitude
                    );

                    if (!locationCheck.success) {
                        alert(`❌ 위치 확인 실패\n\n${locationCheck.error}`);
                        return;
                    }

                    if (!locationCheck.isValid) {
                        alert(`❌ 퇴근 불가\n\n현재 위치가 사무실에서 ${locationCheck.distance}m 떨어져 있습니다.\n퇴근하려면 사무실 ${locationCheck.allowedDistance}m 이내에 있어야 합니다.`);
                        return;
                    }

                    console.log(`✅ 위치 확인 성공: ${locationCheck.distance}m`);
                } catch (error) {
                    alert(`❌ 위치 확인 중 오류가 발생했습니다.\n\n${error.message}`);
                    return;
                }
            }
        }

        const now = new Date();
        todayData.checkOut = now.toISOString();

        localStorage.setItem('attendanceData', JSON.stringify(this.attendanceData));
        this.loadTodayData();
        this.updateUI();
        
        alert(`✅ 퇴근 처리되었습니다!\n시간: ${now.toLocaleTimeString('ko-KR')}`);
    }
}

// 전역 변수 (HTML에서 onclick 이벤트에서 사용)
let attendanceManager;

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    attendanceManager = new AttendanceManager();
});