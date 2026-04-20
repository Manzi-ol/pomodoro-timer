"""
pomodoro.py — Terminal Pomodoro productivity timer.

Default cycle: 25 min work → 5 min break → repeat.
After 4 cycles, a 15-minute long break is taken.

Usage:
    python pomodoro.py
    python pomodoro.py --work 50 --short-break 10 --long-break 20
"""

import argparse
import sys
import time
from datetime import datetime


def countdown(seconds: int, label: str):
    """Display a live countdown in the terminal."""
    start = time.time()
    try:
        while True:
            elapsed = int(time.time() - start)
            remaining = max(seconds - elapsed, 0)
            mins, secs = divmod(remaining, 60)
            bar_total = 30
            filled = int((elapsed / seconds) * bar_total) if seconds else bar_total
            bar = "█" * filled + "░" * (bar_total - filled)
            sys.stdout.write(
                f"\r  [{bar}]  {mins:02d}:{secs:02d}  {label}   "
            )
            sys.stdout.flush()
            if remaining == 0:
                print()
                return
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n  Timer interrupted. Goodbye!")
        sys.exit(0)


def notify(message: str):
    """Print a visible notification banner."""
    print("\n" + "=" * 50)
    print(f"  {message}")
    print("=" * 50 + "\n")


def run(work_min: int, short_break_min: int, long_break_min: int, cycles_before_long: int):
    session = 0
    pomodoro_count = 0

    print(f"\n  Pomodoro Timer Started — {datetime.now().strftime('%H:%M')}")
    print(f"  Work: {work_min}m  |  Short break: {short_break_min}m  |  Long break: {long_break_min}m")
    print("  Press Ctrl+C anytime to stop.\n")

    while True:
        session += 1
        pomodoro_count += 1
        notify(f"Pomodoro #{pomodoro_count} — Focus time! ({work_min} minutes)")
        countdown(work_min * 60, "Working")

        if pomodoro_count % cycles_before_long == 0:
            notify(f"Great work! Long break — {long_break_min} minutes. Relax!")
            countdown(long_break_min * 60, "Long Break")
        else:
            notify(f"Short break — {short_break_min} minutes. Stretch!")
            countdown(short_break_min * 60, "Short Break")


def main():
    parser = argparse.ArgumentParser(description="Pomodoro Productivity Timer")
    parser.add_argument("--work",        type=int, default=25, help="Work duration in minutes")
    parser.add_argument("--short-break", type=int, default=5,  help="Short break in minutes")
    parser.add_argument("--long-break",  type=int, default=15, help="Long break in minutes")
    parser.add_argument("--cycles",      type=int, default=4,  help="Pomodoros before long break")
    args = parser.parse_args()
    run(args.work, args.short_break, args.long_break, args.cycles)


if __name__ == "__main__":
    main()
