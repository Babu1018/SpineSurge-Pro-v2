import numpy as np

def calculate_screw_placement(pip, vap):
    """
    Calculates screw position, direction, and length based on PIP and VAP points.
    
    Args:
        pip (tuple/list): [x, y, z] coordinates of the Pedicle Insertion Point (Screw Head)
        vap (tuple/list): [x, y, z] coordinates of the Vertebral Body Apex Point (Screw Tip)
        
    Returns:
        dict: {
            "position": [x, y, z],
            "direction": [dx, dy, dz],
            "length": float,
            "medial_angle": float,
            "caudal_angle": float
        }
    """
    p1 = np.array(pip)
    p2 = np.array(vap)
    
    # Vector from PIP to VAP
    vector = p2 - p1
    
    # Length of the screw
    length = np.linalg.norm(vector)
    
    # Direction normalized
    direction = vector / length
    
    # Angles (assuming standard coordinate system)
    # Medial angle (around Y axis in many systems)
    medial_angle = np.degrees(np.arctan2(direction[0], direction[2]))
    
    # Caudal angle (around X axis)
    caudal_angle = np.degrees(np.arctan2(direction[1], direction[2]))
    
    return {
        "position": p1.tolist(),
        "direction": direction.tolist(),
        "length": float(length),
        "medial_angle": float(medial_angle),
        "caudal_angle": float(caudal_angle)
    }

# Example Usage
if __name__ == "__main__":
    # Sample points
    pip_point = [100.5, 50.2, -20.0]
    vap_point = [110.2, 55.4, -65.0]
    
    result = calculate_screw_placement(pip_point, vap_point)
    print("--- Screw Placement Calculation ---")
    print(f"Position (Head): {result['position']}")
    print(f"Direction: {result['direction']}")
    print(f"Length: {result['length']:.2f} mm")
    print(f"Medial Angle: {result['medial_angle']:.2f}°")
    print(f"Caudal Angle: {result['caudal_angle']:.2f}°")
