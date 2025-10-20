import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/api_service.dart';
import '../services/user_service.dart';

class AppSettings {
  final bool prolongSession;
  final bool notificationsEnabled;
  final bool notifyEmail;
  final bool notifyPush;
  // Granulares por sensor/estado
  final bool mq135Good;
  final bool mq135Warning;
  final bool mq135Bad;
  final bool mq4Good;
  final bool mq4Warning;
  final bool mq4Bad;
  final bool mq7Good;
  final bool mq7Warning;
  final bool mq7Bad;

  const AppSettings({
    this.prolongSession = false,
    this.notificationsEnabled = true,
    this.notifyEmail = false,
    this.notifyPush = true,
    this.mq135Good = true,
    this.mq135Warning = true,
    this.mq135Bad = true,
    this.mq4Good = true,
    this.mq4Warning = true,
    this.mq4Bad = true,
    this.mq7Good = true,
    this.mq7Warning = true,
    this.mq7Bad = true,
  });

  AppSettings copyWith({
    bool? prolongSession,
    bool? notificationsEnabled,
    bool? notifyEmail,
    bool? notifyPush,
    bool? mq135Good,
    bool? mq135Warning,
    bool? mq135Bad,
    bool? mq4Good,
    bool? mq4Warning,
    bool? mq4Bad,
    bool? mq7Good,
    bool? mq7Warning,
    bool? mq7Bad,
  }) {
    return AppSettings(
      prolongSession: prolongSession ?? this.prolongSession,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      notifyEmail: notifyEmail ?? this.notifyEmail,
      notifyPush: notifyPush ?? this.notifyPush,
      mq135Good: mq135Good ?? this.mq135Good,
      mq135Warning: mq135Warning ?? this.mq135Warning,
      mq135Bad: mq135Bad ?? this.mq135Bad,
      mq4Good: mq4Good ?? this.mq4Good,
      mq4Warning: mq4Warning ?? this.mq4Warning,
      mq4Bad: mq4Bad ?? this.mq4Bad,
      mq7Good: mq7Good ?? this.mq7Good,
      mq7Warning: mq7Warning ?? this.mq7Warning,
      mq7Bad: mq7Bad ?? this.mq7Bad,
    );
  }

  Map<String, dynamic> toJson() => {
        'prolongSession': prolongSession,
        'notificationsEnabled': notificationsEnabled,
        'notifyEmail': notifyEmail,
        'notifyPush': notifyPush,
        'mq135Good': mq135Good,
        'mq135Warning': mq135Warning,
        'mq135Bad': mq135Bad,
        'mq4Good': mq4Good,
        'mq4Warning': mq4Warning,
        'mq4Bad': mq4Bad,
        'mq7Good': mq7Good,
        'mq7Warning': mq7Warning,
        'mq7Bad': mq7Bad,
      };

  static AppSettings fromJson(Map<String, dynamic> json) => AppSettings(
        prolongSession: json['prolongSession'] == true,
        notificationsEnabled: json['notificationsEnabled'] != false,
        notifyEmail: json['notifyEmail'] == true,
        notifyPush: json['notifyPush'] != false,
        mq135Good: json['mq135Good'] != false,
        mq135Warning: json['mq135Warning'] != false,
        mq135Bad: json['mq135Bad'] != false,
        mq4Good: json['mq4Good'] != false,
        mq4Warning: json['mq4Warning'] != false,
        mq4Bad: json['mq4Bad'] != false,
        mq7Good: json['mq7Good'] != false,
        mq7Warning: json['mq7Warning'] != false,
        mq7Bad: json['mq7Bad'] != false,
      );
}

class SettingsNotifier extends StateNotifier<AppSettings> {
  SettingsNotifier(this._api, this._userService) : super(const AppSettings()) {
    _load();
  }

  final ApiService _api;
  final UserService _userService;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  static const _key = 'app_settings';

  Future<void> _load() async {
    try {
      final raw = await _storage.read(key: _key);
      if (raw != null) {
        state = AppSettings.fromJson(json.decode(raw) as Map<String, dynamic>);
      }
    } catch (_) {}
  }

  Future<void> _save() async {
    try {
      await _storage.write(key: _key, value: json.encode(state.toJson()));
    } catch (_) {}
  }

  Future<void> setProlongSession(bool enabled) async {
    state = state.copyWith(prolongSession: enabled);
    await _save();
    try { await _userService.updateMySessionConfig(prolongar: enabled); } catch (_) {}
  }

  Future<void> setNotificationsEnabled(bool enabled) async {
    state = state.copyWith(notificationsEnabled: enabled);
    await _save();
    try { await _userService.updateMyNotificationConfig({'enabled': enabled}); } catch (_) {}
  }

  Future<void> setNotifyEmail(bool enabled) async {
    state = state.copyWith(notifyEmail: enabled);
    await _save();
  }

  Future<void> setNotifyPush(bool enabled) async {
    state = state.copyWith(notifyPush: enabled);
    await _save();
  }

  // Granulares
  Future<void> setSensorState(String sensor, String level, bool enabled) async {
    switch ('$sensor:$level') {
      case 'mq135:good':
        state = state.copyWith(mq135Good: enabled); break;
      case 'mq135:warning':
        state = state.copyWith(mq135Warning: enabled); break;
      case 'mq135:bad':
        state = state.copyWith(mq135Bad: enabled); break;
      case 'mq4:good':
        state = state.copyWith(mq4Good: enabled); break;
      case 'mq4:warning':
        state = state.copyWith(mq4Warning: enabled); break;
      case 'mq4:bad':
        state = state.copyWith(mq4Bad: enabled); break;
      case 'mq7:good':
        state = state.copyWith(mq7Good: enabled); break;
      case 'mq7:warning':
        state = state.copyWith(mq7Warning: enabled); break;
      case 'mq7:bad':
        state = state.copyWith(mq7Bad: enabled); break;
    }
    await _save();
  }
}

final settingsProvider = StateNotifierProvider<SettingsNotifier, AppSettings>((ref) {
  return SettingsNotifier(ApiService(), UserService());
});


