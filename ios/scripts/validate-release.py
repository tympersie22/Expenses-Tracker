#!/usr/bin/env python3
import os, re, sys, ipaddress
from urllib.parse import urlsplit
errors = []
for key in ['EXPENSES_TRACKER_API_URL','EXPENSES_TRACKER_PUBLIC_URL']:
    value = os.environ.get(key, '')
    try:
        url = urlsplit(value)
        host = url.hostname or ''
        valid = url.scheme == 'https' and host and url.path in ('', '/') and not url.query and not url.fragment and not url.username and not url.password
        # Validation builds may use reserved test domains. Signed releases may not.
        if os.environ.get('RELEASE_ACTION') != 'validate':
            try:
                ipaddress.ip_address(host)
                valid = False  # Production origins use the approved DNS name.
            except ValueError:
                pass
            valid = valid and host != 'localhost' and not host.endswith(('.invalid','.test','.example','.local','.localhost')) and host not in ('example.com','example.org','example.net') and not host.endswith(('.example.com','.example.org','.example.net'))
        if not valid: errors.append(key + ' must be a public HTTPS origin')
    except ValueError: errors.append(key + ' is invalid')
if not re.fullmatch(r'[1-9][0-9]*',os.environ.get('EXPENSES_TRACKER_BUILD_NUMBER','1')): errors.append('EXPENSES_TRACKER_BUILD_NUMBER must be a positive integer')
if os.environ.get('RELEASE_ACTION') != 'validate':
    if not re.fullmatch(r'[A-Z0-9]{10}',os.environ.get('EXPENSES_TRACKER_DEVELOPMENT_TEAM','')): errors.append('EXPENSES_TRACKER_DEVELOPMENT_TEAM is required')
    if os.environ.get('APP_STORE_CONNECT_KEY_PATH'):
        for key in ['APP_STORE_CONNECT_KEY_ID','APP_STORE_CONNECT_ISSUER_ID']:
            if not os.environ.get(key): errors.append(key + ' is required')
        if not os.path.isfile(os.environ['APP_STORE_CONNECT_KEY_PATH']): errors.append('App Store Connect key file is missing')
if errors:
    print('\n'.join(errors),file=sys.stderr)
    sys.exit(1)
print('Release settings validated (' + os.environ.get('RELEASE_ACTION','archive') + ')')
