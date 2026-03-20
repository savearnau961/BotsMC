import json
import os
import time
import tkinter as tk
from tkinter import ttk

# Archivo generado por el bot
INVENTORY_FILE = "inventory.json"
REFRESH_INTERVAL = 1  # segundos

# Ventana principal
root = tk.Tk()
root.title("📦 Inventario del Bot - Mineflayer")
root.geometry("800x600")

# Frames
frame_main = ttk.Frame(root)
frame_main.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

frame_tables = ttk.Frame(frame_main)
frame_tables.pack(fill=tk.BOTH, expand=True)

# Tabla inventario actual
ttk.Label(frame_tables, text="Inventario Actual").pack()
tree_inv = ttk.Treeview(frame_tables, columns=("Nombre", "Cantidad", "Slot", "Fila"), show='headings')
for col in ("Nombre", "Cantidad", "Slot", "Fila"):
    tree_inv.heading(col, text=col)
tree_inv.pack(fill=tk.BOTH, expand=True, pady=5)

# Tabla nuevos items
ttk.Label(frame_tables, text="Nuevos Items Obtenidos").pack()
tree_new = ttk.Treeview(frame_tables, columns=("Nombre", "Cantidad", "Slot"), show='headings')
for col in ("Nombre", "Cantidad", "Slot"):
    tree_new.heading(col, text=col)
tree_new.pack(fill=tk.BOTH, expand=True, pady=5)

# Lista para detectar nuevos items
previous_items = []

def read_inventory():
    global previous_items
    if not os.path.exists(INVENTORY_FILE):
        return [], []
    try:
        with open(INVENTORY_FILE, "r") as f:
            items = json.load(f)
    except Exception as e:
        print("Error leyendo inventory.json:", e)
        return [], []

    # Tabla de nuevos items
    new_items = [i for i in items if not any(pi['name']==i['name'] and pi['count']==i['count'] for pi in previous_items)]

    previous_items = items
    return items, new_items

def update_tables():
    items, new_items = read_inventory()

    # Limpiar tablas
    for i in tree_inv.get_children():
        tree_inv.delete(i)
    for i in tree_new.get_children():
        tree_new.delete(i)

    # Llenar inventario actual
    for i in items:
        tree_inv.insert("", tk.END, values=(i['name'], i['count'], i['slot'], i['slot']//9))

    # Llenar nuevos items
    for i in new_items:
        tree_new.insert("", tk.END, values=(i['name'], i['count'], i['slot']))

    root.after(REFRESH_INTERVAL * 1000, update_tables)

# Iniciar actualización
update_tables()
root.mainloop()
