#!/usr/bin/env python3
"""
Network Simulator Launcher
Starts GNS3 server (bundled) + GUI together as a single application.
No external installation needed.
"""

import sys
import os
import threading
import time
import atexit


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

    # Add bundled binaries to PATH so gns3server finds vpcs
    bin_dir = os.path.join(base, 'bin')
    if os.path.isdir(bin_dir):
        os.environ['PATH'] = bin_dir + os.pathsep + os.environ.get('PATH', '')

    # Also check the app directory itself
    exe_dir = os.path.dirname(sys.executable) if getattr(sys, 'frozen', False) else base
    os.environ['PATH'] = exe_dir + os.pathsep + os.environ.get('PATH', '')


def start_server_thread():
    """Start GNS3 server in a background thread."""
    server_thread = None

    def run_server():
        try:
            import asyncio
            from gns3server.main import main as server_main
            # Override sys.argv for the server
            original_argv = sys.argv[:]
            sys.argv = ['gns3server', '--local', '--port', '3080']
            try:
                server_main()
            except SystemExit:
                pass
            finally:
                sys.argv = original_argv
        except Exception as e:
            print(f"Server error: {e}", file=sys.stderr)

    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    return server_thread


def main():
    # Setup paths for bundled binaries
    setup_vpcs_path()

    # Start the GNS3 server in background
    server_thread = start_server_thread()

    # Give server time to start
    time.sleep(2)

    # Start GUI (blocks until window closes)
    from gns3.main import main as gns3_main
    gns3_main()


if __name__ == '__main__':
    main()
