import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity

@objc(ScreenTimeModule)
class ScreenTimeModule: NSObject {
  
  private let center = AuthorizationCenter.shared
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  // 권한 요청
  @objc
  func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      do {
        try await center.requestAuthorization(for: .individual)
        
        switch center.authorizationStatus {
        case .approved:
          resolve(true)
        case .denied:
          reject("PERMISSION_DENIED", "Screen Time authorization denied", nil)
        case .notDetermined:
          reject("PERMISSION_NOT_DETERMINED", "Screen Time authorization not determined", nil)
        @unknown default:
          reject("UNKNOWN_ERROR", "Unknown authorization status", nil)
        }
      } catch {
        reject("AUTHORIZATION_ERROR", error.localizedDescription, error)
      }
    }
  }
  
  // 권한 상태 확인
  @objc
  func checkPermission(_ resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    let status = center.authorizationStatus
    resolve(status == .approved)
  }
  
  // iOS에서는 앱별 상세 데이터를 직접 가져올 수 없으므로
  // DeviceActivityReport를 사용해야 하는데, 이는 별도의 Extension이 필요합니다
  // 대신 간단한 카테고리별 데이터를 반환하는 방식으로 구현
  @objc
  func getUsageData(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    // iOS 제약으로 인해 실제 사용 데이터를 가져올 수 없음
    // 사용자에게 설정 앱으로 이동하도록 안내
    reject("NOT_SUPPORTED", 
           "iOS does not provide direct access to Screen Time data. Please check Settings > Screen Time for usage statistics.", 
           nil)
  }
}