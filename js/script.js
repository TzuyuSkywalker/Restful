document.addEventListener("DOMContentLoaded", () => {
  const isUserPage =
    window.location.pathname.endsWith("/index.html") ||
    window.location.pathname === "/";
  const isAdminPage = window.location.pathname.endsWith("/admin.html");
  const isHistoryPage = window.location.pathname.endsWith("/history.html"); // Detectar página de historial

  // Elementos comunes o específicos de cada página que necesitamos manipular
  const loginPanel = document.getElementById("login-panel");
  const nicknameInput = document.getElementById("nickname-input"); // Solo en index.html
  const adminNicknameInput = document.getElementById("admin-nickname-input"); // Solo en admin.html
  const submitNicknameBtn = document.getElementById("submit-nickname-btn"); // Solo en index.html
  const submitAdminNicknameBtn = document.getElementById(
    "submit-admin-nickname-btn"
  ); // Solo en admin.html

  const currentUserDisplay = document.getElementById("current-user-display");
  const logoutBtn = document.getElementById("logout-btn");
  const loginBtn = document.getElementById("login-btn");

  const userPanel = document.getElementById("user-panel"); // Solo en index.html
  const adminPanel = document.getElementById("admin-panel"); // Solo en admin.html
  const historyPanel = document.getElementById("history-panel"); // Panel de historial

  // Elementos específicos del panel de administración
  const itemNameInput = document.getElementById("item-name");
  const itemDescriptionInput = document.getElementById("item-description");
  const addItemBtn = document.getElementById("add-item-btn");
  const adminItemList = document.getElementById("admin-item-list");

  const predefinedItemsList = document.getElementById("predefined-items-list");

  const availableItemsList = document.getElementById("available-items-list"); // Solo en index.html
  const lootQueueTableBody = document.getElementById("loot-queue-table-body"); // Ambas páginas (index y admin)
  const winnersHistoryTableBody = document.getElementById(
    "winners-history-table-body"
  ); // Solo en history.html

  let currentUser = null;
  let items = JSON.parse(localStorage.getItem("items")) || [];
  let lootQueue = JSON.parse(localStorage.getItem("lootQueue")) || [];
  let winnersHistory = JSON.parse(localStorage.getItem("winnersHistory")) || []; // Historial de ganadores

  // Ítems predefinidos
  const predefinedItems = [
    {
      baseId: "crystal_of_chaos",
      name: "Crystal of Chaos",
      img: "img/coc.png", // Asegúrate de tener esta imagen
      description: "Un cristal legendario de gran poder.",
    },
    {
      baseId: "feather_of_flight",
      name: "Feather of Condor",
      img: "img/Featherofcondor.png", // Asegúrate de tener esta imagen
      description: "Una pluma mágica que otorga agilidad.",
    },
    {
      baseId: "flame_of_condor",
      name: "Flame of Condor",
      img: "img/flameofcondor.png", // Asegúrate de tener esta imagen
      description: "Contiene tesoros olvidados de eras pasadas.",
    },
    // Agrega más ítems predefinidos aquí
  ];

  // --- Funciones de Utilidad ---

  function saveToLocalStorage() {
    localStorage.setItem("items", JSON.stringify(items));
    localStorage.setItem("lootQueue", JSON.stringify(lootQueue));
    localStorage.setItem("winnersHistory", JSON.stringify(winnersHistory)); // NUEVO: Guardar historial
  }

  function renderPredefinedItems() {
    if (!predefinedItemsList) return;

    predefinedItemsList.innerHTML = "";
    predefinedItems.forEach((item) => {
      const listItem = document.createElement("div");
      listItem.className =
        "list-group-item d-flex justify-content-between align-items-center mb-2";
      listItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${item.img}" alt="${item.name}" width="24" height="24" class="me-2">
                    <span>${item.name}</span>
                </div>
                <div class="d-flex align-items-center">
                    <input type="text" class="form-control form-control-sm me-2 item-custom-name" placeholder="Ej: CoC Top">
                    <button class="btn btn-sm btn-primary list-predefined-item-btn" data-base-id="${item.baseId}">Listar</button>
                </div>
            `;
      predefinedItemsList.appendChild(listItem);
    });
  }

  function renderAdminItems() {
    if (!adminItemList) return;

    adminItemList.innerHTML = "";
    if (items.length === 0) {
      adminItemList.innerHTML =
        '<li class="list-group-item text-muted">No hay ítems cargados</li>';
      return;
    }
    items.forEach((item, index) => {
      const listItem = document.createElement("li");
      listItem.className =
        "list-group-item d-flex justify-content-between align-items-center";
      let itemStatusText = "";
      let actionsHtml = "";

      if (item.status === "active") {
        const timeLeft = item.endTime - Date.now();
        if (timeLeft > 0) {
          const minutes = Math.floor(timeLeft / 60000);
          const seconds = Math.floor((timeLeft % 60000) / 1000);
          itemStatusText = `Activo (finaliza en ${minutes}m ${seconds}s)`;
        } else {
          itemStatusText = "Finalizado (procesando...)";
        }
      } else if (item.status === "closed") {
        itemStatusText = "Cerrado (sin asignar)";
        actionsHtml = `<button class="btn btn-sm btn-warning me-2" data-index="${index}" data-action="pick-winner">Elegir Ganador</button>`;
      } else if (item.status === "assigned") {
        itemStatusText = `Asignado a ${item.assignedTo}`;
      } else if (item.status === "unclaimed") {
        itemStatusText = "Cerrado (sin participantes)";
      }

      listItem.innerHTML = `
                <div class="d-flex flex-column">
                    <strong>${item.name}</strong>
                    <small class="text-muted">${item.description}</small>
                    <small class="text-info">${itemStatusText}</small>
                </div>
                <div>
                    ${actionsHtml}
                    <button class="btn btn-sm btn-danger" data-index="${index}" data-action="delete-item">Eliminar</button>
                </div>
            `;
      adminItemList.appendChild(listItem);
    });
  }

  function renderAvailableItems() {
    if (!availableItemsList) return;

    availableItemsList.innerHTML = "";
    const activeItems = items.filter(
      (item) => item.status === "active" && item.endTime > Date.now()
    );

    if (activeItems.length === 0) {
      availableItemsList.innerHTML =
        '<li class="list-group-item text-muted">No available items</li>';
      return;
    }

    activeItems.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.className =
        "list-group-item d-flex justify-content-between align-items-center";

      let buttonText = "Participar";
      let buttonClass = "btn-success participate-btn";
      let isDisabled = true;

      const isUserQueuedForThisItem = lootQueue.some(
        (entry) =>
          entry.playerNick === currentUser &&
          entry.itemId === item.id &&
          entry.status === "Queued"
      );

      if (currentUser && currentUser.toLowerCase() !== "admin") {
        if (isUserQueuedForThisItem) {
          buttonText = `Ya en cola para ${item.name}`;
          buttonClass = "btn-info";
          isDisabled = true;
        } else {
          buttonText = `Poner en cola para ${item.name}`;
          buttonClass = "btn-primary participate-btn";
          isDisabled = false;
        }
      } else {
        buttonText = "Loguéate para participar";
        buttonClass = "btn-secondary";
        isDisabled = true;
      }

      const timeLeft = item.endTime - Date.now();
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      const timerDisplay =
        timeLeft > 0
          ? `<small class="text-warning ms-2">${minutes}m ${seconds}s</small>`
          : `<small class="text-danger ms-2">Cerrado</small>`;

      listItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${item.img}" alt="${
        item.name
      }" width="24" height="24" class="me-2">
                    <div class="d-flex flex-column align-items-start">
                        <strong>${item.name}</strong>
                        ${timerDisplay}
                    </div>
                </div>
                <button class="${buttonClass}" data-item-id="${item.id}" ${
        isDisabled ? "disabled" : ""
      }>${buttonText}</button>
            `;
      availableItemsList.appendChild(listItem);
    });
  }

  function renderLootQueue() {
    if (!lootQueueTableBody) return;

    lootQueueTableBody.innerHTML = "";
    if (lootQueue.length === 0) {
      lootQueueTableBody.innerHTML =
        '<tr><td colspan="5" class="text-center text-muted">No players in queue</td></tr>';
      return;
    }

    lootQueue.forEach((entry, index) => {
      const row = document.createElement("tr");
      let statusClass = "";
      let statusText = "";
      let assignedItemName = "N/A";

      const relatedItem = items.find((item) => item.id === entry.itemId);

      if (entry.status === "Assigned" && entry.assignedItem) {
        assignedItemName = entry.assignedItem.name;
      }

      switch (entry.status) {
        case "Queued":
          statusClass = "status-queued";
          statusText = "Queued";
          if (relatedItem) {
            statusText += ` en ${relatedItem.name}`;
          }
          break;
        case "Skipped":
          statusClass = "status-skipped";
          statusText = "Skipped";
          if (relatedItem) {
            statusText += ` para ${relatedItem.name}`;
          }
          break;
        case "Assigned":
          statusClass = "status-assigned";
          statusText = "Assigned";
          break;
        default:
          statusClass = "";
          statusText = entry.status;
      }

      row.innerHTML = `
                <td>${entry.playerNick}</td>
                <td>${new Date(entry.queueDate).toLocaleDateString()}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>${assignedItemName}</td>
                <td>
                    ${
                      isAdminPage && currentUser === "admin"
                        ? `
                        <button class="btn btn-sm btn-warning me-2" data-index="${index}" data-action="assign">Asignar</button>
                        <button class="btn btn-sm btn-info me-2" data-index="${index}" data-action="skip">Saltar</button>
                        <button class="btn btn-sm btn-danger" data-index="${index}" data-action="remove">Eliminar</button>
                    `
                        : isUserPage &&
                          currentUser === entry.playerNick &&
                          entry.status === "Queued"
                        ? `
                        <button class="btn btn-sm btn-secondary withdraw-btn" data-index="${index}">Retirarse</button>
                    `
                        : ""
                    }
                </td>
            `;
      lootQueueTableBody.appendChild(row);
    });
  }

  // Renderiza el historial de ganadores
  function renderWinnersHistory() {
    if (!winnersHistoryTableBody) return;

    winnersHistoryTableBody.innerHTML = "";
    if (winnersHistory.length === 0) {
      winnersHistoryTableBody.innerHTML =
        '<tr><td colspan="3" class="text-center text-muted">No hay ganadores registrados aún.</td></tr>';
      return;
    }

    // Ordenar por fecha de asignación descendente (más recientes primero)
    const sortedHistory = [...winnersHistory].sort(
      (a, b) => new Date(b.assignedDate) - new Date(a.assignedDate)
    );

    sortedHistory.forEach((winnerEntry) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>
                    <img src="${winnerEntry.itemImg}" alt="${
        winnerEntry.itemName
      }" width="24" height="24" class="me-2">
                    ${winnerEntry.itemName}
                </td>
                <td>${winnerEntry.winnerNick}</td>
                <td>${new Date(
                  winnerEntry.assignedDate
                ).toLocaleDateString()}</td>
            `;
      winnersHistoryTableBody.appendChild(row);
    });
  }

  // Función para seleccionar un ganador aleatorio
  function pickRandomWinner(itemId) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const participants = lootQueue.filter(
      (entry) => entry.itemId === itemId && entry.status === "Queued"
    );

    if (participants.length > 0) {
      const winnerIndex = Math.floor(Math.random() * participants.length);
      const winnerEntry = participants[winnerIndex];

      // Marcar al ganador como asignado
      // Primero, encuentra la entrada original en lootQueue para actualizar su estado
      const originalWinnerEntry = lootQueue.find(
        (entry) => entry.id === winnerEntry.id
      );
      if (originalWinnerEntry) {
        originalWinnerEntry.status = "Assigned";
        originalWinnerEntry.assignedItem = { id: item.id, name: item.name };
      }

      item.assignedTo = winnerEntry.playerNick; // Marcar el ítem como asignado
      item.status = "assigned"; // Cambiar el estado del ítem a asignado

      // NUEVO: Añadir al historial de ganadores
      winnersHistory.push({
        id: Date.now(), // ID único para esta entrada de historial
        itemId: item.id,
        itemName: item.name,
        winnerNick: winnerEntry.playerNick,
        assignedDate: new Date().toISOString(),
        itemImg: item.img, // Guardar la ruta de la imagen para el historial
      });

      // Marcar a los demás participantes del mismo ítem como "Skipped"
      lootQueue.forEach((entry) => {
        if (
          entry.itemId === itemId &&
          entry.status === "Queued" &&
          entry.id !== winnerEntry.id // Asegurarse de no saltar al ganador
        ) {
          entry.status = "Skipped";
        }
      });

      alert(`¡${winnerEntry.playerNick} ha ganado "${item.name}"!`);
    } else {
      item.status = "unclaimed"; // Si no hay participantes, el ítem queda sin reclamar
      alert(`"${item.name}" ha finalizado sin participantes.`);
    }
    saveToLocalStorage();
    renderAdminItems();
    renderLootQueue();
    renderAvailableItems();
    renderWinnersHistory(); // NUEVO: Actualizar el historial también
  }

  // Intervalo para verificar el estado de los ítems y seleccionar ganadores
  setInterval(() => {
    let changed = false;
    items.forEach((item) => {
      if (item.status === "active" && item.endTime <= Date.now()) {
        item.status = "closed"; // Marcar como cerrado
        changed = true;
        pickRandomWinner(item.id); // pickRandomWinner ya guarda y renderiza
      }
    });

    if (changed) {
      saveToLocalStorage();
      // Solo renderizar si estamos en la página relevante
      if (isAdminPage) renderAdminItems();
      if (isUserPage) renderAvailableItems();
      if (isHistoryPage) renderWinnersHistory(); // NUEVO: Actualizar historial en su página
    }
    // Actualizar temporizadores en tiempo real en la vista de usuario
    if (isUserPage) renderAvailableItems();
  }, 1000); // Ejecutar cada segundo

  // --- Control de Interfaz y Logins ---

  function updateUIForPage() {
    // NUEVO: Lógica específica para la página de historial (pública)
    if (isHistoryPage) {
      if (historyPanel) historyPanel.style.display = "block";
      if (loginPanel) loginPanel.style.display = "none"; // Ocultar el panel de login si existe
      if (userPanel) userPanel.style.display = "none";
      if (adminPanel) adminPanel.style.display = "none";
      renderWinnersHistory(); // Renderizar el historial inmediatamente

      // La navbar puede mostrar estado de login si el usuario está logueado, pero no es necesario para el acceso
      if (currentUser) {
        if (currentUserDisplay)
          currentUserDisplay.textContent = `Bienvenido, ${currentUser}`;
        if (logoutBtn) logoutBtn.style.display = "block";
        if (loginBtn) loginBtn.style.display = "none";
      } else {
        if (currentUserDisplay) currentUserDisplay.textContent = "";
        if (logoutBtn) logoutBtn.style.display = "none";
        if (loginBtn) loginBtn.style.display = "block"; // Mostrar botón de login si no hay sesión
      }
      return; // Salir de la función, ya que la lógica de otras páginas no aplica aquí
    }

    // Lógica para otras páginas (index.html y admin.html) que sí requieren login
    if (currentUser) {
      if (loginPanel) loginPanel.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "block";
      if (loginBtn) loginBtn.style.display = "none";
      if (currentUserDisplay)
        currentUserDisplay.textContent = `Bienvenido, ${currentUser}`;

      if (isUserPage) {
        if (userPanel) userPanel.style.display = "block";
        if (adminPanel) adminPanel.style.display = "none";
      } else if (isAdminPage) {
        if (currentUser === "admin") {
          if (adminPanel) adminPanel.style.display = "block";
          if (userPanel) userPanel.style.display = "none";
        } else {
          alert(
            "Acceso no autorizado. Solo el administrador puede usar esta página."
          );
          logoutUser();
          return;
        }
      }
    } else {
      // Nadie logueado en index.html o admin.html
      if (loginPanel) loginPanel.style.display = "block";
      if (logoutBtn) logoutBtn.style.display = "none";
      if (loginBtn) loginBtn.style.display = "block";
      if (currentUserDisplay) currentUserDisplay.textContent = "";

      if (userPanel) userPanel.style.display = "none";
      if (adminPanel) adminPanel.style.display = "none";
    }

    // Renderizar elementos relevantes para la página actual
    if (isAdminPage && currentUser === "admin") {
      renderPredefinedItems();
      renderAdminItems();
      renderLootQueue();
    } else if (isUserPage) {
      renderAvailableItems();
      renderLootQueue();
    }
  }

  function loginUser(nick) {
    currentUser = nick;
    localStorage.setItem("currentUser", nick);
    updateUIForPage();
  }

  function logoutUser() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    // Redirigir a la página de login relevante
    if (isAdminPage) {
      window.location.href = "admin.html";
    } else if (isHistoryPage) {
      // Si el usuario hace logout desde la página de historial,
      // simplemente recargamos la página para limpiar el estado de usuario en la navbar
      // ya que la página de historial es pública y no necesita un login.
      window.location.reload();
    } else {
      window.location.href = "index.html";
    }
  }

  // --- Event Listeners Globales o Condicionales ---

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      // En la página de historial, el botón de login no inicia sesión, solo recarga para limpiar el estado si ya estaba logueado.
      // En otras páginas, si no hay currentUser, el botón de login simplemente muestra el panel de login.
      if (isHistoryPage) {
        window.location.reload(); // Recargar para limpiar el estado del usuario en la navbar
      } else if (currentUser) {
        // Si hay usuario logueado y no es history page, es un logout
        logoutUser();
      } else {
        // Si no hay usuario logueado y no es history page, solo muestra el panel de login
        if (loginPanel) loginPanel.style.display = "block";
        if (userPanel) userPanel.style.display = "none";
        if (adminPanel) adminPanel.style.display = "none";
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logoutUser);
  }

  // --- Lógica Específica de index.html (Miembros) ---
  if (isUserPage) {
    if (submitNicknameBtn) {
      submitNicknameBtn.addEventListener("click", () => {
        const nick = nicknameInput.value.trim();
        if (nick && nick.toLowerCase() !== "admin") {
          loginUser(nick);
        } else if (nick.toLowerCase() === "admin") {
          alert(
            'El nick "admin" está reservado para el panel de administración. Por favor, elige otro nick.'
          );
        } else {
          alert("Por favor, ingresa tu nick.");
        }
      });
    }

    if (availableItemsList) {
      availableItemsList.addEventListener("click", (e) => {
        if (e.target.classList.contains("participate-btn")) {
          if (!currentUser || currentUser.toLowerCase() === "admin") {
            alert("Por favor, loguéate como jugador para participar.");
            return;
          }

          const itemId = parseInt(e.target.dataset.itemId);
          const item = items.find((i) => i.id === itemId);

          if (item) {
            const alreadyQueuedForThisSpecificItem = lootQueue.some(
              (entry) =>
                entry.playerNick === currentUser &&
                entry.itemId === item.id &&
                entry.status === "Queued"
            );

            if (alreadyQueuedForThisSpecificItem) {
              alert(
                `Ya estás en cola para "${item.name}". No puedes unirte dos veces al mismo ítem.`
              );
              return;
            }

            if (item.status !== "active" || item.endTime <= Date.now()) {
              alert(`"${item.name}" ya no está disponible para participar.`);
              return;
            }

            const newQueueEntry = {
              id: Date.now(),
              playerNick: currentUser,
              itemId: item.id,
              queueDate: new Date().toISOString(),
              status: "Queued",
              assignedItem: null,
            };
            lootQueue.push(newQueueEntry);
            saveToLocalStorage();
            renderLootQueue();
            renderAvailableItems();
            alert(`Te has unido a la cola para "${item.name}".`);
          }
        }
      });
    }

    if (lootQueueTableBody) {
      lootQueueTableBody.addEventListener("click", (e) => {
        if (e.target.classList.contains("withdraw-btn")) {
          const index = e.target.dataset.index;
          const entry = lootQueue[index];
          if (!entry) return;

          if (currentUser === entry.playerNick && entry.status === "Queued") {
            if (
              confirm(
                "¿Estás seguro de que quieres retirarte de la cola para este ítem?"
              )
            ) {
              lootQueue.splice(index, 1);
              saveToLocalStorage();
              renderLootQueue();
              renderAvailableItems();
              alert("Te has retirado de la cola.");
            }
          }
        }
      });
    }
  }

  // --- Lógica Específica de admin.html (Administrador) ---
  if (isAdminPage) {
    if (submitAdminNicknameBtn) {
      submitAdminNicknameBtn.addEventListener("click", () => {
        const nick = adminNicknameInput.value.trim();
        if (nick.toLowerCase() === "admin") {
          loginUser(nick);
        } else {
          alert('Nick de administrador incorrecto. Intenta con "admin".');
        }
      });
    }

    if (predefinedItemsList) {
      predefinedItemsList.addEventListener("click", (e) => {
        if (e.target.classList.contains("list-predefined-item-btn")) {
          const baseId = e.target.dataset.baseId;
          const predefinedItem = predefinedItems.find(
            (item) => item.baseId === baseId
          );
          const customNameInput = e.target.previousElementSibling;
          const customName = customNameInput.value.trim();

          if (predefinedItem) {
            const now = Date.now();
            const newItem = {
              id: now,
              baseId: predefinedItem.baseId,
              name: customName
                ? `${predefinedItem.name} (${customName})`
                : predefinedItem.name,
              description: predefinedItem.description,
              img: predefinedItem.img,
              listedTime: now,
              endTime: now + 10 * 60 * 1000,
              status: "active",
              assignedTo: null,
            };
            items.push(newItem);
            saveToLocalStorage();
            customNameInput.value = "";
            renderAdminItems();
            renderAvailableItems();
            alert(`"${newItem.name}" ha sido listado por 10 minutos.`);
          }
        }
      });
    }

    if (adminItemList) {
      adminItemList.addEventListener("click", (e) => {
        if (e.target.dataset.action === "pick-winner") {
          const index = e.target.dataset.index;
          const item = items[index];
          if (item && item.status === "closed") {
            pickRandomWinner(item.id);
          } else {
            alert(
              "Solo puedes elegir ganador para ítems cerrados y no asignados."
            );
          }
        } else if (e.target.dataset.action === "delete-item") {
          const index = e.target.dataset.index;
          if (
            confirm(
              "¿Estás seguro de que quieres eliminar este ítem? Esto también eliminará sus participantes de la cola."
            )
          ) {
            const deletedItemId = items[index].id;
            items.splice(index, 1);
            // Eliminar todas las entradas de cola relacionadas con este ítem
            lootQueue = lootQueue.filter(
              (entry) => entry.itemId !== deletedItemId
            );
            saveToLocalStorage();
            renderAdminItems();
            renderLootQueue();
            renderAvailableItems();
            alert("Ítem y sus entradas de cola eliminados.");
          }
        }
      });
    }

    if (addItemBtn) {
      addItemBtn.addEventListener("click", () => {
        const name = itemNameInput.value.trim();
        const description = itemDescriptionInput.value.trim();
        if (name) {
          const now = Date.now();
          const newItem = {
            id: now,
            name: name,
            description: description,
            img: "img/trash.png",
            listedTime: now,
            endTime: now + 10 * 60 * 1000,
            status: "active",
            assignedTo: null,
          };
          items.push(newItem);
          saveToLocalStorage();
          itemNameInput.value = "";
          itemDescriptionInput.value = "";
          renderAdminItems();
          renderAvailableItems();
          alert(`"${newItem.name}" ha sido listado por 10 minutes.`);
        } else {
          alert("El nombre del ítem es obligatorio.");
        }
      });
    }

    if (lootQueueTableBody) {
      lootQueueTableBody.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") {
          const index = e.target.dataset.index;
          const entry = lootQueue[index];

          if (!entry) return;

          const action = e.target.dataset.action;

          if (action === "assign") {
            const itemToAssign = items.find((item) => item.id === entry.itemId);
            if (
              itemToAssign &&
              itemToAssign.status === "closed" &&
              !itemToAssign.assignedTo
            ) {
              // Actualizar la entrada original en lootQueue
              const originalEntryInQueue = lootQueue.find(
                (qEntry) => qEntry.id === entry.id
              );
              if (originalEntryInQueue) {
                originalEntryInQueue.status = "Assigned";
                originalEntryInQueue.assignedItem = {
                  id: itemToAssign.id,
                  name: itemToAssign.name,
                };
              }

              itemToAssign.assignedTo = entry.playerNick;
              itemToAssign.status = "assigned";

              // Añadir al historial de ganadores (si no se hizo ya por pickRandomWinner)
              // Se verifica si ya existe una entrada para este ítem y ganador en el historial
              const alreadyInHistory = winnersHistory.some(
                (histEntry) =>
                  histEntry.itemId === itemToAssign.id &&
                  histEntry.winnerNick === entry.playerNick
              );
              if (!alreadyInHistory) {
                winnersHistory.push({
                  id: Date.now(),
                  itemId: itemToAssign.id,
                  itemName: itemToAssign.name,
                  winnerNick: entry.playerNick,
                  assignedDate: new Date().toISOString(),
                  itemImg: itemToAssign.img,
                });
              }

              lootQueue.forEach((otherEntry) => {
                if (
                  otherEntry.itemId === itemToAssign.id &&
                  otherEntry.status === "Queued" &&
                  otherEntry.id !== entry.id
                ) {
                  otherEntry.status = "Skipped";
                }
              });
            } else {
              alert("Este ítem no está en estado 'Cerrado' o ya fue asignado.");
            }
          } else if (action === "skip") {
            if (entry.status === "Queued") {
              entry.status = "Skipped";
              alert(`"${entry.playerNick}" ha sido saltado para este ítem.`);
            } else {
              alert('Este jugador no está en estado "En Cola".');
            }
          } else if (action === "remove") {
            if (
              confirm(
                "¿Estás seguro de que quieres eliminar a este jugador de la cola?"
              )
            ) {
              if (entry.status === "Assigned" && entry.assignedItem) {
                const assignedItem = items.find(
                  (item) => item.id === entry.assignedItem.id
                );
                if (
                  assignedItem &&
                  assignedItem.assignedTo === entry.playerNick
                ) {
                  assignedItem.assignedTo = null;
                  assignedItem.status = "closed";
                }
              }
              lootQueue.splice(index, 1);
              alert(`"${entry.playerNick}" ha sido eliminado de la cola.`);
            }
          }
          saveToLocalStorage();
          renderLootQueue();
          renderAdminItems();
          renderAvailableItems();
          renderWinnersHistory(); // Actualizar historial si hay cambios relevantes
        }
      });
    }
  }

  // --- Inicialización ---
  // Cargar el usuario actual al cargar la página
  const storedUser = localStorage.getItem("currentUser");

  // NUEVO: Lógica de inicialización para currentUser basada en la página
  if (isHistoryPage) {
    currentUser = null; // En la página de historial, no hay "usuario logueado" para el contenido
    localStorage.removeItem("currentUser"); // Asegurarse de limpiar cualquier sesión previa
  } else if (storedUser) {
    currentUser = storedUser;
  }

  // Actualizar la UI según la página y el usuario logueado
  updateUIForPage();
});
