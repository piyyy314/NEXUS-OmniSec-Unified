# [CODE_SNIPPET]: Free Space Path Loss (FSPL) Calculator (Python)
# This script calculates the Free Space Path Loss for a given distance and frequency.

import math

def calculate_fspl(distance_km: float, frequency_ghz: float) -> float:
    """
    Calculates Free Space Path Loss (FSPL) in dB.

    Args:
        distance_km: The distance between the transmitter and receiver in kilometers.
        frequency_ghz: The signal frequency in Gigahertz.

    Returns:
        The Free Space Path Loss in decibels (dB).
    """
    if distance_km <= 0 or frequency_ghz <= 0:
        raise ValueError("Distance and frequency must be positive values.")

    # FSPL (dB) = 20 * log10(d) + 20 * log10(f) + 92.45
    # where d is in km and f is in GHz
    fspl_db = 20 * math.log10(distance_km) + 20 * math.log10(frequency_ghz) + 92.45
    return fspl_db

if __name__ == "__main__":
    print("--- Free Space Path Loss Calculator ---")
    try:
        d = float(input("Enter distance to satellite (km): "))
        f = float(input("Enter signal frequency (GHz): "))

        loss = calculate_fspl(d, f)
        print(f"\nCalculated FSPL: {loss:.2f} dB")
        print("[STATUS]: Calculation successful.")
    except ValueError as e:
        print(f"[ERROR]: Invalid input. {e}")
    except Exception as e:
        print(f"[ERROR]: An unexpected error occurred: {e}")