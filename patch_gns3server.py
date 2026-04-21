#!/usr/bin/env python3
"""
Patch the installed gns3server to accept 'startup_script' in VPCS update API.
Run once after installing/updating gns3-server. Idempotent.
"""

import os
import sys


def patch_file(path, find, replace, marker):
    if not os.path.exists(path):
        print(f"  [SKIP] {path} not found")
        return False
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if marker in content:
        print(f"  [OK] Already patched: {os.path.basename(path)}")
        return True
    if find not in content:
        print(f"  [WARN] Pattern not found in {os.path.basename(path)}")
        return False
    new_content = content.replace(find, replace)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"  [DONE] Patched: {os.path.basename(path)}")
    return True


def clear_pycache(root):
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if fn.endswith('.pyc') and 'vpcs' in fn:
                try:
                    os.remove(os.path.join(dirpath, fn))
                except OSError:
                    pass


def main():
    import gns3server
    server_dir = os.path.dirname(gns3server.__file__)
    print(f"gns3server at: {server_dir}")

    schema_path = os.path.join(server_dir, 'schemas', 'vpcs.py')
    handler_path = os.path.join(server_dir, 'handlers', 'api', 'compute', 'vpcs_handler.py')

    schema_find = '''        "console_type": {
            "description": "Console type",
            "enum": ["telnet", "none"]
        },
    },
    "additionalProperties": False,
}

VPCS_OBJECT_SCHEMA'''

    schema_replace = '''        "console_type": {
            "description": "Console type",
            "enum": ["telnet", "none"]
        },
        "startup_script": {
            "description": "Content of the VPCS startup script",
            "type": ["string", "null"]
        },
    },
    "additionalProperties": False,
}

VPCS_OBJECT_SCHEMA'''

    handler_find = '''        vm.name = request.json.get("name", vm.name)
        vm.console = request.json.get("console", vm.console)
        vm.console_type = request.json.get("console_type", vm.console_type)
        vm.updated()
        response.json(vm)'''

    handler_replace = '''        vm.name = request.json.get("name", vm.name)
        vm.console = request.json.get("console", vm.console)
        vm.console_type = request.json.get("console_type", vm.console_type)
        if "startup_script" in request.json:
            vm.startup_script = request.json["startup_script"]
        vm.updated()
        response.json(vm)'''

    print("Applying patches...")
    patch_file(schema_path, schema_find, schema_replace, '"startup_script"')
    patch_file(handler_path, handler_find, handler_replace, 'if "startup_script" in request.json')

    clear_pycache(server_dir)
    print("Done.")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
