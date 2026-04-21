#!/usr/bin/env python3
"""
Network Simulator Launcher
Starts GNS3 server (bundled) + GUI together as a single application.
No external installation needed.
"""

import sys
import os

# Fix for Windows --noconsole: sys.stdout/stderr can be None.
# Redirect to a log file so faulthandler and logging don't crash.
if sys.stdout is None or sys.stderr is None:
    try:
        if getattr(sys, 'frozen', False):
            log_dir = os.path.join(os.path.expanduser('~'), 'NetworkSimulator_Logs')
        else:
            log_dir = os.path.dirname(os.path.abspath(__file__))
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, 'launcher.log')
        log_file = open(log_path, 'a', encoding='utf-8', buffering=1)
        if sys.stdout is None:
            sys.stdout = log_file
        if sys.stderr is None:
            sys.stderr = log_file
    except Exception:
        # Last-resort fallback: devnull
        devnull = open(os.devnull, 'w')
        if sys.stdout is None:
            sys.stdout = devnull
        if sys.stderr is None:
            sys.stderr = devnull

import threading
import time


def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and PyInstaller."""
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)


def setup_vpcs_path():
    """Make bundled VPCS binary discoverable."""
    if getattr(sys, 'frozen', False):
        base = sys._MEIPASS
    else:
        base = os.path.dirname(os.path.abspath(__file__))

    bin_dir = os.path.join(base, 'bin')
    if os.path.isdir(bin_dir):
        os.environ['PATH'] = bin_dir + os.pathsep + os.environ.get('PATH', '')

    exe_dir = os.path.dirname(sys.executable) if getattr(sys, 'frozen', False) else base
    os.environ['PATH'] = exe_dir + os.pathsep + os.environ.get('PATH', '')


def start_server_thread():
    """Start GNS3 server in a background thread."""
    def run_server():
        try:
            from gns3server.main import main as server_main
            original_argv = sys.argv[:]
            sys.argv = ['gns3server', '--local', '--port', '3080']
            try:
                server_main()
            except SystemExit:
                pass
            finally:
                sys.argv = original_argv
        except Exception as e:
            try:
                print(f"Server error: {e}", file=sys.stderr)
            except Exception:
                pass

    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    return server_thread


def write_gui_config():
    """Pre-configure GUI to use our embedded server instead of looking for gns3server.exe."""
    try:
        import json
        if sys.platform == 'win32':
            config_dir = os.path.join(os.environ.get('APPDATA', ''), 'GNS3', '2.2')
            config_file = os.path.join(config_dir, 'gns3_gui.ini')
        elif sys.platform == 'darwin':
            config_dir = os.path.join(os.path.expanduser('~'), '.config', 'GNS3', '2.2')
            config_file = os.path.join(config_dir, 'gns3_gui.conf')
        else:
            config_dir = os.path.join(os.path.expanduser('~'), '.config', 'GNS3', '2.2')
            config_file = os.path.join(config_dir, 'gns3_gui.conf')

        os.makedirs(config_dir, exist_ok=True)

        # Load existing config if present, merge our settings
        config = {}
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
            except Exception:
                config = {}

        config.setdefault('version', '2.2.0')
        config.setdefault('type', 'settings')
        config.setdefault('MainWindow', {})
        config['MainWindow']['hide_setup_wizard'] = True

        # Configure console command to use bundled PuTTY on Windows
        if sys.platform == 'win32':
            if getattr(sys, 'frozen', False):
                exe_dir = os.path.dirname(sys.executable)
                putty_path = os.path.join(exe_dir, '_internal', 'bin', 'putty.exe')
                if not os.path.exists(putty_path):
                    putty_path = os.path.join(exe_dir, 'bin', 'putty.exe')
                if os.path.exists(putty_path):
                    config['MainWindow']['telnet_console_command'] = (
                        f'"{putty_path}" -telnet {{host}} {{port}} -title "{{name}}"'
                    )
        elif sys.platform == 'darwin':
            # macOS: simple, reliable Terminal.app telnet (force IPv4 — VPCS doesn't listen on ::1)
            config['MainWindow']['telnet_console_command'] = (
                'osascript -e \'tell application "Terminal" to do script "telnet 127.0.0.1 {port}"\' '
                '-e \'tell application "Terminal" to activate\''
            )

        config.setdefault('LocalServer', {})
        config['LocalServer']['auto_start'] = False
        config['LocalServer']['host'] = 'localhost'
        config['LocalServer']['port'] = 3080
        config['LocalServer']['path'] = ''
        config['LocalServer']['ubridge_path'] = ''
        config['LocalServer']['auth'] = False
        config['LocalServer']['user'] = ''
        config['LocalServer']['password'] = ''

        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4)
    except Exception as e:
        try:
            print(f"Config write error: {e}", file=sys.stderr)
        except Exception:
            pass


def wait_for_server(host='localhost', port=3080, timeout=15):
    """Wait until server is accepting connections."""
    import socket
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except OSError:
            time.sleep(0.3)
    return False


def kill_orphan_simulator_processes():
    """Kill leftover vpcs/dynamips/ubridge processes holding UDP ports from previous runs."""
    try:
        import signal
        names = ('vpcs', 'dynamips', 'ubridge')
        if sys.platform == 'win32':
            import subprocess
            for name in names:
                subprocess.run(
                    ['taskkill', '/F', '/IM', f'{name}.exe'],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                    creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
                )
        else:
            import psutil
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    pname = (proc.info.get('name') or '').lower()
                    if any(n in pname for n in names):
                        proc.send_signal(signal.SIGKILL)
                except Exception:
                    continue
    except Exception:
        pass


def main():
    kill_orphan_simulator_processes()
    setup_vpcs_path()
    write_gui_config()
    start_server_thread()
    wait_for_server()

    from gns3.main import main as gns3_main
    gns3_main()


if __name__ == '__main__':
    main()
