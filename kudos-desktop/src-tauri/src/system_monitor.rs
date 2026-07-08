use std::ffi::OsString;
use std::os::windows::ffi::OsStringExt;
use windows::Win32::System::SystemInformation::GetTickCount;
use windows::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW};

#[tauri::command]
pub fn get_active_window_title() -> String {
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.0 == std::ptr::null_mut() {
            return String::new();
        }

        let mut buffer: [u16; 512] = [0; 512];
        let len = GetWindowTextW(hwnd, &mut buffer);

        if len > 0 {
            let title = OsString::from_wide(&buffer[..len as usize]);
            return title.into_string().unwrap_or_default();
        }
        String::new()
    }
}

#[tauri::command]
pub fn get_idle_time_ms() -> u32 {
    unsafe {
        let mut info = LASTINPUTINFO {
            cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
            dwTime: 0,
        };
        if GetLastInputInfo(&mut info).as_bool() {
            let current_tick = GetTickCount();
            return current_tick.saturating_sub(info.dwTime);
        }
        0
    }
}
