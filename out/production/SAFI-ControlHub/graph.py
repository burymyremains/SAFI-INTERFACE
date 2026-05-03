import pandas as pd
import matplotlib.pyplot as plt

# Cargar el archivo CSV
archivo_csv = "/home/lems/Documents/SAFI/ENMICE_2025/prueba_newtons.csv"
df = pd.read_csv(archivo_csv)

# Verificar nombres de columnas
print(df.columns)

# Asegurar que los nombres sean correctos
df.columns = df.columns.str.strip().str.lower()

# Asegurar que los datos sean numéricos
df["id"] = pd.to_numeric(df["id"], errors="coerce")
df["fuerza"] = pd.to_numeric(df["fuerza_n"], errors="coerce")

# Verificar los primeros valores
print(df.head())

# Graficar fuerza vs ID
plt.figure(figsize=(10,5))
plt.plot(df["id"], df["fuerza_n"], marker="o", linestyle="-", color="b", label="Fuerza")

plt.xlabel("ID")
plt.ylabel("Fuerza (N)")
plt.title("PRUEBA ESTÁTICA HUITZILI 02/02/2025")
plt.legend()
plt.grid(True)
plt.xticks(rotation=45)
plt.show()
