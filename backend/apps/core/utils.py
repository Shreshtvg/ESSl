from datetime import date as date_cls, datetime

from rest_framework.response import Response


def success_response(data=None, message='OK', status=200):
    return Response({'success': True, 'data': data, 'message': message}, status=status)


def error_response(message='Error', status=400):
    return Response({'success': False, 'data': None, 'message': message}, status=status)


def calculate_hours(check_in, check_out):
    """Parse 'HH:MM' strings and return worked hours (handles overnight shifts)."""
    if not check_in or not check_out:
        return 0

    try:
        in_hour, in_minute = [int(x) for x in str(check_in).split(':')]
        out_hour, out_minute = [int(x) for x in str(check_out).split(':')]
    except (ValueError, AttributeError):
        return 0

    in_minutes = in_hour * 60 + in_minute
    out_minutes = out_hour * 60 + out_minute

    # Handle cross-day shift (e.g., night shifts)
    if out_minutes < in_minutes:
        out_minutes += 24 * 60

    diff_minutes = out_minutes - in_minutes
    return round(diff_minutes / 60, 2)


def weekday_name(value):
    """Return the full weekday name (e.g. 'Monday') for a date/str/datetime."""
    if isinstance(value, str):
        value = datetime.strptime(value, '%Y-%m-%d').date()
    elif isinstance(value, datetime):
        value = value.date()
    if isinstance(value, date_cls):
        return value.strftime('%A')
    return ''
