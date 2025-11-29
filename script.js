// Task management functionality
document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const activeTasksContainer = document.getElementById("active-tasks");
  const completedTasksContainer = document.getElementById("completed-tasks");
  const completedCountElement = document.getElementById("completed-count");
  const emptyStateElement = document.getElementById("empty-state");
  const addButton = document.getElementById("add-task-btn");
  const taskModal = document.getElementById("task-modal");
  const taskForm = document.getElementById("task-form");
  const cancelButton = document.getElementById("cancel-btn");
  const modalTitle = document.getElementById("modal-title");
  const calendarDaysContainer = document.getElementById("calendar-days");
  const topDateElement = document.querySelector(".top-date");
  const calendarModalBtn = document.getElementById("calendar-modal-btn");
  const calendarModal = document.getElementById("calendar-modal");
  const calendarGrid = document.getElementById("calendar-grid");
  const calendarMonthElement = document.getElementById("calendar-month");
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-year");
  const prevYearBtn = document.getElementById("prev-year");
  const nextYearBtn = document.getElementById("next-year");
  const priorityOptions = document.querySelectorAll(".priority-option");
  const calendarDays = document.getElementById("calendar-days");
  const themeToggle = document.getElementById("theme-toggle");

  // State variables
  let tasks = []; // Start with empty array - no localStorage
  let currentEditingTaskId = null;
  let selectedDate = new Date();
  let selectedPriority = 2;
  let calendarViewDate = new Date();

  // ==================== API CONFIGURATION ====================
  const API_BASE_URL = "https://x8ki-letl-twmt.n7.xano.io/api:ksKp7BtD";

  // == MODAL CLOSE FUNCTIONALITY ====================

  function setupModalCloseListeners() {
    // Close modals on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAllModals();
      }
    });

    // Close modals when clicking outside
    document.addEventListener("click", (e) => {
      // Close task modal when clicking outside
      if (taskModal && taskModal.style.display === "flex") {
        if (e.target === taskModal) {
          closeTaskModal();
        }
      }

      // Close calendar modal when clicking outside
      if (calendarModal && calendarModal.style.display === "flex") {
        if (e.target === calendarModal) {
          closeCalendarModal();
        }
      }
    });
  }

  function closeAllModals() {
    closeTaskModal();
    closeCalendarModal();
  }

  function closeCalendarModal() {
    if (calendarModal) calendarModal.style.display = "none";
  }
  // == END MODAL CLOSE FUNCTIONALITY ==

  // == API SERVICE FUNCTIONS ==
  // == SIMPLIFIED DATA TRANSFORMATION ==

  async function loadTasksFromAPI() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/todo`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const tasksData = await response.json();
        console.log("Raw tasks from Xano:", tasksData);

        // SIMPLE TRANSFORMATION - only what's absolutely necessary
        tasks = tasksData.map((task) => ({
          // Keep all original fields
          ...task,
          // Only transform the essential ones
          completed: task.is_complete,
          date: new Date(task.created_at),
          time: task.time ? timestampToTimeString(task.time) : "",
        }));

        console.log("Transformed tasks:", tasks);
        renderTasks();
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  }

  // Convert timestamp to "HH:MM" format
  function timestampToTimeString(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  // Convert "HH:MM" string to timestamp (for saving)
  function timeStringToTimestamp(timeString, baseDate) {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(":");
    const date = new Date(baseDate);
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date.getTime();
  }

  async function saveTaskToAPI(task) {
    try {
      const token = localStorage.getItem("token");

      // Prepare data for Xano - only transform what's necessary
      const xanoTask = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        // Xano will set created_at automatically for new tasks
        time: task.time ? timeStringToTimestamp(task.time, task.date) : null,
      };

      console.log("Sending to Xano:", xanoTask);

      const response = await fetch(`${API_BASE_URL}/todo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(xanoTask),
      });

      const savedTask = await response.json();

      // Transform the response back
      return {
        ...savedTask,
        date: new Date(savedTask.created_at),
        time: savedTask.time ? timestampToTimeString(savedTask.time) : "",
      };
    } catch (error) {
      console.error("Failed to save task:", error);
      throw error;
    }
  }

  async function updateTaskInAPI(taskId, updates) {
    try {
      const token = localStorage.getItem("token");

      // Only include fields that are being updated
      const xanoUpdates = {};
      if (updates.title !== undefined) xanoUpdates.title = updates.title;
      if (updates.description !== undefined)
        xanoUpdates.description = updates.description;
      if (updates.priority !== undefined)
        xanoUpdates.priority = updates.priority;
      if (updates.time !== undefined) {
        xanoUpdates.time = updates.time
          ? timeStringToTimestamp(updates.time, updates.date || new Date())
          : null;
      }

      const response = await fetch(`${API_BASE_URL}/todo/${taskId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(xanoUpdates),
      });

      const updatedTask = await response.json();

      return {
        ...updatedTask,
        completed: updatedTask.is_complete,
        date: new Date(updatedTask.created_at),
        time: updatedTask.time ? timestampToTimeString(updatedTask.time) : "",
      };
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error;
    }
  }

  async function deleteTaskFromAPI(taskId) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/todo/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw error;
    }
  }
  // ==================== END API SERVICE FUNCTIONS ====================

  // Initialize the app
  initApp();

  function initApp() {
    console.log("Initializing app...");

    // Check if user is logged in
    if (!localStorage.getItem("token")) {
      window.location.href = "login.html";
      return;
    }

    setupModalCloseListeners();

    // Set up event listeners
    if (addButton) addButton.addEventListener("click", openAddTaskModal);
    if (cancelButton) cancelButton.addEventListener("click", closeTaskModal);
    if (taskForm) taskForm.addEventListener("submit", handleTaskFormSubmit);
    if (calendarModalBtn)
      calendarModalBtn.addEventListener("click", openCalendarModal);
    if (prevMonthBtn)
      prevMonthBtn.addEventListener("click", () => changeCalendarMonth(-1));
    if (nextMonthBtn)
      nextMonthBtn.addEventListener("click", () => changeCalendarMonth(1));
    if (prevYearBtn)
      prevYearBtn.addEventListener("click", () => changeCalendarYear(-1));
    if (nextYearBtn)
      nextYearBtn.addEventListener("click", () => changeCalendarYear(1));

    // Priority selector
    priorityOptions.forEach((option) => {
      option.addEventListener("click", () => {
        priorityOptions.forEach((opt) => opt.classList.remove("selected"));
        option.classList.add("selected");
        selectedPriority = parseInt(option.getAttribute("data-priority"));
      });
    });

    // Theme toggle
    if (themeToggle) {
      themeToggle.addEventListener("click", toggleTheme);
    }

    // Generate calendar
    generateMonthCalendar();
    if (calendarDays) enableHorizontalScroll(calendarDays);

    // Update date display
    updateDateDisplay();

    // Load tasks from API instead of localStorage
    loadTasksFromAPI();

    // Initialize theme
    initTheme();
  }

  function initTheme() {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    console.log("Theme changed to:", newTheme);
  }

  function generateMonthCalendar() {
    if (!calendarDaysContainer) return;

    calendarDaysContainer.innerHTML = "";

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDay.getDay();
    const adjustedFirstDayOfWeek =
      firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month - 1, prevMonthLastDay - i);
      const dayElement = createDayElement(day, true);
      calendarDaysContainer.appendChild(dayElement);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i);
      const dayElement = createDayElement(day, false);
      calendarDaysContainer.appendChild(dayElement);
    }

    const totalCells = 42;
    const daysSoFar = adjustedFirstDayOfWeek + lastDay.getDate();
    const daysToAdd = totalCells - daysSoFar;

    for (let i = 1; i <= daysToAdd; i++) {
      const day = new Date(year, month + 1, i);
      const dayElement = createDayElement(day, true);
      calendarDaysContainer.appendChild(dayElement);
    }

    scrollToCurrentDate();
  }

  function createDayElement(date, isOtherMonth) {
    const dayElement = document.createElement("div");
    dayElement.className = "day";
    if (isOtherMonth) dayElement.classList.add("other-month");
    if (isSameDay(date, selectedDate)) dayElement.classList.add("selected");

    dayElement.innerHTML = `
        <span class="day-name">${getDayName(date)}</span>
        <span class="day-number">${date.getDate()}</span>
      `;

    dayElement.addEventListener("click", () => {
      selectedDate = date;
      updateDateDisplay();
      generateMonthCalendar();
      renderTasks();
    });

    return dayElement;
  }

  function updateDateDisplay() {
    if (!topDateElement) return;
    const options = { weekday: "long", month: "short", day: "numeric" };
    topDateElement.textContent = selectedDate.toLocaleDateString(
      "en-US",
      options
    );
  }

  function getDayName(date) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  function isSameDay(date1, date2) {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }

  function openAddTaskModal() {
    console.log("Opening add task modal");
    if (!modalTitle || !taskModal) return;

    modalTitle.textContent = "Add New Task";
    if (taskForm) taskForm.reset();
    currentEditingTaskId = null;
    selectedPriority = 2;

    priorityOptions.forEach((opt) => opt.classList.remove("selected"));
    const defaultPriority = document.querySelector(
      '.priority-option[data-priority="2"]'
    );
    if (defaultPriority) defaultPriority.classList.add("selected");

    taskModal.style.display = "flex";
  }

  function openEditTaskModal(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !modalTitle || !taskModal) return;

    modalTitle.textContent = "Edit Task";
    document.getElementById("task-title").value = task.title;
    document.getElementById("task-description").value = task.description || "";
    document.getElementById("task-time").value = task.time || "";
    currentEditingTaskId = taskId;
    selectedPriority = task.priority || 2;

    priorityOptions.forEach((opt) => opt.classList.remove("selected"));
    const priorityElement = document.querySelector(
      `.priority-option[data-priority="${selectedPriority}"]`
    );
    if (priorityElement) priorityElement.classList.add("selected");

    taskModal.style.display = "flex";
  }

  function closeTaskModal() {
    if (taskModal) taskModal.style.display = "none";
  }

  async function handleTaskFormSubmit(e) {
    e.preventDefault();
    console.log("Form submitted!");

    const titleInput = document.getElementById("task-title");
    const descriptionInput = document.getElementById("task-description");
    const timeInput = document.getElementById("task-time");

    if (!titleInput) return;

    const title = titleInput.value.trim();
    const description = descriptionInput ? descriptionInput.value : "";
    const time = timeInput ? timeInput.value : "";

    if (!title) {
      alert("Please enter a task title");
      return;
    }

    const taskData = {
      title: title,
      description: description,
      time: time,
      priority: selectedPriority,
      completed: false,
      date: new Date(selectedDate),
    };

    try {
      if (currentEditingTaskId) {
        // Update existing task via API
        console.log("Updating task:", currentEditingTaskId);
        const updatedTask = await updateTaskInAPI(
          currentEditingTaskId,
          taskData
        );

        // Update local tasks array
        const taskIndex = tasks.findIndex((t) => t.id === currentEditingTaskId);
        if (taskIndex !== -1) {
          tasks[taskIndex] = updatedTask;
        }
      } else {
        // Create new task via API
        console.log("Creating new task");
        const newTask = await saveTaskToAPI(taskData);

        // Add to local tasks array
        tasks.push(newTask);
      }

      renderTasks();
      closeTaskModal();
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Failed to save task. Please try again.");
    }
  }

  function openCalendarModal() {
    if (!calendarModal) return;
    calendarViewDate = new Date(selectedDate);
    generateCalendarModal();
    calendarModal.style.display = "flex";
  }

  function generateCalendarModal() {
    if (!calendarGrid || !calendarMonthElement) return;

    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    calendarMonthElement.textContent = `${monthNames[month]} ${year}`;

    calendarGrid.innerHTML = "";

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    weekdays.forEach((day) => {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-weekday";
      dayElement.textContent = day;
      calendarGrid.appendChild(dayElement);
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month - 1, prevMonthLastDay - i);
      const dayElement = createCalendarDayElement(day, true);
      calendarGrid.appendChild(dayElement);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i);
      const dayElement = createCalendarDayElement(day, false);
      calendarGrid.appendChild(dayElement);
    }

    const totalCells = 42;
    const daysSoFar = firstDayOfWeek + lastDay.getDate();
    const daysToAdd = totalCells - daysSoFar;

    for (let i = 1; i <= daysToAdd; i++) {
      const day = new Date(year, month + 1, i);
      const dayElement = createCalendarDayElement(day, true);
      calendarGrid.appendChild(dayElement);
    }
  }

  function createCalendarDayElement(date, isOtherMonth) {
    const dayElement = document.createElement("div");
    dayElement.className = "calendar-day";
    if (isOtherMonth) dayElement.classList.add("other-month");
    if (isSameDay(date, selectedDate)) dayElement.classList.add("selected");
    if (isSameDay(date, new Date())) dayElement.classList.add("today");

    dayElement.textContent = date.getDate();

    dayElement.addEventListener("click", () => {
      selectedDate = date;
      updateDateDisplay();
      generateMonthCalendar();
      renderTasks();
      closeCalendarModal();
    });

    return dayElement;
  }

  function changeCalendarMonth(direction) {
    calendarViewDate.setMonth(calendarViewDate.getMonth() + direction);
    generateCalendarModal();
  }

  function changeCalendarYear(direction) {
    calendarViewDate.setFullYear(calendarViewDate.getFullYear() + direction);
    generateCalendarModal();
  }

  async function toggleTaskCompletion(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      try {
        const updatedCompleted = !task.completed;

        // Update in API first
        await updateTaskInAPI(taskId, {
          completed: updatedCompleted,
        });

        // Then update local state
        task.completed = updatedCompleted;
        renderTasks();
      } catch (error) {
        console.error("Failed to update todo:", error);
        alert("Failed to update task. Please try again.");
      }
    }
  }

  async function deleteTask(taskId) {
    // Adding confirmation dialog
    const task = tasks.find((t) => t.id === taskId);
    const confirmed = confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) return;

    try {
      await deleteTaskFromAPI(taskId);
      tasks = tasks.filter((t) => t.id !== taskId);
      renderTasks();
    } catch (error) {
      console.error("Failed to delete todo:", error);
      alert("Failed to delete task. Please try again.");
    }
  }

  function renderTasks() {
    if (
      !activeTasksContainer ||
      !completedTasksContainer ||
      !completedCountElement ||
      !emptyStateElement
    )
      return;

    activeTasksContainer.innerHTML = "";
    completedTasksContainer.innerHTML = "";

    const tasksForSelectedDate = tasks.filter((task) =>
      isSameDay(new Date(task.date), selectedDate)
    );

    const activeTasks = tasksForSelectedDate.filter((task) => !task.completed);
    const completedTasks = tasksForSelectedDate.filter(
      (task) => task.completed
    );

    completedCountElement.textContent = completedTasks.length;

    if (tasksForSelectedDate.length === 0) {
      emptyStateElement.style.display = "flex";
    } else {
      emptyStateElement.style.display = "none";
    }

    activeTasks.forEach((task) => {
      const taskElement = createTaskElement(task);
      activeTasksContainer.appendChild(taskElement);
    });

    completedTasks.forEach((task) => {
      const taskElement = createTaskElement(task);
      completedTasksContainer.appendChild(taskElement);
    });
  }

  function createTaskElement(task) {
    const taskElement = document.createElement("div");
    taskElement.className = `task-card priority-${task.priority || 2}`;
    if (task.completed) taskElement.classList.add("completed");

    taskElement.innerHTML = `
        <input type="checkbox" id="todo-${task.id}" class="task-checkbox" ${
      task.completed ? "checked" : ""
    }>
        <label class="custom-checkbox" for="todo-${task.id}">
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="transparent">
            <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
          </svg>
        </label>
        <div class="todo-list">
          <label for="todo-${task.id}" class="todo-text">${task.title}</label>
          ${
            task.description
              ? `<p class="task-description">${task.description}</p>`
              : ""
          }
          ${
            task.time
              ? `<span class="task-time">${formatTime(task.time)}</span>`
              : ""
          }
        </div>
        <button class="delete-btn" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="#fff">
            <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
          </svg>
        </button>
      `;

    const checkbox = taskElement.querySelector(".task-checkbox");
    checkbox.addEventListener("change", () => toggleTaskCompletion(task.id));

    const deleteBtn = taskElement.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    if (!task.completed) {
      taskElement.addEventListener("dblclick", () =>
        openEditTaskModal(task.id)
      );
      taskElement.style.cursor = "pointer";
      taskElement.title = "Double-click to edit";
    } else {
      taskElement.style.cursor = "default";
    }

    return taskElement;
  }

  function formatTime(timeString) {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
});

function enableHorizontalScroll(element) {
  element.addEventListener("wheel", (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      element.scrollLeft += e.deltaY;
    }
  });
}

function scrollToCurrentDate() {
  const calendarDays = document.getElementById("calendar-days");
  if (!calendarDays) return;

  const today = new Date();
  const days = calendarDays.querySelectorAll(".day");

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const dayNumber = parseInt(day.querySelector(".day-number").textContent);
    const isOtherMonth = day.classList.contains("other-month");

    // Check if this is today's date and not from another month
    if (dayNumber === today.getDate() && !isOtherMonth) {
      // Simple scroll to position
      calendarDays.scrollLeft =
        day.offsetLeft - calendarDays.offsetWidth / 2 + day.offsetWidth / 2;
      break;
    }
  }
}
