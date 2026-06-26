// PWA 설치 및 관리
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }

    init() {
        // Service Worker 등록
        this.registerServiceWorker();
        
        // 설치 프롬프트 처리
        this.setupInstallPrompt();
        
        // 앱 설치 상태 확인
        this.checkInstallStatus();
    }

    // Service Worker 등록
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('✅ Service Worker 등록 성공:', registration.scope);
                
                // 업데이트 확인
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // 새 버전 사용 가능
                            this.showUpdateNotification();
                        }
                    });
                });
            } catch (error) {
                console.error('❌ Service Worker 등록 실패:', error);
            }
        }
    }

    // 설치 프롬프트 설정
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // 기본 설치 프롬프트 방지
            e.preventDefault();
            this.deferredPrompt = e;
            
            // 설치 버튼 표시
            this.showInstallButton();
        });

        // 앱 설치 완료 이벤트
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA 설치 완료!');
            this.deferredPrompt = null;
            this.hideInstallButton();
            
            // 설치 완료 알림
            this.showNotification('앱 설치 완료', '홈 화면에서 앱을 실행할 수 있습니다!');
        });
    }

    // 설치 버튼 표시
    showInstallButton() {
        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn';
        installBtn.className = 'pwa-install-button';
        installBtn.innerHTML = '📱 앱으로 설치';
        installBtn.onclick = () => this.promptInstall();
        
        // 헤더에 버튼 추가
        const header = document.querySelector('header');
        if (header && !document.getElementById('pwa-install-btn')) {
            const modeSelector = header.querySelector('.mode-selector');
            if (modeSelector) {
                modeSelector.appendChild(installBtn);
            }
        }
    }

    // 설치 버튼 숨기기
    hideInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.remove();
        }
    }

    // 설치 프롬프트 표시
    async promptInstall() {
        if (!this.deferredPrompt) {
            alert('이미 설치되었거나 설치할 수 없는 환경입니다.');
            return;
        }

        // 설치 프롬프트 표시
        this.deferredPrompt.prompt();
        
        // 사용자 선택 대기
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`설치 선택: ${outcome}`);
        
        if (outcome === 'accepted') {
            console.log('✅ 사용자가 설치 승인');
        } else {
            console.log('❌ 사용자가 설치 거부');
        }
        
        this.deferredPrompt = null;
    }

    // 앱 설치 상태 확인
    checkInstallStatus() {
        // Standalone 모드 확인 (설치된 앱으로 실행 중)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('✅ PWA 앱 모드로 실행 중');
            this.hideInstallButton();
            document.body.classList.add('pwa-standalone');
        }
        
        // iOS Safari 확인
        if (window.navigator.standalone === true) {
            console.log('✅ iOS 홈 화면에서 실행 중');
            document.body.classList.add('pwa-standalone');
        }
    }

    // 업데이트 알림 표시
    showUpdateNotification() {
        if (confirm('새로운 버전이 있습니다. 업데이트 하시겠습니까?')) {
            window.location.reload();
        }
    }

    // 일반 알림 표시
    showNotification(title, message) {
        // 웹 알림 권한 확인
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png'
            });
        } else {
            alert(`${title}\n\n${message}`);
        }
    }

    // 알림 권한 요청
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }

    // 백그라운드 동기화 등록
    async registerBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('sync-attendance');
                console.log('✅ 백그라운드 동기화 등록 완료');
            } catch (error) {
                console.error('❌ 백그라운드 동기화 등록 실패:', error);
            }
        }
    }

    // 네트워크 상태 확인
    checkNetworkStatus() {
        const updateOnlineStatus = () => {
            if (navigator.onLine) {
                console.log('✅ 온라인');
                document.body.classList.remove('offline');
                this.showNotification('온라인', '네트워크가 연결되었습니다.');
            } else {
                console.log('❌ 오프라인');
                document.body.classList.add('offline');
                alert('⚠️ 오프라인 모드\n\n인터넷 연결이 끊어졌습니다.\n캐시된 데이터로 작동합니다.');
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        // 초기 상태 확인
        updateOnlineStatus();
    }
}

// PWA 인스톨러 초기화
let pwaInstaller;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pwaInstaller = new PWAInstaller();
        pwaInstaller.checkNetworkStatus();
    });
} else {
    pwaInstaller = new PWAInstaller();
    pwaInstaller.checkNetworkStatus();
}
