console.log("script.js loaded successfully!");
let currentUser = null;
let items = [];
let lootQueue = [];
let winnersHistory = [];

// Detectar la página actual
const isUserPage =
  window.location.pathname.endsWith("/index.html") ||
  window.location.pathname === "/";
const isAdminPage = window.location.pathname.endsWith("/admin.html");
const isHistoryPage = window.location.pathname.endsWith("/history.html") || window.location.pathname.endsWith("/history");
console.log("isHistoryPage:", isHistoryPage);

// Elementos comunes o específicos de cada página que necesitamos manipular
const loginPanel = document.getElementById("login-panel");
const nicknameInput = document.getElementById("nickname-input");
const adminNicknameInput = document.getElementById("admin-nickname-input");
const adminUsernameInput = document.getElementById("admin-username-input");
const submitNicknameBtn = document.getElementById("submit-nickname-btn");
const submitAdminNicknameBtn = document.getElementById(
  "submit-admin-nickname-btn"
);

const currentUserDisplay = document.getElementById("current-user-display");
const logoutBtn = document.getElementById("logout-btn");
const loginBtn = document.getElementById("login-btn");

const userPanel = document.getElementById("user-panel");
const adminPanel = document.getElementById("admin-panel");
const historyPanel = document.getElementById("history-panel");

const itemNameInput = document.getElementById("item-name");
const itemDescriptionInput = document.getElementById("item-description");
const addItemBtn = document.getElementById("add-item-btn");
const adminItemList = document.getElementById("admin-item-list");

const predefinedItemsList = document.getElementById("predefined-items-list");
const availableItemsList = document.getElementById("available-items-list");
const lootQueueTableBody = document.getElementById("loot-queue-table-body");
const winnersHistoryTableBody = document.getElementById(
  "winners-history-table-body"
);

// Ítems predefinidos
const predefinedItems = [
  {
    baseId: "crystal_of_chaos",
    name: "Crystal of Chaos",
    img: "img/coc.png",
    description: "Un cristal legendario de gran poder.",
  },
  {
    baseId: "feather_of_flight",
    name: "Feather of Condor",
    img: "img/Featherofcondor.png",
    description: "Una pluma mágica que otorga agilidad.",
  },
  {
    baseId: "flame_of_condor",
    name: "Flame of Condor",
    img: "img/flameofcondor.png",
    description: "Contains forgotten treasures from past eras.",
  },
  {
    baseId: "jewel_of_creation",
    name: "Jewel of Creation",
    img: "img/jewelofcreation.png",
    description: "Contains forgotten treasures from past eras.",
  },
  {
    baseId: "awakening_crystal",
    name: "Awakening Crystal",
    img: "img/awakeningjewel.png",
    description: "Contains forgotten treasures from past eras.",
  },
  {
    baseId: "archangel_weapon_box",
    name: "Archangel weapon",
    img: "img/archangelweaponbox.png",
    description: "Contains forgotten treasures from past eras.",
  },
];

// --- Funciones de Utilidad ---

// Función para cargar datos desde Supabase
async function fetchDataFromSupabase() {
  console.log("Fetching data from Supabase...");
  try {
    // Cargar ítems
    const { data: fetchedItems, error: itemsError } = await supabase
      .from('items')
      .select('*');
    if (itemsError) throw itemsError;
    items = fetchedItems;

    // Cargar cola de loot
    const { data: fetchedLootQueue, error: lootQueueError } = await supabase
      .from('loot_queue')
      .select('*');
    if (lootQueueError) throw lootQueueError;
    lootQueue = fetchedLootQueue;

    // Cargar historial de ganadores
    const { data: fetchedWinnersHistory, error: winnersHistoryError } = await supabase
      .from('winners_history')
      .select('*');
    if (winnersHistoryError) throw winnersHistoryError;
    winnersHistory = fetchedWinnersHistory;
    console.log("Fetched winners history:", winnersHistory);

    console.log("Data fetched successfully.");
  } catch (error) {
    console.error("Error fetching data from Supabase:", error.message);
    alert("Error al cargar datos: " + error.message);
  }
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
  const itemsToDisplay = items.filter(item => (item.status === "active" || item.status === "closed") && item.assigned_to_player_nickname === null);

  if (itemsToDisplay.length === 0) {
    adminItemList.innerHTML =
      '<li class="list-group-item text-muted">No hay ítems cargados</li>';
    return;
  }
  itemsToDisplay.forEach((item, index) => {
    const listItem = document.createElement("li");
    listItem.className =
      "list-group-item d-flex justify-content-between align-items-center";
    let itemStatusText = "";
    let actionsHtml = "";

    if (item.status === "active") {
      const timeLeft = item.end_time - Date.now();
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
      itemStatusText = `Asignado a ${item.assigned_to_player_nickname}`;
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
    (item) => item.status === "active" && new Date(item.end_time) > Date.now()
  );

  if (activeItems.length === 0) {
    availableItemsList.innerHTML =
      '<li class="list-group-item text-muted">No available items</li>';
    return;
  }

  activeItems.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.className =
      "list-group-item d-flex flex-column"; // Changed to flex-column

    let buttonText = "Participar";
    let buttonClass = "btn-emerald participate-btn"; // Changed to btn-emerald
    let isDisabled = true;

    const isUserQueuedForThisItem = lootQueue.some(
      (entry) =>
        entry.player_nickname === currentUser &&
        entry.item_id === item.id &&
        entry.status === "Queued"
    );

    if (currentUser && currentUser.toLowerCase() !== "admin") {
      if (isUserQueuedForThisItem) {
        buttonText = `Ya en cola para ${item.name}`;
        buttonClass = "btn-info"; // Keep btn-info for already queued
        isDisabled = true;
      } else {
        buttonText = `Poner en cola para ${item.name}`;
        buttonClass = "btn-emerald participate-btn"; // Ensure btn-emerald for active participation
        isDisabled = false;
      }
    } else {
      buttonText = "Loguéate para participar";
      buttonClass = "btn-secondary";
      isDisabled = true;
    }

    const timeLeft = new Date(item.end_time) - Date.now();
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const timerDisplay =
      timeLeft > 0
        ? `<small class="text-warning ms-2">${minutes}m ${seconds}s</small>`
        : `<small class="text-danger ms-2">Cerrado</small>`;

    listItem.innerHTML = `
              <div class="d-flex align-items-center mb-2"> <!-- Top row: image, name, timer -->
                  <img src="${item.img_url}" alt="${
      item.name
    }" width="24" height="24" class="me-2">
                  <div class="d-flex flex-column align-items-start flex-grow-1">
                      <strong>${item.name}</strong>
                      ${timerDisplay}
                  </div>
              </div>
              <button class="${buttonClass} w-100" data-item-id="${item.id}" ${
      isDisabled ? "disabled" : ""
    }>
                <i class="bi bi-hand-index-thumb me-2"></i>${buttonText}
              </button>
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

    const relatedItem = items.find((item) => item.id === entry.item_id);

    if (relatedItem) {
      assignedItemName = relatedItem.name;
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
              <td>${entry.player_nickname}</td>
              <td>${new Date(entry.queue_date).toLocaleDateString()}</td>
              <td><span class="${statusClass}">${statusText}</span></td>
              <td>${assignedItemName}</td>
              <td>
                  ${
                    isAdminPage && currentUser === "admin"
                      ? `
                      <button class="btn btn-sm btn-info me-2" data-index="${index}" data-action="skip">Saltar</button>
                      <button class="btn btn-sm btn-danger" data-index="${index}" data-action="remove">Eliminar</button>
                  `
                      : isUserPage &&
                        currentUser === entry.player_nickname &&
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
  if (!winnersHistoryTableBody) {
    console.log("winnersHistoryTableBody element not found.");
    return;
  }
  console.log("winnersHistoryTableBody element:", winnersHistoryTableBody);
  console.log("Rendering winners history. Current winnersHistory array:", winnersHistory);

  winnersHistoryTableBody.innerHTML = "";
  if (winnersHistory.length === 0) {
    console.log("winnersHistory array is empty. Displaying 'No winners yet' message.");
    winnersHistoryTableBody.innerHTML =
      '<tr><td colspan="3" class="text-center text-muted">No hay ganadores registrados aún.</td></tr>';
    return;
  }

  // Ordenar por fecha de asignación descendente (más recientes primero)
  const sortedHistory = [...winnersHistory].sort(
    (a, b) => new Date(b.assigned_date) - new Date(a.assigned_date)
  );

  console.log("Sorted winners history:", sortedHistory);

  sortedHistory.forEach((winnerEntry, index) => {
    console.log(`Processing winner entry ${index}:`, winnerEntry);

    // Basic validation for critical properties
    if (!winnerEntry.item_img_url) {
      console.error(`Winner entry ${index} is missing item_img_url. Skipping entry:`, winnerEntry);
      return; // Skip this entry if critical data is missing
    }
    if (!winnerEntry.item_name) {
      console.error(`Winner entry ${index} is missing item_name. Skipping entry:`, winnerEntry);
      return; // Skip this entry if critical data is missing
    }
    if (!winnerEntry.winner_nickname) {
      console.error(`Winner entry ${index} is missing winner_nickname. Skipping entry:`, winnerEntry);
      return; // Skip this entry if critical data is missing
    }
    if (!winnerEntry.assigned_date) {
      console.error(`Winner entry ${index} is missing assigned_date. Skipping entry:`, winnerEntry);
      return; // Skip this entry if critical data is missing
    }

    const row = document.createElement("tr");
    row.innerHTML = `
              <td>
                  <img src="${winnerEntry.item_img_url}" alt="${
      winnerEntry.item_name
    }" width="24" height="24" class="me-2">
                  ${winnerEntry.item_name}
              </td>
              <td>${winnerEntry.winner_nickname}</td>
              <td>${new Date(
                winnerEntry.assigned_date
              ).toLocaleDateString()}</td>
          `;
    winnersHistoryTableBody.appendChild(row);
    console.log(`Appended row for winner ${winnerEntry.winner_nickname}.`);
  });

  if (winnersHistoryTableBody.children.length === 0) {
    console.log("No rows were successfully appended after processing. Displaying 'No winners yet' message.");
    winnersHistoryTableBody.innerHTML =
      '<tr><td colspan="3" class="text-center text-muted">No hay ganadores registrados aún.</td></tr>';
  }
}

// Función para seleccionar un ganador aleatorio
async function pickRandomWinner(itemId) {
  console.log(`pickRandomWinner called for itemId: ${itemId}`);
  let item = items.find((i) => i.id === itemId); // Usar let para poder reasignar

  if (!item) {
    console.log(`Item with ID ${itemId} not found.`);
    return;
  }

  // 1. Re-verificar el estado del ítem directamente desde Supabase
  const { data: currentItemData, error: fetchItemError } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (fetchItemError) {
    console.error("Error fetching current item status:", fetchItemError.message);
    return;
  }

  // Si el ítem ya está asignado, cancelar el proceso
  if (currentItemData.status === "assigned") {
    console.log(`Item ${itemId} is already assigned. Cancelling winner selection.`);
    return;
  }

  // Actualizar el objeto item local con los datos más recientes
  item = currentItemData;

  // Fetch participants directly from Supabase for this item
  const { data: currentParticipants, error: participantsError } = await supabase
    .from('loot_queue')
    .select('*')
    .eq('item_id', itemId)
    .eq('status', 'Queued'); // Only consider 'Queued' participants

  if (participantsError) {
    console.error("Error fetching participants:", participantsError.message);
    return;
  }
  const participants = currentParticipants;
  console.log(`Participants for item ${itemId}:`, participants);

  try {
    if (participants.length > 0) {
      const winnerIndex = Math.floor(Math.random() * participants.length);
      const winnerEntry = participants[winnerIndex];
      console.log(`Selected winner for item ${itemId}:`, winnerEntry);

      // 2. Actualizar el ítem en la tabla 'items' con condición (Optimistic Locking)
      const { data: updatedItemData, error: itemUpdateError } = await supabase
        .from('items')
        .update({
          assigned_to_player_nickname: winnerEntry.player_nickname,
          status: "assigned",
        })
        .eq('id', item.id)
        .eq('status', 'closed') // Solo actualizar si el estado es 'closed'
        .is('assigned_to_player_nickname', null) // Y no está asignado
        .select(); // Request the updated data

      if (itemUpdateError) {
        console.error("Error updating item status:", itemUpdateError.message);
        return;
      }

      // If no rows were updated, it means another process already assigned the item.
      if (!updatedItemData || updatedItemData.length === 0) {
        console.log(`Item ${itemId} was already assigned by another process. Skipping further updates.`);
        return;
      }

      // Actualizar el objeto item local con los datos más recientes
      item.assigned_to_player_nickname = winnerEntry.player_nickname;
      item.status = "assigned";
      console.log(`Item ${itemId} status updated to assigned.`, item);

      // 3. Marcar al ganador como asignado en 'loot_queue'
      const { error: winnerQueueUpdateError } = await supabase
        .from('loot_queue')
        .update({ status: "Assigned" })
        .eq('id', winnerEntry.id);
      if (winnerQueueUpdateError) throw winnerQueueUpdateError;

      // Actualizar la entrada del ganador localmente
      const originalWinnerEntry = lootQueue.find(
        (entry) => entry.id === winnerEntry.id
      );
      if (originalWinnerEntry) {
        originalWinnerEntry.status = "Assigned";
      }
      console.log(`Winner entry ${winnerEntry.id} status updated to Assigned.`);

      // 4. Marcar a los demás participantes del mismo ítem como "Skipped" en 'loot_queue'
      const { error: skippedQueueUpdateError } = await supabase
        .from('loot_queue')
        .update({ status: "Skipped" })
        .eq('item_id', itemId)
        .eq('status', 'Queued')
        .neq('id', winnerEntry.id); // Excluir al ganador
      if (skippedQueueUpdateError) throw skippedQueueUpdateError;

      // Actualizar las entradas de los saltados localmente
      lootQueue.forEach((entry) => {
        if (
          entry.item_id === itemId &&
          entry.status === "Queued" &&
          entry.id !== winnerEntry.id
        ) {
          entry.status = "Skipped";
        }
      });
      console.log(`Loot queue after skipping others for item ${itemId}:`, lootQueue.filter(e => e.item_id === itemId));

      // 5. Añadir al historial de ganadores en 'winners_history'
      // Check if an entry for this item_id already exists in winners_history
      const { data: existingHistoryEntry, error: checkHistoryError } = await supabase
        .from('winners_history')
        .select('*')
        .eq('item_id', item.id)
        .single(); // Use single to expect 0 or 1 result

      if (checkHistoryError && checkHistoryError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error checking existing winner history:", checkHistoryError.message);
        // Don't proceed with inserting if there's an actual error
        return;
      }

      if (existingHistoryEntry) {
        console.log(`Race condition detected: Winner entry for item ${item.id} already exists. Skipping insertion.`);
        // If an entry already exists, it means another process already assigned it and recorded the winner.
        // We should not re-record it.
      } else {
        const newWinnerHistoryEntry = {
          item_id: item.id,
          item_name: item.name,
          item_img_url: item.img_url,
          winner_nickname: winnerEntry.player_nickname,
          assigned_date: new Date().toISOString(),
        };
        const { data: historyData, error: historyError } = await supabase
          .from('winners_history')
          .insert([newWinnerHistoryEntry])
          .select();
        if (historyError) throw historyError;

        // Añadir al historial localmente
        winnersHistory.push(historyData[0]);
        console.log(`New winner history entry added:`, historyData[0]);
      }

      alert(`¡${winnerEntry.player_nickname} ha ganado "${item.name}"!`);
    } else {
      // Si no hay participantes, el ítem queda sin reclamar
      const { error: unclaimedItemUpdateError } = await supabase
        .from('items')
        .update({ status: "unclaimed" })
        .eq('id', item.id)
        .eq('status', 'closed') // Solo actualizar si el estado es 'closed'
        .is('assigned_to_player_nickname', null); // Y no está asignado

      if (unclaimedItemUpdateError) {
        console.error("Error updating item status to unclaimed (might be already assigned):", unclaimedItemUpdateError.message);
        return;
      }

      // Actualizar el ítem localmente
      item.status = "unclaimed";
      console.log(`Item ${itemId} status updated to unclaimed.`);

      alert(`"${item.name}" ha finalizado sin participantes.`);
    }

    // Delete all loot_queue entries for this item_id
    const { error: deleteQueueEntriesError } = await supabase
      .from('loot_queue')
      .delete()
      .eq('item_id', item.id);

    if (deleteQueueEntriesError) {
      console.error("Error deleting loot queue entries for item:", deleteQueueEntriesError.message);
    } else {
      // Update local lootQueue array to reflect deletion
      lootQueue = lootQueue.filter(entry => entry.item_id !== item.id);
      console.log(`Deleted loot queue entries for item ${item.id}.`);
    }

    // Re-renderizar la UI después de todas las operaciones de DB (Manejado por Realtime)
    // renderAdminItems();
    // renderLootQueue();
    // renderAvailableItems();
    // renderWinnersHistory();
  } catch (error) {
    console.error("Error al seleccionar ganador:", error.message);
    alert("Error al seleccionar ganador: " + error.message);
  }
}

// Intervalo para verificar el estado de los ítems y seleccionar ganadores


// --- Supabase Realtime Subscriptions ---
function setupRealtimeSubscriptions() {
  // Subscribe to 'items' table changes
  supabase
    .channel('items_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, payload => {
      console.log('Item change received!', payload);
      if (payload.eventType === 'INSERT') {
        items.push(payload.new);
      } else if (payload.eventType === 'UPDATE') {
        const index = items.findIndex(item => item.id === payload.old.id);
        if (index !== -1) {
          items[index] = payload.new;
        }
      } else if (payload.eventType === 'DELETE') {
        items = items.filter(item => item.id !== payload.old.id);
      }
      if (isAdminPage) renderAdminItems();
      if (isUserPage) renderAvailableItems();
    })
    .subscribe();

  // Subscribe to 'loot_queue' table changes
  supabase
    .channel('loot_queue_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'loot_queue' }, payload => {
      console.log('Loot Queue change received!', payload);
      if (payload.eventType === 'INSERT') {
        lootQueue.push(payload.new);
      } else if (payload.eventType === 'UPDATE') {
        const index = lootQueue.findIndex(entry => entry.id === payload.old.id);
        if (index !== -1) {
          lootQueue[index] = payload.new;
        }
      } else if (payload.eventType === 'DELETE') {
        lootQueue = lootQueue.filter(entry => entry.id !== payload.old.id);
      }
      renderLootQueue();
    })
    .subscribe();

  // Subscribe to 'winners_history' table changes
  supabase
    .channel('winners_history_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'winners_history' }, payload => {
      console.log('Winners History change received!', payload);
      if (payload.eventType === 'INSERT') {
        winnersHistory.push(payload.new);
      } else if (payload.eventType === 'UPDATE') {
        const index = winnersHistory.findIndex(entry => entry.id === payload.old.id);
        if (index !== -1) {
          winnersHistory[index] = payload.new;
        }
      } else if (payload.eventType === 'DELETE') {
        winnersHistory = winnersHistory.filter(entry => entry.id !== payload.old.id);
      }
      renderWinnersHistory();
    })
    .subscribe();
}

// --- Control de Interfaz y Logins ---

function updateUIForPage() {
  if (isHistoryPage) {
    if (historyPanel) historyPanel.style.display = "block";
    if (loginPanel) loginPanel.style.display = "none";
    if (userPanel) userPanel.style.display = "none";
    if (adminPanel) adminPanel.style.display = "none";
    renderWinnersHistory();

    if (currentUser) {
      if (currentUserDisplay)
        currentUserDisplay.textContent = `Bienvenido, ${currentUser}`;
      if (logoutBtn) logoutBtn.style.display = "block";
      if (loginBtn) loginBtn.style.display = "none";
    } else {
      if (currentUserDisplay) currentUserDisplay.textContent = "";
      if (logoutBtn) logoutBtn.style.display = "none";
      if (loginBtn) loginBtn.style.display = "block";
    }
    return;
  }

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
    if (loginPanel) loginPanel.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "block";
    if (currentUserDisplay) currentUserDisplay.textContent = "";

    if (userPanel) userPanel.style.display = "none";
    if (adminPanel) adminPanel.style.display = "none";
  }

  if (isAdminPage && currentUser === "admin") {
    renderPredefinedItems();
    renderAdminItems();
    renderLootQueue();
  } else if (isUserPage) {
    renderAvailableItems();
    renderLootQueue();
  }
}

async function loginUser(nick) {
  try {
    if (isAdminPage) {
      // Lógica de autenticación para el administrador
      const adminUsername = adminUsernameInput ? adminUsernameInput.value.trim() : '';
      const adminPassword = adminNicknameInput ? adminNicknameInput.value.trim() : '';

      console.log("Attempting admin login with:", { username: adminUsername, password: adminPassword });

      // Usar las variables globales de config.js
      if (adminUsername === ADMIN_USERNAME && adminPassword === ADMIN_NICKNAME) {
        currentUser = "admin"; // Set currentUser to "admin" for UI logic
        localStorage.setItem("currentUser", "admin");
        updateUIForPage();
      } else {
        alert("Credenciales incorrectas.");
      }
    } else if (isUserPage) {
      // Lógica de autenticación para usuarios normales (verificando existencia en Supabase)
      const { data, error } = await supabase
        .from('players')
        .select('nickname')
        .eq('nickname', nick);

      if (error) throw error;

      if (data && data.length > 0) {
        currentUser = nick;
        localStorage.setItem("currentUser", nick);
        updateUIForPage();
      } else {
        alert("Nickname no registrado. Por favor, contacta a un administrador.");
      }
    }
  } catch (error) {
    console.error("Error logging in user:", error.message);
    alert("Error al iniciar sesión: " + error.message);
  }
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  if (isAdminPage) {
    window.location.href = "admin.html";
  }
  else if (isHistoryPage) {
    window.location.reload();
  } else {
    window.location.href = "index.html";
  }
}

// --- Event Listeners Globales o Condicionales ---

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    if (isHistoryPage) {
      window.location.reload();
    } else if (currentUser) {
      logoutUser();
    }
    else {
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
    submitNicknameBtn.addEventListener("click", async () => {
      const nick = nicknameInput.value.trim();
      if (nick && nick.toLowerCase() !== "admin") {
        await loginUser(nick);
      } else if (nick.toLowerCase() === "admin") {
        alert("Este nickname no está disponible.");
      } else {
        alert("Por favor, ingresa tu nick.");
      }
    });
  }

  if (availableItemsList) {
    availableItemsList.addEventListener("click", async (e) => {
      if (e.target.classList.contains("participate-btn")) {
        if (!currentUser || currentUser.toLowerCase() === "admin") {
                    alert("Por favor, loguéate como jugador para participar.");
          return;
        }

        const itemId = e.target.dataset.itemId;
        const item = items.find((i) => i.id === itemId);

        if (item) {
          const alreadyQueuedForThisSpecificItem = lootQueue.some(
            (entry) =>
              entry.player_nickname === currentUser &&
              entry.item_id === item.id &&
              entry.status === "Queued"
          );

          if (alreadyQueuedForThisSpecificItem) {
            alert(
              `Ya estás en cola para "${item.name}". No puedes unirte dos veces al mismo ítem.`
            );
            return;
          }

          if (item.status !== "active" || new Date(item.end_time) <= Date.now()) {
            alert(`"${item.name}" ya no está disponible para participar.`);
            return;
          }

          const newQueueEntry = {
            player_nickname: currentUser,
            item_id: item.id,
            queue_date: new Date().toISOString(),
            status: "Queued",
          };

          const { data, error } = await supabase.from('loot_queue').insert([newQueueEntry]).select();

          if (error) {
            console.error("Error al unirse a la cola:", error.message);
                        alert("Error al unirse a la cola: " + error.message);
            return;
          }

          lootQueue.push(data[0]);
          renderLootQueue();
          renderAvailableItems();
          alert(`Te has unido a la cola para "${item.name}".`);
        }
      }
    });
  }

  if (lootQueueTableBody) {
    lootQueueTableBody.addEventListener("click", async (e) => {
      if (e.target.classList.contains("withdraw-btn")) {
        const index = e.target.dataset.index;
        const entry = lootQueue[index];
        if (!entry) return;

        if (currentUser === entry.player_nickname && entry.status === "Queued") {
          if (
            confirm(
              "¿Estás seguro de que quieres retirarte de la cola para este ítem?"
            )
          ) {
            const { error } = await supabase
              .from('loot_queue')
              .delete()
              .eq('id', entry.id);

            if (error) {
              console.error("Error al retirarse de la cola:", error.message);
              alert("Error al retirarse de la cola: " + error.message);
              return;
            }

            lootQueue.splice(index, 1);
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
    submitAdminNicknameBtn.addEventListener("click", async () => {
      const username = adminUsernameInput.value.trim();
      await loginUser(username); // Pass the username to loginUser
    });
  }

  if (predefinedItemsList) {
    predefinedItemsList.addEventListener("click", async (e) => {
      if (e.target.classList.contains("list-predefined-item-btn")) {
        const baseId = e.target.dataset.baseId;
        const predefinedItem = predefinedItems.find(
          (item) => item.baseId === baseId
        );
        const customNameInput = e.target.previousElementSibling;
        const customName = customNameInput.value.trim();

        if (predefinedItem) {
          const newItem = {
            base_id: predefinedItem.baseId,
            name: customName
              ? `${predefinedItem.name} (${customName})`
              : predefinedItem.name,
            description: predefinedItem.description,
            img_url: predefinedItem.img,
            end_time: new Date(Date.now() + 6 * 60 * 1000).toISOString(),
            status: "active",
            assigned_to_player_nickname: null,
          };

          const { data, error } = await supabase.from('items').insert([newItem]).select();

          if (error) {
            console.error("Error al listar ítem predefinido:", error.message);
            alert("Error al listar ítem: " + error.message);
            return;
          }

          items.push(data[0]);
          customNameInput.value = "";
          renderAdminItems();
          renderAvailableItems();
          alert(`"${data[0].name}" ha sido listado por 10 minutos.`);
        }
      }
    });
  }

  if (adminItemList) {
    adminItemList.addEventListener("click", async (e) => {
      if (e.target.dataset.action === "pick-winner") {
        const index = e.target.dataset.index;
        const item = items[index];
        if (item && item.status === "closed") {
          await pickRandomWinner(item.id); // Await the pickRandomWinner call
        } else {
          alert(
            "Solo puedes elegir ganador para ítems cerrados y no asignados."
          );
        }
      } else if (e.target.dataset.action === "delete-item") {
        const index = e.target.dataset.index;
        const itemToDelete = items[index];
        if (!itemToDelete) return;

        if (
          confirm(
            "¿Estás seguro de que quieres eliminar este ítem? Esto también eliminará sus participantes de la cola."
          )
        ) {
          try {
            const { error: deleteQueueError } = await supabase
              .from('loot_queue')
              .delete()
              .eq('item_id', itemToDelete.id);

            if (deleteQueueError) throw deleteQueueError;

            const { error: deleteItemError } = await supabase
              .from('items')
              .delete()
              .eq('id', itemToDelete.id);

            if (deleteItemError) throw deleteItemError;

            items.splice(index, 1);
            lootQueue = lootQueue.filter(
              (entry) => entry.item_id !== itemToDelete.id
            );

            renderAdminItems();
            renderLootQueue();
            renderAvailableItems();
            alert("Ítem y sus entradas de cola eliminados.");
          } catch (error) {
            console.error("Error al eliminar ítem:", error.message);
            alert("Error al eliminar ítem: " + error.message);
          }
        }
      }
    });
  }

  if (addItemBtn) {
    addItemBtn.addEventListener("click", async () => {
      const name = itemNameInput.value.trim();
      const description = itemDescriptionInput.value.trim();
      if (name) {
        const newItem = {
          name: name,
          description: description,
          img_url: "img/trash.png",
          end_time: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          status: "active",
          assigned_to_player_nickname: null,
        };

        const { data, error } = await supabase.from('items').insert([newItem]).select();

        if (error) {
          console.error("Error al añadir ítem personalizado:", error.message);
                    alert("Error al añadir ítem: " + error.message);
          return;
        }

        items.push(data[0]);
        itemNameInput.value = "";
        itemDescriptionInput.value = "";
        renderAdminItems();
        renderAvailableItems();
        alert(`"${data[0].name}" ha sido listado por 10 minutes.`);
      }
    });
  }

  if (lootQueueTableBody) {
    lootQueueTableBody.addEventListener("click", async (e) => {
      if (e.target.tagName === "BUTTON") {
        const index = e.target.dataset.index;
        const entry = lootQueue[index];

        if (!entry) return;

        const action = e.target.dataset.action;

        try {
          if (action === "assign") {
            const itemToAssign = items.find((item) => item.id === entry.item_id);
            if (
              itemToAssign &&
              itemToAssign.status === "closed" &&
              !itemToAssign.assigned_to_player_nickname
            ) {
              const { error: updateQueueError } = await supabase
                .from('loot_queue')
                .update({ status: "Assigned" })
                .eq('id', entry.id);
              if (updateQueueError) throw updateQueueError;

              entry.status = "Assigned";

              const { error: updateItemError } = await supabase
                .from('items')
                .update({
                  assigned_to_player_nickname: entry.player_nickname,
                  status: "assigned",
                })
                .eq('id', itemToAssign.id);
              if (updateItemError) throw updateItemError;

              itemToAssign.assigned_to_player_nickname = entry.player_nickname;
              itemToAssign.status = "assigned";

              const alreadyInHistory = winnersHistory.some(
                (histEntry) =>
                  histEntry.item_id === itemToAssign.id &&
                  histEntry.winner_nickname === entry.player_nickname
              );
              if (!alreadyInHistory) {
                const { data: historyData, error: historyInsertError } = await supabase
                  .from('winners_history')
                  .insert({
                    item_id: itemToAssign.id,
                    item_name: itemToAssign.name,
                    item_img_url: itemToAssign.img_url,
                    winner_nickname: entry.player_nickname,
                    assigned_date: new Date().toISOString(),
                  })
                  .select();
                if (historyInsertError) throw historyInsertError;
                winnersHistory.push(historyData[0]);
              }

              const { error: skipOthersError } = await supabase
                .from('loot_queue')
                .update({ status: "Skipped" })
                .eq('item_id', itemToAssign.id)
                .eq('status', 'Queued')
                .neq('id', entry.id);
              if (skipOthersError) throw skipOthersError;

              lootQueue.forEach((otherEntry) => {
                if (
                  otherEntry.item_id === itemToAssign.id &&
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
              const { error: skipError } = await supabase
                .from('loot_queue')
                .update({ status: "Skipped" })
                .eq('id', entry.id);
              if (skipError) throw skipError;

              entry.status = "Skipped";
              alert(`"${entry.player_nickname}" ha sido saltado para este ítem.`);
            } else {
              alert('Este jugador no está en estado "En Cola".');
            }
          }
          else if (action === "remove") {
            if (
              confirm(
                "¿Estás seguro de que quieres eliminar a este jugador de la cola?"
              )
            ) {
              if (entry.status === "Assigned") {
                const assignedItem = items.find(
                  (item) => item.id === entry.item_id
                );
                if (
                  assignedItem &&
                  assignedItem.assigned_to_player_nickname === entry.player_nickname
                ) {
                  const { error: revertItemError } = await supabase
                    .from('items')
                    .update({
                      assigned_to_player_nickname: null,
                      status: "closed",
                    })
                    .eq('id', assignedItem.id);
                  if (revertItemError) throw revertItemError;

                  assignedItem.assigned_to_player_nickname = null;
                  assignedItem.status = "closed";
                }
              }

              const { error: deleteEntryError } = await supabase
                .from('loot_queue')
                .delete()
                .eq('id', entry.id);
              if (deleteEntryError) throw deleteEntryError;

              lootQueue.splice(index, 1);
              alert(`"${entry.player_nickname}" ha sido eliminado de la cola.`);
            }
          }

          renderLootQueue();
          renderAdminItems();
          renderAvailableItems();
          renderWinnersHistory();
        } catch (error) {
          console.error("Error in admin action:", error.message);
          alert("Error in admin action: " + error.message);
        }
      }
    });
  }
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
  await fetchDataFromSupabase();

  const storedUser = localStorage.getItem("currentUser");
  if (isHistoryPage) {
    currentUser = null;
    localStorage.removeItem("currentUser");
  } else if (storedUser) {
    currentUser = storedUser;
  }
  updateUIForPage();

  // Setup Realtime Subscriptions
  setupRealtimeSubscriptions();

  // Clean up historical loot queue entries on admin page load
  if (isAdminPage) {
    await cleanUpHistoricalLootQueueEntries();
  }
});

// New function to clean up historical loot_queue entries
async function cleanUpHistoricalLootQueueEntries() {
  console.log("Cleaning up historical loot queue entries...");
  try {
    // Get all items that are in a final state (assigned or unclaimed)
    const { data: finalItems, error: finalItemsError } = await supabase
      .from('items')
      .select('id')
      .in('status', ['assigned', 'unclaimed']);

    if (finalItemsError) throw finalItemsError;

    if (finalItems.length > 0) {
      const finalItemIds = finalItems.map(item => item.id);

      // Delete loot_queue entries associated with these final items
      const { error: deleteError } = await supabase
        .from('loot_queue')
        .delete()
        .in('item_id', finalItemIds);

      if (deleteError) throw deleteError;

      // Update local lootQueue array
      lootQueue = lootQueue.filter(entry => !finalItemIds.includes(entry.item_id));
      console.log(`Cleaned up ${finalItemIds.length} historical loot queue entries.`);
    } else {
      console.log("No historical loot queue entries to clean up.");
    }
  } catch (error) {
    console.error("Error cleaning up historical loot queue entries:", error.message);
  }
}