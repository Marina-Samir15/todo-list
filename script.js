document.addEventListener('DOMContentLoaded', () => {
            const pages = document.querySelectorAll('.page');
            const navItems = document.querySelectorAll('.nav-item');

            const taskInput = document.getElementById('task-input');
            const taskDetails = document.getElementById('task-details');
            const prioritySelect = document.getElementById('priority-select');
            const dueDateInput = document.getElementById('due-date-input');
            const tagSelect = document.getElementById('tag-select');
            const addTaskForm = document.getElementById('add-task-form');

            const tasksListContainer = document.getElementById('tasks-list');
            const todayTasksListContainer = document.getElementById('today-tasks-list');

            const filterBtns = document.querySelectorAll('.filter-btn');

            const totalTasksCount = document.getElementById('total-tasks-count');
            const completedTasksCount = document.getElementById('completed-tasks-count');
            const pendingTasksCount = document.getElementById('pending-tasks-count');

            // Notification Elements
            const notificationBell = document.querySelector('.notification-bell');
            const notificationCenter = document.getElementById('notification-center');
            const notificationList = document.getElementById('notification-list');
            const toastContainer = document.getElementById('toast-notification-container');

            // Edit Modal Elements
            const editModal = document.getElementById('edit-modal');
            const editForm = document.getElementById('edit-task-form');
            const editTaskId = document.getElementById('edit-task-id');
            const editTaskTitle = document.getElementById('edit-task-title');
            const editTaskDetails = document.getElementById('edit-task-details');
            const editPrioritySelect = document.getElementById('edit-priority-select');
            const editDueDateInput = document.getElementById('edit-due-date-input');
            const editTagSelect = document.getElementById('edit-tag-select');
            const closeEditModalBtn = editModal.querySelector('.close-btn');

            // Delete Modal Elements
            const deleteModal = document.getElementById('delete-modal');
            const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
            const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
            const closeDeleteModalBtn = deleteModal.querySelector('.close-btn');
            let taskIdToDelete = null;

            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
            let currentFilter = 'all';
            let notificationCenterVisible = false;

            function showPage(pageId) {
                pages.forEach(page => page.classList.remove('active'));
                document.getElementById(pageId).classList.add('active');
                navItems.forEach(item => item.classList.remove('active'));
                const navItem = document.querySelector(`.nav-item[data-page="${pageId.replace('-page', '')}"]`);
                if (navItem) {
                    navItem.classList.add('active');
                }
            }

            navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = item.dataset.page;
                    showPage(`${page}-page`);
                    if (page === 'all-tasks') {
                        renderTasks(tasksListContainer);
                    }
                });
            });

            document.querySelector('.view-all-link').addEventListener('click', (e) => {
                e.preventDefault();
                showPage('all-tasks-page');
                renderTasks(tasksListContainer);
            });

            function showToastNotification(message, type = 'success') {
                const toast = document.createElement('div');
                toast.classList.add('toast-notification');
                if (type === 'error') {
                    toast.style.backgroundColor = '#e74c3c';
                    toast.style.color = '#ffffff';
                }
                toast.textContent = message;
                toastContainer.appendChild(toast);

                setTimeout(() => {
                    toast.classList.add('show');
                }, 10);

                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        toast.remove();
                    }, 400);
                }, 3000);
            }

            function addNotificationToHistory(message) {
                const notification = {
                    id: Date.now(),
                    message: message,
                    timestamp: new Date().toLocaleTimeString(),
                };
                notifications.unshift(notification);
                localStorage.setItem('notifications', JSON.stringify(notifications));
                renderNotifications();
            }
            
            function renderNotifications() {
                notificationList.innerHTML = '';
                if (notifications.length === 0) {
                    notificationList.innerHTML = '<li class="notification-item" style="text-align: center; color: var(--secondary-text-color);">No notifications yet.</li>';
                    return;
                }
                notifications.forEach(n => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('notification-item');
                    listItem.textContent = `${n.message} (${n.timestamp})`;
                    notificationList.appendChild(listItem);
                });
            }

            notificationBell.addEventListener('click', () => {
                notificationCenterVisible = !notificationCenterVisible;
                if (notificationCenterVisible) {
                    notificationCenter.style.display = 'block';
                } else {
                    notificationCenter.style.display = 'none';
                }
            });

            window.addEventListener('click', (e) => {
                if (notificationCenterVisible && !notificationBell.contains(e.target) && !notificationCenter.contains(e.target)) {
                    notificationCenter.style.display = 'none';
                    notificationCenterVisible = false;
                }
            });

            function saveTasks() {
                localStorage.setItem('tasks', JSON.stringify(tasks));
                updateStats();
                renderTodayTasks();
            }

            function updateStats() {
                const total = tasks.length;
                const completed = tasks.filter(t => t.completed).length;
                const pending = total - completed;

                totalTasksCount.textContent = total;
                completedTasksCount.textContent = completed;
                pendingTasksCount.textContent = pending;
            }

            function renderTaskItem(task, container, isBrief = false) {
                const listItem = document.createElement('li');
                listItem.classList.add('task-item');
                if (task.completed) {
                    listItem.classList.add('completed');
                }

                const dueDateDisplay = task.dueDate ? `<span class="due-date"><i class="far fa-calendar-alt"></i> ${task.dueDate}</span>` : '';

                const taskMeta = isBrief ? '' : `
                    <div class="task-meta">
                        <span class="priority-label ${task.priority}">${task.priority}</span>
                        <span class="tag-label ${task.tag}">${task.tag}</span>
                        ${dueDateDisplay}
                    </div>
                `;
                const actions = isBrief ? '' : `
                    <div class="actions">
                        <button class="edit-btn" data-id="${task.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" data-id="${task.id}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;

                listItem.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-info">
                        <span class="task-text">${task.text}</span>
                        ${taskMeta}
                    </div>
                    ${actions}
                `;

                listItem.querySelector('.task-checkbox').addEventListener('change', () => {
                    task.completed = !task.completed;
                    saveTasks();
                    renderTasks(tasksListContainer);
                    renderTodayTasks();
                    showToastNotification(task.completed ? 'Task marked as completed!' : 'Task moved to To-Do.');
                    addNotificationToHistory(task.completed ? 'Task marked as completed!' : 'Task moved to To-Do.');
                });

                if (!isBrief) {
                    listItem.querySelector('.edit-btn').addEventListener('click', (event) => {
                        const taskId = event.currentTarget.dataset.id;
                        openEditModal(taskId);
                    });

                    listItem.querySelector('.delete-btn').addEventListener('click', (event) => {
                        const taskId = event.currentTarget.dataset.id;
                        openDeleteModal(taskId);
                    });
                }

                container.appendChild(listItem);
            }

            function renderTasks(container) {
                container.innerHTML = '';

                let filteredTasks = tasks.filter(task => {
                    if (currentFilter === 'all') return true;
                    if (currentFilter === 'todo') return !task.completed;
                    if (currentFilter === 'completed') return task.completed;
                    return true;
                });

                const sortBy = document.getElementById('sort-by').value;
                if (sortBy === 'date') {
                    filteredTasks.sort((a, b) => {
                        const dateA = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000); 
                        const dateB = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
                        return dateA - dateB;
                    });
                } else if (sortBy === 'priority') {
                    const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
                    filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                }

                if (filteredTasks.length === 0) {
                    container.innerHTML = '<p style="text-align: center; color: var(--secondary-text-color); padding: 20px;">No tasks found.</p>';
                    return;
                }

                filteredTasks.forEach(task => renderTaskItem(task, container));
            }

            function renderTodayTasks() {
                todayTasksListContainer.innerHTML = '';
                const today = new Date().toISOString().slice(0, 10);
                const todayTasks = tasks.filter(t => t.dueDate === today);

                if (todayTasks.length === 0) {
                    todayTasksListContainer.innerHTML = '<p style="text-align: center; color: var(--secondary-text-color); padding: 10px;">No tasks for today.</p>';
                    return;
                }
                todayTasks.forEach(task => renderTaskItem(task, todayTasksListContainer, true));
            }

            addTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const taskText = taskInput.value.trim();
                const dueDate = dueDateInput.value.trim();

                if (taskText === '' || dueDate === '') {
                    showToastNotification('Please fill in all required fields.', 'error');
                    return;
                }

                const newTask = {
                    id: Date.now(),
                    text: taskText,
                    details: taskDetails.value.trim(),
                    priority: prioritySelect.value,
                    dueDate: dueDate,
                    tag: tagSelect.value,
                    completed: false
                };
                tasks.push(newTask);
                saveTasks();
                showToastNotification('Task added successfully!');
                addNotificationToHistory('Task added successfully!');
                addTaskForm.reset();
                showPage('home-page');
            });

            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentFilter = btn.dataset.filter;
                    renderTasks(tasksListContainer);
                });
            });

            document.getElementById('sort-by').addEventListener('change', () => {
                renderTasks(tasksListContainer);
            });

            // Modal Functions
            function openEditModal(taskId) {
                const task = tasks.find(t => t.id == taskId);
                if (task) {
                    editTaskId.value = task.id;
                    editTaskTitle.value = task.text;
                    editTaskDetails.value = task.details;
                    editPrioritySelect.value = task.priority;
                    editDueDateInput.value = task.dueDate;
                    editTagSelect.value = task.tag;
                    editModal.style.display = 'flex';
                }
            }

            function openDeleteModal(taskId) {
                taskIdToDelete = taskId;
                deleteModal.style.display = 'flex';
            }

            function closeModals() {
                editModal.style.display = 'none';
                deleteModal.style.display = 'none';
            }

            closeEditModalBtn.addEventListener('click', closeModals);
            closeDeleteModalBtn.addEventListener('click', closeModals);
            cancelDeleteBtn.addEventListener('click', closeModals);

            window.addEventListener('click', (e) => {
                if (e.target === editModal || e.target === deleteModal) {
                    closeModals();
                }
            });

            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const taskId = editTaskId.value;
                const taskIndex = tasks.findIndex(t => t.id == taskId);
                const dueDate = editDueDateInput.value.trim();
                const taskText = editTaskTitle.value.trim();


                if (taskText === '' || dueDate === '') {
                    showToastNotification('Please fill in all required fields.', 'error');
                    return;
                }

                if (taskIndex !== -1) {
                    tasks[taskIndex].text = taskText;
                    tasks[taskIndex].details = editTaskDetails.value.trim();
                    tasks[taskIndex].priority = editPrioritySelect.value;
                    tasks[taskIndex].dueDate = dueDate;
                    tasks[taskIndex].tag = editTagSelect.value;
                    saveTasks();
                    renderTasks(tasksListContainer);
                    showToastNotification('Task updated successfully!');
                    addNotificationToHistory('Task updated successfully!');
                    closeModals();
                }
            });

            confirmDeleteBtn.addEventListener('click', () => {
                if (taskIdToDelete !== null) {
                    tasks = tasks.filter(t => t.id != taskIdToDelete);
                    saveTasks();
                    renderTasks(tasksListContainer);
                    showToastNotification('Task deleted successfully!');
                    addNotificationToHistory('Task deleted successfully!');
                    closeModals();
                }
            });

            updateStats();
            renderTodayTasks();
            renderNotifications();
            showPage('home-page');
        });