import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import math

def compute_parameters(diameter_mm, desired_angle_deg, filament_thickness_mm, overlap_ratio=1.0, length_mm=200):
    theta = math.radians(desired_angle_deg)
    radius = diameter_mm / 2.0
    pitch = filament_thickness_mm / overlap_ratio
    num_turns = length_mm / pitch
    theta_max = 2 * math.pi * num_turns
    rpm = (60 * math.tan(theta) * radius) / pitch
    v_axial = pitch * rpm / 60.0
    filament_length = np.sqrt((2*np.pi*radius)**2 + pitch**2) * num_turns
    return {
        "radius": radius,
        "pitch": pitch,
        "num_turns": num_turns,
        "theta_max": theta_max,
        "rpm": rpm,
        "v_axial": v_axial,
        "filament_length": filament_length
    }

def simulate_and_plot(params, length_mm):
    # Generate helix coordinates on cylinder
    theta = np.linspace(0, params["theta_max"], 2000)
    x = params["radius"] * np.cos(theta)
    y = params["radius"] * np.sin(theta)
    z = (params["pitch"] / (2 * np.pi)) * theta
    
    # Prepare figure
    fig = plt.figure(figsize=(12, 6))
    
    # 3D view
    ax1 = fig.add_subplot(121, projection='3d')
    # Cylinder surface for reference
    z_lin = np.linspace(0, length_mm, 50)
    theta_cyl = np.linspace(0, 2*np.pi, 50)
    theta_cyl, z_cyl = np.meshgrid(theta_cyl, z_lin)
    x_cyl = params["radius"] * np.cos(theta_cyl)
    y_cyl = params["radius"] * np.sin(theta_cyl)
    ax1.plot_surface(x_cyl, y_cyl, z_cyl, alpha=0.2)
    ax1.plot(x, y, z, linewidth=1.5)
    ax1.set_title("Helix on Cylinder Surface")
    ax1.set_xlabel("X (mm)")
    ax1.set_ylabel("Y (mm)")
    ax1.set_zlabel("Z (mm)")
    
    # Flattened 2D view
    ax2 = fig.add_subplot(122)
    arc_length = params["radius"] * theta  # unwrap angle to linear
    ax2.plot(arc_length, z, linewidth=1.5)
    ax2.set_title("Flattened Helical Pattern")
    ax2.set_xlabel("Unwrapped Circumference (mm)")
    ax2.set_ylabel("Z (mm)")
    
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    # User parameters
    diameter_mm = 127.0            # diámetro del cilindro en mm
    length_mm = 600.0             # longitud total del cilindro en mm
    filament_thickness_mm = 3.175  # grosor del filamento en mm
    desired_angle_deg = 84       # ángulo de devanado por capa en grados
    overlap_ratio = 1.1            # solapamiento del 10%
    
    # Compute and display parameters
    params = compute_parameters(diameter_mm, desired_angle_deg, filament_thickness_mm, overlap_ratio, length_mm)
    print("Cálculos de devanado:")
    for k, v in params.items():
        print(f"  {k}: {v:.2f}")
    
    # Simulate and plot
    simulate_and_plot(params, length_mm)
