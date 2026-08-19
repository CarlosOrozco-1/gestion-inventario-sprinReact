#!/usr/bin/env bash
set -euo pipefail

# Crea y activa un archivo de swap de 8 GB.
# Útil para instancias Oracle Free con poca RAM (1 GB) antes de levantar Docker.

SWAP_FILE="${SWAP_FILE:-/swapfile}"
SWAP_SIZE_MB="${SWAP_SIZE_MB:-8192}"   # 8 GB

if swapon --show | grep -q "^${SWAP_FILE}"; then
  echo ">> El swap ya está activo en ${SWAP_FILE}."
  free -h
  exit 0
fi

if [ ! -f "$SWAP_FILE" ]; then
  echo ">> Creando archivo de swap de ${SWAP_SIZE_MB} MB en ${SWAP_FILE} (puede tardar)..."
  if command -v fallocate >/dev/null 2>&1; then
    sudo fallocate -l "${SWAP_SIZE_MB}M" "$SWAP_FILE" \
      || sudo dd if=/dev/zero of="$SWAP_FILE" bs=1M count="$SWAP_SIZE_MB" status=progress
  else
    sudo dd if=/dev/zero of="$SWAP_FILE" bs=1M count="$SWAP_SIZE_MB" status=progress
  fi
fi

sudo chmod 600 "$SWAP_FILE"
sudo mkswap "$SWAP_FILE"
sudo swapon "$SWAP_FILE"

# Persistir tras reinicio
if ! grep -q "^${SWAP_FILE} " /etc/fstab; then
  echo "${SWAP_FILE} none swap sw 0 0" | sudo tee -a /etc/fstab
fi

# Preferir RAM antes que swap
sudo sysctl vm.swappiness=10
if grep -q '^vm.swappiness=' /etc/sysctl.conf; then
  sudo sed -i 's/^vm.swappiness=.*/vm.swappiness=10/' /etc/sysctl.conf
else
  echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
fi

echo ""
echo ">> Swap configurado:"
free -h
