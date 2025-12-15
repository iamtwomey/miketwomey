document.addEventListener('DOMContentLoaded', () => {
    console.log('Windows XP initialized');

    // Clock
    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        document.getElementById('clock').textContent = `${hours}:${minutes} ${ampm}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Window Management
    let zIndexCounter = 100;

    class WindowManager {
        constructor() {
            this.desktop = document.getElementById('window-area');
            this.taskList = document.getElementById('task-list');
            this.windows = [];
            this.activeWindow = null;

            // Global drag state
            this.isDragging = false;
            this.dragTarget = null;
            this.dragOffsetX = 0;
            this.dragOffsetY = 0;

            document.addEventListener('mousemove', (e) => this.onMouseMove(e));
            document.addEventListener('mouseup', () => this.onMouseUp());
        }

        createWindow(title, contentHtml, options = {}) {
            const id = 'win-' + Date.now();
            const winEl = document.createElement('div');
            winEl.className = 'window active';
            winEl.id = id;
            winEl.style.left = (options.x || 50 + (this.windows.length * 20)) + 'px';
            winEl.style.top = (options.y || 50 + (this.windows.length * 20)) + 'px';
            winEl.style.width = (options.width || 400) + 'px';
            winEl.style.height = (options.height || 300) + 'px';
            winEl.style.zIndex = ++zIndexCounter;

            const iconSrc = options.icon || 'assets/default-icon.png';

            winEl.innerHTML = `
                <div class="window-header">
                    <div class="window-title">
                        <img src="${iconSrc}" alt="">
                        <span>${title}</span>
                    </div>
                    <div class="window-controls">
                        <button class="window-button btn-minimize">_</button>
                        <button class="window-button btn-maximize">□</button>
                        <button class="window-button btn-close">X</button>
                    </div>
                </div>
                <div class="window-content">
                    <div class="window-body-inner">
                        ${contentHtml}
                    </div>
                </div>
            `;

            this.desktop.appendChild(winEl);
            this.windows.push(winEl);

            // Create Taskbar Item
            const taskItem = document.createElement('div');
            taskItem.className = 'taskbar-item active';
            taskItem.id = 'task-' + id;
            taskItem.innerHTML = `<img src="${iconSrc}" alt=""><span>${title}</span>`;
            taskItem.addEventListener('click', () => this.toggleWindow(winEl));
            this.taskList.appendChild(taskItem);
            winEl.taskItem = taskItem;

            this.setActive(winEl);

            // Bind events
            const header = winEl.querySelector('.window-header');
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('.window-button')) return;
                this.startDrag(e, winEl);
                this.setActive(winEl);
            });

            winEl.addEventListener('mousedown', () => this.setActive(winEl));

            winEl.querySelector('.btn-close').addEventListener('click', () => this.closeWindow(winEl));
            winEl.querySelector('.btn-minimize').addEventListener('click', () => this.minimizeWindow(winEl));

            // Maximize logic (simple toggle)
            let isMaximized = false;
            let preRect = {};
            winEl.querySelector('.btn-maximize').addEventListener('click', () => {
                if (isMaximized) {
                    winEl.style.left = preRect.left;
                    winEl.style.top = preRect.top;
                    winEl.style.width = preRect.width;
                    winEl.style.height = preRect.height;
                    isMaximized = false;
                } else {
                    preRect = {
                        left: winEl.style.left,
                        top: winEl.style.top,
                        width: winEl.style.width,
                        height: winEl.style.height
                    };
                    winEl.style.left = '0';
                    winEl.style.top = '0';
                    winEl.style.width = '100%';
                    winEl.style.height = 'calc(100% - 30px)'; // Subtract taskbar height
                    isMaximized = true;
                }
            });

            return winEl;
        }

        closeWindow(winEl) {
            winEl.remove();
            if (winEl.taskItem) winEl.taskItem.remove();
            this.windows = this.windows.filter(w => w !== winEl);
        }

        minimizeWindow(winEl) {
            winEl.style.display = 'none';
            winEl.classList.remove('active');
            if (winEl.taskItem) winEl.taskItem.classList.remove('active');
            this.activeWindow = null;
        }

        toggleWindow(winEl) {
            if (winEl.style.display === 'none') {
                winEl.style.display = 'flex';
                this.setActive(winEl);
            } else {
                if (this.activeWindow === winEl) {
                    this.minimizeWindow(winEl);
                } else {
                    this.setActive(winEl);
                }
            }
        }

        setActive(winEl) {
            if (this.activeWindow === winEl) return;

            // Deactivate current
            if (this.activeWindow) {
                this.activeWindow.classList.remove('active');
                if (this.activeWindow.taskItem) this.activeWindow.taskItem.classList.remove('active');
            }

            this.activeWindow = winEl;
            winEl.classList.add('active');
            winEl.style.zIndex = ++zIndexCounter;
            if (winEl.taskItem) winEl.taskItem.classList.add('active');
        }

        startDrag(e, winEl) {
            this.isDragging = true;
            this.dragTarget = winEl;
            const rect = winEl.getBoundingClientRect();
            this.dragOffsetX = e.clientX - rect.left;
            this.dragOffsetY = e.clientY - rect.top;
        }

        onMouseMove(e) {
            if (!this.isDragging || !this.dragTarget) return;

            const x = e.clientX - this.dragOffsetX;
            const y = e.clientY - this.dragOffsetY;

            this.dragTarget.style.left = x + 'px';
            this.dragTarget.style.top = y + 'px';
        }

        onMouseUp() {
            this.isDragging = false;
            this.dragTarget = null;
        }
    }

    const wm = new WindowManager();
    window.wm = wm; // Expose to global scope for debugging/icons

    // Test Window
    wm.createWindow('Welcome', '<h1>Welcome to Windows XP</h1><p>This is a pure HTML/CSS/JS recreation.</p>', { icon: 'assets/notepad.png' });

    // Desktop Icons
    function createDesktopIcon(name, iconSrc, onOpen) {
        const iconEl = document.createElement('div');
        iconEl.className = 'desktop-icon';
        iconEl.innerHTML = `
            <img src="${iconSrc}" alt="${name}">
            <span>${name}</span>
        `;

        iconEl.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            iconEl.classList.add('selected');
        });

        iconEl.addEventListener('dblclick', () => {
            onOpen();
        });

        document.getElementById('desktop').appendChild(iconEl);
    }

    // Deselect icons on desktop click
    document.getElementById('desktop').addEventListener('click', (e) => {
        if (e.target.id === 'desktop') {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        }
    });

    // Initial Icons
    createDesktopIcon('My Computer', 'assets/my-computer.png', () => {
        wm.createWindow('My Computer', '<p>System Information...</p>', { icon: 'assets/my-computer.png' });
    });

    createDesktopIcon('Recycle Bin', 'assets/recycle-bin.png', () => {
        wm.createWindow('Recycle Bin', '<p>Recycle Bin is empty.</p>', { icon: 'assets/recycle-bin.png' });
    });

    createDesktopIcon('Notepad', 'assets/notepad.png', () => {
        wm.createWindow('Untitled - Notepad', '<textarea style="width:100%;height:100%;border:none;resize:none;font-family:monospace;"></textarea>', { icon: 'assets/notepad.png' });
    });

    // Start Menu Toggle
    const startButton = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');

    startButton.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && e.target !== startButton) {
            startMenu.classList.add('hidden');
        }
    });
});
