#!/bin/bash

DESTINATION_DIR="docs/assets/media" # Ruta de destino
SOURCE_DIR="packages/*/*/media" # Ruta de origen
HTML_DIR="docs" # Ruta de destino de los archivos HTML

# Crear la carpeta de destino si no existe
mkdir -p "$DESTINATION_DIR"

# Copiar todos los archivos de las carpetas media a la carpeta de destino
find $SOURCE_DIR -type f -exec cp {} "$DESTINATION_DIR" \;

# Modificar los enlaces en los archivos HTML
find $HTML_DIR -name "*.html" -type f | while read file; do
    if [ -f "$file" ]; then
        sed -i'' -e 's/src="media\//src="..\/assets\/media\//g' "$file"
    fi
done
