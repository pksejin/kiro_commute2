// GPS 위치 기반 출퇴근 관리 서비스
class LocationService {
    constructor() {
        this.currentPosition = null;
        this.watchId = null;
        this.ALLOWED_DISTANCE = 80; // 허용 거리 (미터)
    }

    // 현재 위치 가져오기
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('이 브라우저는 위치 정보를 지원하지 않습니다.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentPosition = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    resolve(this.currentPosition);
                },
                (error) => {
                    let errorMessage = '위치 정보를 가져올 수 없습니다.';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = '위치 정보 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = '위치 정보를 사용할 수 없습니다.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    // 위치 실시간 모니터링 시작
    startWatchingPosition(callback) {
        if (!navigator.geolocation) {
            console.error('위치 정보를 지원하지 않는 브라우저입니다.');
            return;
        }

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.currentPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                if (callback) callback(this.currentPosition);
            },
            (error) => {
                console.error('위치 모니터링 오류:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }

    // 위치 모니터링 중지
    stopWatchingPosition() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    // 두 좌표 간 거리 계산 (Haversine 공식)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // 지구 반지름 (미터)
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // 미터 단위 거리
    }

    // 출퇴근 가능 여부 확인
    async checkAttendanceLocation(officeLatitude, officeLongitude) {
        try {
            const position = await this.getCurrentPosition();
            const distance = this.calculateDistance(
                position.latitude,
                position.longitude,
                officeLatitude,
                officeLongitude
            );

            const isValid = distance <= this.ALLOWED_DISTANCE;

            return {
                success: true,
                isValid: isValid,
                distance: Math.round(distance),
                allowedDistance: this.ALLOWED_DISTANCE,
                currentPosition: position,
                officePosition: {
                    latitude: officeLatitude,
                    longitude: officeLongitude
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                isValid: false
            };
        }
    }

    // 주소를 위경도로 변환 (Geocoding)
    async geocodeAddress(address) {
        try {
            // Nominatim API 사용 (무료, OpenStreetMap)
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=kr`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'AttendanceManagementSystem/1.0'
                }
            });

            if (!response.ok) {
                throw new Error('주소를 찾을 수 없습니다.');
            }

            const data = await response.json();
            
            if (data && data.length > 0) {
                return {
                    success: true,
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon),
                    displayName: data[0].display_name
                };
            } else {
                throw new Error('주소를 찾을 수 없습니다. 더 구체적인 주소를 입력해주세요.');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 거리를 읽기 쉬운 형식으로 변환
    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        } else {
            return `${(meters / 1000).toFixed(2)}km`;
        }
    }

    // 위치 정보 권한 확인
    async checkPermission() {
        if (!navigator.permissions) {
            return { state: 'unknown' };
        }

        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            return { state: result.state };
        } catch (error) {
            return { state: 'unknown' };
        }
    }
}
